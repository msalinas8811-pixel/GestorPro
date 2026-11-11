import React, { useState } from 'react';
import { 
  Wrench, 
  Package, 
  CheckSquare, 
  Camera, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  ArrowRight, 
  Plus, 
  RotateCcw,
  User,
  MapPin,
  X,
  Layers,
  ChevronRight,
  Boxes,
  KeyRound,
  ShieldCheck,
  Lock,
  Unlock,
  Check
} from 'lucide-react';
import { Order, Task, Product, OrderStatus, ProgressLog, MaterialUsage, TechnicianUser } from '../types';

interface BodegaWorkerViewProps {
  orders: Order[];
  tasks: Task[];
  products: Product[];
  teamMembers: string[];
  technicians?: TechnicianUser[];
  currentTechnician: string;
  onSelectTechnician: (tech: string) => void;
  onSaveOrder: (order: Order) => void;
  onSaveTask: (task: Task) => void;
  onAssignMaterial: (orderId: string, productId: string, quantity: number) => { success: boolean; message: string };
  onReturnMaterial?: (orderId: string, materialUsageId: string) => { success: boolean; message: string };
  onOpenPhoto: (url: string, caption?: string) => void;
}

export const BodegaWorkerView: React.FC<BodegaWorkerViewProps> = ({
  orders,
  tasks,
  products,
  teamMembers,
  technicians = [],
  currentTechnician,
  onSelectTechnician,
  onSaveOrder,
  onSaveTask,
  onAssignMaterial,
  onReturnMaterial,
  onOpenPhoto
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'tasks' | 'inventory'>('orders');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Operator PIN Login Modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedTechForLogin, setSelectedTechForLogin] = useState<TechnicianUser | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Form states for adding progress inside repair
  const [workNote, setWorkNote] = useState('');
  const [workProgress, setWorkProgress] = useState<number>(50);
  const [workPhotos, setWorkPhotos] = useState<string[]>([]);
  const [workStatus, setWorkStatus] = useState<OrderStatus>('En Proceso');

  // Spare part consumption form
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [partFeedback, setPartFeedback] = useState<{ text: string; error: boolean } | null>(null);

  // Active Technician Object
  const currentTechObj = technicians.find(
    t => t.fullName.toLowerCase() === currentTechnician.toLowerCase() ||
         t.fullName.split(' ')[0].toLowerCase() === currentTechnician.split(' ')[0].toLowerCase()
  );

  // Filter orders assigned to this technician (or all if 'Todos')
  const myOrders = orders.filter(o => {
    const matchesTech = currentTechnician === 'Todos' || o.assignedTo.includes(currentTechnician.split(' ')[0]);
    const matchesSearch = 
      o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTech && matchesSearch;
  });

  // Filter tasks assigned to this technician
  const myTasks = tasks.filter(t => {
    const matchesTech = currentTechnician === 'Todos' || t.assignedTo.includes(currentTechnician.split(' ')[0]);
    const matchesSearch = 
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTech && matchesSearch;
  });

  // Selected Order details
  const activeOrder = orders.find(o => o.id === selectedOrderId);
  const chosenPart = products.find(p => p.id === selectedPartId);

  // Available statuses in repair flow
  const orderStatuses: OrderStatus[] = [
    'Pendiente',
    'En Diagnóstico',
    'En Proceso',
    'En Espera',
    'En Pruebas',
    'Completada'
  ];

  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    const progressVal = newStatus === 'Completada' ? 100 : newStatus === 'En Pruebas' ? 85 : newStatus === 'En Proceso' ? 50 : 20;
    const log: ProgressLog = {
      id: `up-st-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: currentTechnician === 'Todos' ? (currentTechObj?.fullName || 'Técnico de Taller') : currentTechnician,
      note: `Cambio de estatus operativo a: "${newStatus}"`,
      progressPercent: progressVal,
      photos: [],
      type: 'estado'
    };

    const updated: Order = {
      ...order,
      status: newStatus,
      progress: progressVal,
      completedAt: newStatus === 'Completada' ? new Date().toISOString() : order.completedAt,
      updates: [log, ...(order.updates || [])]
    };

    onSaveOrder(updated);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setWorkPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddRepairLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    if (!workNote.trim() && workPhotos.length === 0) return;

    const log: ProgressLog = {
      id: `up-bg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: currentTechnician === 'Todos' ? activeOrder.assignedTo : currentTechnician,
      note: workNote.trim() || 'Evidencia fotográfica de reparación adjuntada',
      progressPercent: workProgress,
      photos: [...workPhotos],
      type: workPhotos.length > 0 ? 'foto' : 'nota'
    };

    const updated: Order = {
      ...activeOrder,
      progress: workProgress,
      status: workStatus,
      completedAt: workStatus === 'Completada' ? new Date().toISOString() : activeOrder.completedAt,
      updates: [log, ...(activeOrder.updates || [])]
    };

    onSaveOrder(updated);
    setWorkNote('');
    setWorkPhotos([]);
  };

  const handleTakePartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !selectedPartId) return;

    const res = onAssignMaterial(activeOrder.id, selectedPartId, partQty);
    setPartFeedback({ text: res.message, error: !res.success });
    if (res.success) {
      setSelectedPartId('');
      setPartQty(1);
    }
    setTimeout(() => setPartFeedback(null), 4000);
  };

  const handleToggleTaskChecklist = (task: Task, itemId: string) => {
    const newChecklist = task.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    const completedCount = newChecklist.filter(c => c.completed).length;
    const progress = newChecklist.length > 0 ? Math.round((completedCount / newChecklist.length) * 100) : task.progress;

    const updated: Task = {
      ...task,
      checklist: newChecklist,
      progress,
      status: progress === 100 ? 'Finalizada' : task.status === 'Pendiente' ? 'En Progreso' : task.status,
      completedAt: progress === 100 ? new Date().toISOString() : task.completedAt
    };
    onSaveTask(updated);
  };

  const handleVerifyPinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechForLogin) {
      setPinError('Por favor selecciona un operador de la lista.');
      return;
    }
    if (selectedTechForLogin.pin === pinInput.trim()) {
      onSelectTechnician(selectedTechForLogin.fullName);
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('PIN incorrecto. Consulta con el Administrador para verificar tu clave.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Bodega & Taller Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-950">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider bg-red-600/30 text-red-300 px-2.5 py-0.5 rounded-full font-bold border border-red-500/30">
                Taller & Bodega Importoys SV
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-medium">Motos, Cuadris, Go Karts & Trikes</span>
            </div>
            <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
              Panel Operativo de Reparaciones y Repuestos
            </h2>
          </div>
        </div>

        {/* Technician Active Profile & PIN Switcher */}
        <div className="flex items-center gap-3 bg-slate-800/90 p-2 rounded-xl border border-slate-700 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center">
              {currentTechnician === 'Todos' ? 'ALL' : currentTechnician.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Operario Activo</p>
              <p className="text-xs font-bold text-white leading-tight">
                {currentTechnician}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedTechForLogin(currentTechObj || technicians[0] || null);
              setPinInput('');
              setPinError('');
              setIsPinModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
            title="Cambiar operador o identificarse con PIN"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ingresar con PIN</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation for Bodega */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('orders');
            setSelectedOrderId(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'orders' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4 text-red-500" />
          Órdenes de Reparación Asignadas ({myOrders.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('tasks');
            setSelectedOrderId(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'tasks' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-emerald-500" />
          Tareas y Procedimientos ({myTasks.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('inventory');
            setSelectedOrderId(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'inventory' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4 text-blue-500" />
          Consulta de Repuestos en Bodega ({products.length})
        </button>
      </div>

      {/* TAB 1: REPAIR ORDERS */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Orders List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar vehículo, código, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="space-y-3">
              {myOrders.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-2xl border border-slate-200">
                  <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Sin reparaciones pendientes</p>
                  <p className="text-xs text-slate-400 mt-1">
                    No hay órdenes asignadas con este filtro.
                  </p>
                </div>
              ) : (
                myOrders.map(order => {
                  const isSelected = order.id === selectedOrderId;
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected 
                          ? 'bg-red-50/50 border-red-500 ring-2 ring-red-500/20 shadow-md' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {order.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'Completada' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'En Proceso' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'En Diagnóstico' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'En Espera' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mb-1">
                        {order.title}
                      </h4>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between mt-2">
                        <span>Cliente: <strong className="text-slate-700">{order.clientName}</strong></span>
                        <span className="font-mono text-emerald-600 font-bold">
                          {order.progress}% avance
                        </span>
                      </div>

                      {/* Repuestos used badge */}
                      {order.materialsUsed && order.materialsUsed.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Package className="w-3 h-3 text-red-600" />
                            {order.materialsUsed.length} repuesto(s)
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            ${order.actualCost.toFixed(2)} USD
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Order Detail & Actions */}
          <div className="lg:col-span-7">
            {!activeOrder ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Selecciona una reparación</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Elige una orden de la lista de la izquierda para cambiar su estatus, tomar repuestos de bodega o adjuntar fotografías de avance.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                {/* Header */}
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className="font-mono text-sm font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                      {activeOrder.code}
                    </span>
                    <span className="text-xs text-slate-500">
                      Asignado a: <strong className="text-slate-800">{activeOrder.assignedTo}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {activeOrder.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {activeOrder.description}
                  </p>
                </div>

                {/* Status Stepper Buttons */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Cambiar Estado de la Reparación:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {orderStatuses.map(status => {
                      const isCurrent = activeOrder.status === status;
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(activeOrder, status)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                            isCurrent
                              ? 'bg-red-600 text-white border-red-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TAKE SPARE PART FROM BODEGA (CRITICAL FEATURE) */}
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-700 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-950">
                        Tomar Repuesto de Bodega para esta Reparación
                      </h4>
                      <p className="text-[11px] text-amber-700">
                        Se descontará automáticamente del inventario y se sumará el costo a la orden.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleTakePartSubmit} className="space-y-3">
                    <select
                      value={selectedPartId}
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">-- Buscar repuesto disponible en bodega Importoys --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                          {p.name} ({p.sku}) · Stock: {p.stock} {p.unit}s (${p.unitPrice.toFixed(2)} USD)
                        </option>
                      ))}
                    </select>

                    {chosenPart && (
                      <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1 shadow-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Ubicación: <strong>{chosenPart.location}</strong></span>
                          <span>Disponible: <strong className="font-mono text-emerald-700">{chosenPart.stock} {chosenPart.unit}s</strong></span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-100">
                          <span>Costo a cargar a la orden:</span>
                          <span className="font-mono text-red-600 font-black">${(partQty * chosenPart.unitPrice).toFixed(2)} USD</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <label className="text-[10px] text-slate-500 block mb-0.5">Cantidad:</label>
                        <input
                          type="number"
                          min="1"
                          max={chosenPart ? chosenPart.stock : 999}
                          value={partQty}
                          onChange={(e) => setPartQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div className="flex-1 pt-3.5">
                        <button
                          type="submit"
                          disabled={!selectedPartId}
                          className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                        >
                          <Package className="w-4 h-4" />
                          Dar de Baja en Inventario y Asignar
                        </button>
                      </div>
                    </div>

                    {partFeedback && (
                      <div className={`p-3 rounded-xl text-xs font-semibold ${
                        partFeedback.error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {partFeedback.text}
                      </div>
                    )}
                  </form>

                  {/* List of used parts */}
                  <div className="space-y-2 pt-2 border-t border-amber-200/60">
                    <span className="text-xs font-bold text-slate-700 block">
                      Repuestos ya instalados en esta reparación:
                    </span>
                    {(!activeOrder.materialsUsed || activeOrder.materialsUsed.length === 0) ? (
                      <p className="text-xs text-slate-400 text-center py-3 bg-white/70 rounded-xl border border-dashed border-amber-200">
                        No se han utilizado repuestos aún.
                      </p>
                    ) : (
                      <div className="divide-y divide-amber-100 text-xs bg-white rounded-xl p-2 border border-amber-200">
                        {activeOrder.materialsUsed.map((mat) => (
                          <div key={mat.id} className="py-2 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-slate-900">{mat.productName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {mat.sku} · {mat.quantity} un. x ${mat.unitCost.toFixed(2)} USD
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">
                                ${mat.totalCost.toFixed(2)} USD
                              </span>
                              {onReturnMaterial && (
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Devolver repuesto al almacén?`)) {
                                      onReturnMaterial(activeOrder.id, mat.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                                  title="Devolver al almacén"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ADD PROGRESS LOG & EVIDENCE PHOTOS */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-red-600" />
                    Registrar Avance Escrito y Fotos de Evidencia
                  </h4>

                  <form onSubmit={handleAddRepairLog} className="space-y-3">
                    <textarea
                      rows={2}
                      placeholder="Describe qué se le hizo al vehículo (ej: Se limpió chicler de alta, calibración de cadena, prueba de voltaje 41.5V)..."
                      value={workNote}
                      onChange={(e) => setWorkNote(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />

                    {/* Photo previews */}
                    {workPhotos.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {workPhotos.map((photo, i) => (
                          <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-300">
                            <img src={photo} alt="Evidencia" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setWorkPhotos(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors">
                        <Camera className="w-3.5 h-3.5 text-red-600" />
                        <span>Subir Foto(s)</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={!workNote.trim() && workPhotos.length === 0}
                        className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                      >
                        Publicar Avance
                      </button>
                    </div>
                  </form>
                </div>

                {/* TIMELINE OF UPDATES */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Bitácora Histórica de la Orden:
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {activeOrder.updates?.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between items-center text-slate-500">
                          <span className="font-bold text-slate-800">{log.author}</span>
                          <span className="text-[10px]">{new Date(log.timestamp).toLocaleString('es-SV')}</span>
                        </div>
                        <p className="text-slate-700">{log.note}</p>
                        {log.photos && log.photos.length > 0 && (
                          <div className="flex gap-2 pt-1">
                            {log.photos.map((photo, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => onOpenPhoto(photo, log.note)}
                                className="w-12 h-12 rounded-lg overflow-hidden border border-slate-300 hover:opacity-80"
                              >
                                <img src={photo} alt="Foto" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTasks.map(task => (
              <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      {task.code}
                    </span>
                    <span className="text-xs text-slate-500">
                      Vence: {task.dueDate}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-2">
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-600 mb-3">
                    {task.description}
                  </p>

                  {/* Checklist */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Checklist Operativo:</p>
                    {task.checklist.map(item => (
                      <label key={item.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleTaskChecklist(task, item.id)}
                          className="w-4 h-4 text-red-600 rounded border-slate-300"
                        />
                        <span className={item.completed ? 'line-through text-slate-400' : ''}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Avance: <strong>{task.progress}%</strong></span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    task.status === 'Finalizada' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INVENTORY LOOKUP */}
      {activeTab === 'inventory' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-slate-900">
              Catálogo de Repuestos en Bodega Importoys SV
            </h3>
            <span className="text-xs font-mono text-slate-500">
              {products.length} repuestos registrados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(prod => (
              <div key={prod.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{prod.name}</h5>
                    <span className="text-[10px] font-mono text-slate-500">{prod.sku} · {prod.category}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    prod.stock <= prod.minStock ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {prod.stock} {prod.unit}s
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 flex justify-between pt-2 border-t border-slate-200/60">
                  <span>Ubicación: <strong>{prod.location}</strong></span>
                  <span>Precio: <strong className="font-mono text-slate-900">${prod.unitPrice.toFixed(2)} USD</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PIN Login & Operator Switcher Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Identificación de Operador</h3>
                  <p className="text-[11px] text-slate-400">Taller y Bodega Importoys SV</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPinModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyPinLogin} className="p-6 space-y-4">
              {pinError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                  {pinError}
                </div>
              )}

              {/* Technician Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Selecciona tu Usuario:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {technicians.filter(t => t.active).map(tech => {
                    const isSelected = selectedTechForLogin?.id === tech.id;
                    return (
                      <div
                        key={tech.id}
                        onClick={() => {
                          setSelectedTechForLogin(tech);
                          setPinError('');
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-red-50 border-red-500 shadow-xs' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                            {tech.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{tech.fullName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">@{tech.username}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PIN Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Ingresa tu PIN de Acceso:
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full text-center tracking-widest text-lg font-mono font-bold py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 text-center mt-1">
                  Ingresa el código asignado por tu Administrador
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Confirmar e Ingresar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
