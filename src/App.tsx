import React, { useState, useEffect, useRef } from 'react';
import { 
  AppData, 
  Order, 
  Task, 
  Product, 
  StockMovement, 
  MaterialUsage,
  ProgressLog,
  TechnicianUser
} from './types';
import { 
  loadStoredData, 
  saveStoredData, 
  resetStoredData 
} from './services/storage';
import { Sidebar, NavView } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/OrdersView';
import { TasksView } from './components/TasksView';
import { InventoryView } from './components/InventoryView';
import { TechniciansView } from './components/TechniciansView';
import { ReportsView } from './components/ReportsView';
import { BodegaWorkerView } from './components/BodegaWorkerView';
import { ImageViewerModal } from './components/ImageViewerModal';
import { ProjectExporterModal } from './components/ProjectExporterModal';
import { InstallAppModal } from './components/InstallAppModal';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { loadOrSeedCloudData, saveCloudData } from './services/cloudData';

type CloudSyncStatus = 'local' | 'loading' | 'syncing' | 'synced' | 'error';

export default function App() {
  const [data, setData] = useState<AppData>(() => loadStoredData());
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('local');
  const latestData = useRef(data);
  const cloudReady = useRef(false);
  const skipNextCloudWrite = useRef(false);
  const cloudWriteQueue = useRef<Promise<void>>(Promise.resolve());
  const cloudRevision = useRef(0);
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [appMode, setAppMode] = useState<'admin' | 'bodega'>('admin');
  const [currentTechnician, setCurrentTechnician] = useState<string>(() => data.teamMembers[0] || 'Técnico Demo 1');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Mobile Drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInstallAppModalOpen, setIsInstallAppModalOpen] = useState(false);
  const [isProjectExporterOpen, setIsProjectExporterOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState<{ url: string; caption?: string } | null>(null);

  useEffect(() => {
    latestData.current = data;
  }, [data]);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      cloudReady.current = false;
      if (!user) {
        setCloudSyncStatus('local');
        return;
      }

      setCloudSyncStatus('loading');
      try {
        const loaded = await loadOrSeedCloudData(latestData.current);
        if (!active) return;
        if (!loaded.data) throw new Error('Firebase no devolvió los datos del espacio de trabajo.');
        skipNextCloudWrite.current = true;
        latestData.current = loaded.data;
        cloudRevision.current = loaded.revision;
        saveStoredData(loaded.data);
        setData(loaded.data);
        cloudReady.current = true;
        setCloudSyncStatus('synced');
      } catch (error) {
        if (!active) return;
        console.error('No se pudo sincronizar GestorPro con Firebase:', error);
        setCloudSyncStatus('error');
      }
    });
    return () => {
      active = false;
      cloudReady.current = false;
      unsubscribe();
    };
  }, []);

  // Keep a local cache and synchronize signed-in admin data to Firestore.
  useEffect(() => {
    saveStoredData(data);
    if (skipNextCloudWrite.current) {
      skipNextCloudWrite.current = false;
      return;
    }
    if (!cloudReady.current) return;

    const snapshot = data;
    const timer = window.setTimeout(() => {
      setCloudSyncStatus('syncing');
      cloudWriteQueue.current = cloudWriteQueue.current
        .catch(() => undefined)
        .then(async () => {
          cloudRevision.current = await saveCloudData(snapshot, cloudRevision.current);
          setCloudSyncStatus('synced');
        })
        .catch((error) => {
          console.error('No se pudo guardar GestorPro en Firebase:', error);
          setCloudSyncStatus('error');
        });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [data]);

  // Quick counts for navigation
  const activeOrdersCount = data.orders.filter(o => o.status !== 'Completada' && o.status !== 'Cancelada').length;
  const pendingTasksCount = data.tasks.filter(t => t.status !== 'Finalizada').length;
  const lowStockCount = data.products.filter(p => p.stock <= p.minStock).length;

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  // Orders
  const handleSaveOrder = (savedOrder: Order) => {
    setData(prev => {
      const exists = prev.orders.some(o => o.id === savedOrder.id);
      const newOrders = exists
        ? prev.orders.map(o => o.id === savedOrder.id ? savedOrder : o)
        : [savedOrder, ...prev.orders];
      return { ...prev, orders: newOrders };
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    setData(prev => ({
      ...prev,
      orders: prev.orders.filter(o => o.id !== orderId)
    }));
    if (selectedOrderId === orderId) {
      setSelectedOrderId(null);
    }
  };

  // Assign Material from Inventory to Order (Updates Stock, adds Kardex movement, increments order actualCost and adds log)
  const handleAssignMaterial = (
    orderId: string, 
    productId: string, 
    quantity: number
  ): { success: boolean; message: string } => {
    const product = data.products.find(p => p.id === productId);
    const order = data.orders.find(o => o.id === orderId);

    if (!product) return { success: false, message: 'Producto no encontrado en inventario.' };
    if (!order) return { success: false, message: 'Orden de reparación no encontrada.' };
    if (quantity <= 0) return { success: false, message: 'La cantidad a utilizar debe ser mayor a 0.' };
    if (product.stock < quantity) {
      return { 
        success: false, 
        message: `Stock insuficiente en almacén. Solo hay ${product.stock} ${product.unit}(s) disponibles de este repuesto.` 
      };
    }

    const previousStock = product.stock;
    const newStock = previousStock - quantity;
    const totalCost = quantity * product.unitPrice;

    const newMaterialUsage: MaterialUsage = {
      id: `mat-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity,
      unitCost: product.unitPrice,
      totalCost,
      assignedAt: new Date().toISOString()
    };

    // Kardex movement for inventory reduction
    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'SALIDA',
      quantity,
      previousStock,
      newStock,
      reason: `Baja por consumo en reparación ${order.code} (${order.title})`,
      orderCode: order.code,
      user: order.assignedTo.split(' ')[0] || 'Técnico'
    };

    // Automatic progress log in the repair order
    const materialLog: ProgressLog = {
      id: `up-mat-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: order.assignedTo.split(' ')[0] || 'Técnico Responsable',
      note: `Baja de inventario ejecutada: Se tomaron ${quantity} ${product.unit}(s) de "${product.name}" (${product.sku}) para reparar el equipo. Se dio de baja en almacén (saldo actual: ${newStock}). Costo cargado a la orden: $${totalCost.toFixed(2)}.`,
      type: 'material',
      photos: []
    };

    // Update state atomically
    setData(prev => {
      // 1. Update product stock in inventory
      const updatedProducts = prev.products.map(p => 
        p.id === productId ? { ...p, stock: newStock, lastUpdated: new Date().toISOString().slice(0, 10) } : p
      );

      // 2. Update order materials, cost and timeline
      const updatedOrders = prev.orders.map(o => {
        if (o.id === orderId) {
          const currentMaterials = o.materialsUsed || [];
          const currentUpdates = o.updates || [];
          return {
            ...o,
            actualCost: (o.actualCost || 0) + totalCost,
            materialsUsed: [...currentMaterials, newMaterialUsage],
            updates: [materialLog, ...currentUpdates]
          };
        }
        return o;
      });

      // 3. Prepend movement to Kardex
      const updatedMovements = [newMovement, ...prev.movements];

      return {
        ...prev,
        products: updatedProducts,
        orders: updatedOrders,
        movements: updatedMovements
      };
    });

    return { 
      success: true, 
      message: `¡Repuesto dado de baja en inventario! Se retiraron ${quantity} ${product.unit}(s) de ${product.name} y se registraron en la orden ${order.code}.` 
    };
  };

  // Return / Revert Material back to Inventory
  const handleReturnMaterial = (
    orderId: string,
    materialUsageId: string
  ): { success: boolean; message: string } => {
    const order = data.orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Orden no encontrada.' };

    const materialItem = order.materialsUsed?.find(m => m.id === materialUsageId);
    if (!materialItem) return { success: false, message: 'Registro de repuesto no encontrado en la orden.' };

    const product = data.products.find(p => p.id === materialItem.productId);
    const previousStock = product ? product.stock : 0;
    const newStock = previousStock + materialItem.quantity;

    // Movement in Kardex for restocking
    const restockMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: materialItem.productId,
      productName: materialItem.productName,
      sku: materialItem.sku,
      type: 'ENTRADA',
      quantity: materialItem.quantity,
      previousStock,
      newStock,
      reason: `Reintegro por devolución de repuesto desde orden ${order.code}`,
      orderCode: order.code,
      user: order.assignedTo.split(' ')[0] || 'Técnico'
    };

    const restockLog: ProgressLog = {
      id: `up-mat-ret-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: order.assignedTo.split(' ')[0] || 'Técnico',
      note: `Reintegro a almacén: Se devolvieron ${materialItem.quantity} pieza(s) de "${materialItem.productName}" (${materialItem.sku}) al inventario. Costo descontado de la orden: -$${materialItem.totalCost.toFixed(2)}.`,
      type: 'material',
      photos: []
    };

    setData(prev => {
      // 1. Restore product stock in inventory
      const updatedProducts = prev.products.map(p => 
        p.id === materialItem.productId ? { ...p, stock: newStock, lastUpdated: new Date().toISOString().slice(0, 10) } : p
      );

      // 2. Remove material from order and decrement cost
      const updatedOrders = prev.orders.map(o => {
        if (o.id === orderId) {
          const currentMaterials = (o.materialsUsed || []).filter(m => m.id !== materialUsageId);
          const currentUpdates = o.updates || [];
          return {
            ...o,
            actualCost: Math.max(0, (o.actualCost || 0) - materialItem.totalCost),
            materialsUsed: currentMaterials,
            updates: [restockLog, ...currentUpdates]
          };
        }
        return o;
      });

      // 3. Prepend movement to Kardex
      const updatedMovements = [restockMovement, ...prev.movements];

      return {
        ...prev,
        products: updatedProducts,
        orders: updatedOrders,
        movements: updatedMovements
      };
    });

    return {
      success: true,
      message: `¡Repuesto reintegrado al inventario con éxito! Stock actualizado a ${newStock}.`
    };
  };

  // Tasks
  const handleSaveTask = (savedTask: Task) => {
    setData(prev => {
      const exists = prev.tasks.some(t => t.id === savedTask.id);
      const newTasks = exists
        ? prev.tasks.map(t => t.id === savedTask.id ? savedTask : t)
        : [savedTask, ...prev.tasks];
      return { ...prev, tasks: newTasks };
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    }));
  };

  // Inventory Products
  const handleSaveProduct = (savedProduct: Product) => {
    setData(prev => {
      const exists = prev.products.some(p => p.id === savedProduct.id);
      const newProducts = exists
        ? prev.products.map(p => p.id === savedProduct.id ? savedProduct : p)
        : [savedProduct, ...prev.products];
      return { ...prev, products: newProducts };
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId)
    }));
  };

  // Technicians / Bodega Users
  const handleSaveTechnician = (savedTech: TechnicianUser) => {
    setData(prev => {
      const exists = prev.technicians.some(t => t.id === savedTech.id);
      const newTechs = exists
        ? prev.technicians.map(t => t.id === savedTech.id ? savedTech : t)
        : [...prev.technicians, savedTech];
      const teamList = newTechs.map(t => `${t.fullName} (${t.specialty.split(' ')[0]})`);
      return { ...prev, technicians: newTechs, teamMembers: teamList };
    });
  };

  const handleDeleteTechnician = (techId: string) => {
    setData(prev => {
      const newTechs = prev.technicians.filter(t => t.id !== techId);
      const teamList = newTechs.map(t => `${t.fullName} (${t.specialty.split(' ')[0]})`);
      return { ...prev, technicians: newTechs, teamMembers: teamList };
    });
  };

  // Stock Movement (Entrada o Salida manual)
  const handleRegisterStockMovement = (
    productId: string,
    type: 'ENTRADA' | 'SALIDA',
    quantity: number,
    reason: string,
    orderCode?: string,
    referenceDoc?: string
  ): { success: boolean; message: string } => {
    const product = data.products.find(p => p.id === productId);
    if (!product) return { success: false, message: 'Producto no encontrado.' };
    if (quantity <= 0) return { success: false, message: 'La cantidad debe ser mayor a 0.' };

    if (type === 'SALIDA' && product.stock < quantity) {
      return { 
        success: false, 
        message: `Stock insuficiente. Disponible actual: ${product.stock} ${product.unit}s.` 
      };
    }

    const previousStock = product.stock;
    const newStock = type === 'ENTRADA' ? previousStock + quantity : previousStock - quantity;

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type,
      quantity,
      previousStock,
      newStock,
      reason,
      orderCode,
      referenceDoc,
      user: 'Supervisor de Turno'
    };

    setData(prev => {
      const updatedProducts = prev.products.map(p => 
        p.id === productId ? { ...p, stock: newStock, lastUpdated: new Date().toISOString().slice(0, 10) } : p
      );
      return {
        ...prev,
        products: updatedProducts,
        movements: [newMovement, ...prev.movements]
      };
    });

    return { 
      success: true, 
      message: `Movimiento de ${type} registrado con éxito. Nuevo stock: ${newStock} ${product.unit}s.` 
    };
  };

  // Restore & Reset Data
  const handleRestoreData = (restored: AppData) => {
    setData(restored);
  };

  const handleResetData = () => {
    const fresh = resetStoredData();
    setData(fresh);
  };

  // Quick Open Modal from Topbar
  const handleOpenCreateModal = () => {
    if (currentView === 'orders' || currentView === 'dashboard') {
      setCurrentView('orders');
      setSelectedOrderId(null);
      const btn = document.querySelector('button:has(svg.lucide-plus)') as HTMLButtonElement;
      if (btn) btn.click();
    } else if (currentView === 'tasks') {
      const btn = document.querySelector('button:has(svg.lucide-plus)') as HTMLButtonElement;
      if (btn) btn.click();
    } else if (currentView === 'inventory') {
      const btn = document.querySelector('button:has(svg.lucide-plus)') as HTMLButtonElement;
      if (btn) btn.click();
    } else if (currentView === 'technicians') {
      const btn = document.querySelector('button:has(svg.lucide-user-plus)') as HTMLButtonElement;
      if (btn) btn.click();
    } else {
      setIsProjectExporterOpen(true);
    }
  };

  const handleOpenPhoto = (url: string, caption?: string) => {
    setActivePhoto({ url, caption });
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          if (view !== 'orders') setSelectedOrderId(null);
        }}
        openNewOrderModal={() => {
          setCurrentView('orders');
          setSelectedOrderId(null);
          setTimeout(() => {
            const btn = document.querySelector('button:has(svg.lucide-plus)') as HTMLButtonElement;
            if (btn) btn.click();
          }, 50);
        }}
        openProjectExporter={() => setIsProjectExporterOpen(true)}
        appMode={appMode}
        onToggleMode={setAppMode}
        counts={{
          activeOrders: activeOrdersCount,
          pendingTasks: pendingTasksCount,
          lowStockCount: lowStockCount,
          techniciansCount: data.technicians?.length || 0
        }}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar Header */}
        <Topbar
          currentView={currentView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenProjectExporter={() => setIsProjectExporterOpen(true)}
          onOpenInstallModal={() => setIsInstallAppModalOpen(true)}
          appMode={appMode}
          onToggleMode={setAppMode}
          currentTechnicianName={currentTechnician}
          cloudSyncStatus={cloudSyncStatus}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {appMode === 'bodega' ? (
              <BodegaWorkerView
                orders={data.orders}
                tasks={data.tasks}
                products={data.products}
                teamMembers={data.teamMembers}
                technicians={data.technicians || []}
                currentTechnician={currentTechnician}
                onSelectTechnician={setCurrentTechnician}
                onSaveOrder={handleSaveOrder}
                onSaveTask={handleSaveTask}
                onAssignMaterial={handleAssignMaterial}
                onReturnMaterial={handleReturnMaterial}
                onOpenPhoto={handleOpenPhoto}
              />
            ) : (
              <>
                {currentView === 'dashboard' && (
                  <DashboardView
                    data={data}
                    onNavigate={(v) => {
                      setCurrentView(v);
                      if (v !== 'orders') setSelectedOrderId(null);
                    }}
                    onOpenOrder={(id) => {
                      setSelectedOrderId(id);
                      setCurrentView('orders');
                    }}
                    onOpenNewOrder={() => {
                      setCurrentView('orders');
                      setSelectedOrderId(null);
                    }}
                    onOpenNewTask={() => setCurrentView('tasks')}
                    onOpenPhoto={handleOpenPhoto}
                    onRegisterStockMovement={handleRegisterStockMovement}
                  />
                )}

                {currentView === 'orders' && (
                  <OrdersView
                    orders={data.orders}
                    products={data.products}
                    teamMembers={data.teamMembers}
                    categories={data.categories}
                    selectedOrderId={selectedOrderId}
                    onSelectOrder={setSelectedOrderId}
                    onSaveOrder={handleSaveOrder}
                    onDeleteOrder={handleDeleteOrder}
                    onAssignMaterial={handleAssignMaterial}
                    onReturnMaterial={handleReturnMaterial}
                    onOpenPhoto={handleOpenPhoto}
                  />
                )}

                {currentView === 'tasks' && (
                  <TasksView
                    tasks={data.tasks}
                    orders={data.orders}
                    teamMembers={data.teamMembers}
                    onSaveTask={handleSaveTask}
                    onDeleteTask={handleDeleteTask}
                    onOpenPhoto={handleOpenPhoto}
                    onOpenOrder={(orderId) => {
                      setSelectedOrderId(orderId);
                      setCurrentView('orders');
                    }}
                  />
                )}

                {currentView === 'inventory' && (
                  <InventoryView
                    products={data.products}
                    movements={data.movements}
                    orders={data.orders}
                    inventoryCategories={[
                      'Baterías & Eléctrico',
                      'Motores & Carburación',
                      'Transmisión & Cadenas',
                      'Frenos & Suspensión',
                      'Llantas & Neumáticos',
                      'Mandos & Controles',
                      'Chasis & Carrocería'
                    ]}
                    onSaveProduct={handleSaveProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onRegisterStockMovement={handleRegisterStockMovement}
                  />
                )}

                {currentView === 'technicians' && (
                  <TechniciansView
                    technicians={data.technicians || []}
                    orders={data.orders}
                    tasks={data.tasks}
                    onSaveTechnician={handleSaveTechnician}
                    onDeleteTechnician={handleDeleteTechnician}
                  />
                )}

                {currentView === 'reports' && (
                  <ReportsView data={data} />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Image Viewer Modal */}
      <ImageViewerModal
        isOpen={Boolean(activePhoto)}
        imageUrl={activePhoto?.url ?? null}
        caption={activePhoto?.caption}
        onClose={() => setActivePhoto(null)}
      />

      {/* Global Project Exporter / GitHub / Firebase Modal */}
      <ProjectExporterModal
        isOpen={isProjectExporterOpen}
        onClose={() => setIsProjectExporterOpen(false)}
        currentData={data}
        onRestoreData={handleRestoreData}
        onResetData={handleResetData}
      />
    </div>
  );
}
