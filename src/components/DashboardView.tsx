import React, { useState } from 'react';
import { 
  ClipboardList, 
  CheckSquare, 
  Boxes, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  Plus, 
  Camera,
  Calendar,
  PackagePlus,
  Bell,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  MapPin
} from 'lucide-react';
import { AppData, Order, Product } from '../types';
import { NavView } from './Sidebar';

interface DashboardViewProps {
  data: AppData;
  onNavigate: (view: NavView) => void;
  onOpenOrder: (orderId: string) => void;
  onOpenNewOrder: () => void;
  onOpenNewTask: () => void;
  onOpenPhoto: (url: string, caption?: string) => void;
  onRegisterStockMovement?: (
    productId: string,
    type: 'ENTRADA' | 'SALIDA',
    quantity: number,
    reason: string,
    orderCode?: string,
    referenceDoc?: string
  ) => { success: boolean; message: string };
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onNavigate,
  onOpenOrder,
  onOpenNewOrder,
  onOpenNewTask,
  onOpenPhoto,
  onRegisterStockMovement
}) => {
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(true);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockReason, setRestockReason] = useState<string>('Reposición por alerta de stock mínimo');
  const [restockFeedback, setRestockFeedback] = useState<{ text: string; error: boolean } | null>(null);

  const activeOrders = data.orders.filter(o => o.status !== 'Completada' && o.status !== 'Cancelada');
  const pendingTasks = data.tasks.filter(t => t.status !== 'Finalizada');
  const lowStockProducts = data.products.filter(p => p.stock <= p.minStock);
  const outOfStockProducts = data.products.filter(p => p.stock === 0);

  const totalInventoryValue = data.products.reduce((acc, p) => acc + (p.stock * p.unitPrice), 0);
  const totalActualCost = data.orders.reduce((acc, o) => acc + o.actualCost, 0);

  // Extract all updates across all orders, sort descending by timestamp
  const allOrderUpdates = data.orders
    .flatMap(order => (order.updates || []).map(up => ({ ...up, orderCode: order.code, orderTitle: order.title, orderId: order.id })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  const handleOpenRestockModal = (product: Product) => {
    setRestockProduct(product);
    const deficit = Math.max(1, (product.minStock - product.stock) + 5);
    setRestockQty(deficit);
    setRestockReason(`Reposición de emergencia: ${product.name} (mínimo ${product.minStock})`);
    setRestockFeedback(null);
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || !onRegisterStockMovement) return;

    if (restockQty <= 0) {
      setRestockFeedback({ text: 'La cantidad a ingresar debe ser mayor a cero.', error: true });
      return;
    }

    const res = onRegisterStockMovement(
      restockProduct.id,
      'ENTRADA',
      restockQty,
      restockReason.trim() || 'Reposición por stock crítico',
      undefined,
      'ALERTA-DASHBOARD'
    );

    if (res.success) {
      setRestockFeedback({ text: res.message, error: false });
      setTimeout(() => {
        setRestockProduct(null);
        setRestockFeedback(null);
      }, 1500);
    } else {
      setRestockFeedback({ text: res.message, error: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* SISTEMA DE NOTIFICACIONES VISUALES DE STOCK CRÍTICO (LOW STOCK ALERTS)    */}
      {/* ========================================================================= */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50/90 border-2 border-amber-300 rounded-xl p-4 shadow-sm space-y-3 transition-all">
          {/* Header of Notification Center */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-lg shadow-xs flex items-center justify-center">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-950 tracking-tight">
                    Alerta Visual: {lowStockProducts.length} Repuesto{lowStockProducts.length > 1 ? 's' : ''} por Debajo del Stock Mínimo
                  </h3>
                  {outOfStockProducts.length > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                      {outOfStockProducts.length} AGOTADO{outOfStockProducts.length > 1 ? 'S' : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-800">
                  El inventario actual cayó por debajo del umbral de seguridad (<code className="font-mono font-semibold">minStock</code>). Riesgo de retraso en reparaciones.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('inventory')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap"
              >
                <span>Ver en Inventario</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
                className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-100 rounded-lg transition-colors"
                title={isAlertsExpanded ? 'Minimizar alertas' : 'Ver detalle de alertas'}
              >
                {isAlertsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Expandable Notification Cards Grid */}
          {isAlertsExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-amber-200">
              {lowStockProducts.map((prod) => {
                const isDepleted = prod.stock === 0;
                const deficit = Math.max(0, prod.minStock - prod.stock);
                const percentOfMin = prod.minStock > 0 ? Math.min(100, Math.round((prod.stock / prod.minStock) * 100)) : 0;

                return (
                  <div
                    key={prod.id}
                    className={`p-3 rounded-lg border transition-all space-y-2 bg-white ${
                      isDepleted 
                        ? 'border-rose-300 ring-1 ring-rose-200 shadow-xs' 
                        : 'border-amber-200 hover:border-amber-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {prod.sku}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate mt-1">
                          {prod.name}
                        </h4>
                      </div>

                      <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded whitespace-nowrap ${
                        isDepleted ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isDepleted ? '0 DISPONIBLE' : `CRÍTICO (${prod.stock})`}
                      </span>
                    </div>

                    {/* Stock comparison & progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          Stock: <strong className="text-slate-900 font-mono">{prod.stock} {prod.unit}s</strong>
                        </span>
                        <span className="text-slate-500">
                          Mínimo: <strong className="text-slate-900 font-mono">{prod.minStock} {prod.unit}s</strong>
                        </span>
                      </div>

                      {/* Visual gauge bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${isDepleted ? 'bg-rose-600' : percentOfMin <= 40 ? 'bg-amber-500' : 'bg-amber-400'}`}
                          style={{ width: `${Math.max(5, percentOfMin)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-rose-700 font-semibold flex justify-between">
                        <span>Faltan {deficit} {prod.unit}s para umbral seguro</span>
                        <span className="font-mono">{percentOfMin}% de minStock</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{prod.location}</span>
                      </span>

                      {onRegisterStockMovement ? (
                        <button
                          onClick={() => handleOpenRestockModal(prod)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold transition-colors shadow-2xs"
                          title="Ingresar stock de reposición de inmediato"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>Reponer Stock</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigate('inventory')}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-[11px]"
                        >
                          Ver en catálogo
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Orders */}
        <div 
          onClick={() => onNavigate('orders')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Órdenes de Reparación</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {activeOrders.length}
            </span>
            <span className="text-xs text-slate-500">activas de {data.orders.length}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-medium">
            <span>Ver listado de reparaciones</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Pending Tasks */}
        <div 
          onClick={() => onNavigate('tasks')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tareas Operativas</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {pendingTasks.length}
            </span>
            <span className="text-xs text-slate-500">en seguimiento</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-medium">
            <span>Ir al tablero de tareas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Low Stock Alerts (Visual Highlight) */}
        <div 
          onClick={() => onNavigate('inventory')}
          className={`p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
            lowStockProducts.length > 0
              ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400 ring-1 ring-amber-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Crítico / Alertas</span>
            <div className={`p-2 rounded-lg ${lowStockProducts.length > 0 ? 'bg-amber-500 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${lowStockProducts.length > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
              {lowStockProducts.length}
            </span>
            <span className="text-xs text-slate-500">bajo el mínimo</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-medium">
            <span>{lowStockProducts.length > 0 ? 'Resolver alertas en almacén' : 'Stock en niveles óptimos'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Inventory Value */}
        <div 
          onClick={() => onNavigate('reports')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor en Almacén</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              ${totalInventoryValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-medium">
            <span>Ver reporte de costos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Active Orders & Recent Visual Progress Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Orders in Progress (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Órdenes de Reparación en Curso</h3>
              <p className="text-xs text-slate-500">Progreso operativo y estado de entrega de las reparaciones activas</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Ver todas ({data.orders.length})
            </button>
          </div>

          <div className="space-y-3">
            {activeOrders.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
                <ClipboardList className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No hay órdenes de reparación activas en este momento</p>
                <button
                  onClick={onOpenNewOrder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Registrar Primera Reparación
                </button>
              </div>
            ) : (
              activeOrders.map((order) => {
                const partsCount = (order.materialsUsed || []).reduce((s, m) => s + (m.quantity || 0), 0);
                const partsCost = (order.materialsUsed || []).reduce((s, m) => s + (m.totalCost || 0), 0);

                return (
                  <div
                    key={order.id}
                    onClick={() => onOpenOrder(order.id)}
                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {order.code}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600 font-medium truncate">{order.clientName}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500 truncate">{order.category}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {order.title}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${
                          order.priority === 'Urgente'
                            ? 'bg-rose-100 text-rose-800 font-bold'
                            : order.priority === 'Alta'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {order.priority}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">
                          Estado: <strong className="text-slate-800">{order.status}</strong>
                        </span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {order.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            order.progress >= 80 ? 'bg-emerald-500' : order.progress >= 40 ? 'bg-blue-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${order.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Límite: {new Date(order.deadline).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      <div>
                        <span>Repuestos: <strong className="text-slate-800 font-mono">{partsCount} un. (${partsCost.toFixed(2)})</strong></span>
                      </div>
                      <div>
                        <span>Costo Total: <strong className="font-mono font-bold text-slate-900">${order.actualCost.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Visual Progress Timeline (Bitácora con fotos) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bitácora & Evidencias</h3>
              <p className="text-xs text-slate-500">Últimos avances con notas y fotos</p>
            </div>
            <Camera className="w-4 h-4 text-slate-400" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
            {allOrderUpdates.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Aún no hay avances registrados.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {allOrderUpdates.map((up) => (
                  <div key={up.id} className="relative pl-7 space-y-1.5 text-xs">
                    {/* Timeline marker */}
                    <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />

                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="font-semibold text-slate-700">{up.author}</span>
                      <span>{new Date(up.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="text-[11px] font-mono text-blue-600 font-semibold">
                      {up.orderCode} · {up.orderTitle}
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {up.note}
                    </p>

                    {/* Photo previews if present */}
                    {up.photos && up.photos.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                        {up.photos.map((photo, pIdx) => (
                          <div
                            key={pIdx}
                            onClick={() => onOpenPhoto(photo, `${up.orderCode}: ${up.note}`)}
                            className="relative group cursor-pointer shrink-0 rounded-lg overflow-hidden border border-slate-200"
                          >
                            <img
                              src={photo}
                              alt="Evidencia fotográfica"
                              className="w-16 h-14 object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* QUICK RESTOCK MODAL (REPOSICIÓN INMEDIATA DESDE EL DASHBOARD)             */}
      {/* ========================================================================= */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-amber-50/60">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Reponer Stock de Emergencia
                </h3>
              </div>
              <button
                onClick={() => setRestockProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Repuesto:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">{restockProduct.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SKU:</span>
                  <span className="font-mono font-bold text-slate-700">{restockProduct.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ubicación:</span>
                  <span className="text-slate-700">{restockProduct.location}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-semibold">
                  <span className="text-rose-700">Stock Actual / Mínimo:</span>
                  <span className="font-mono text-slate-900">
                    {restockProduct.stock} / {restockProduct.minStock} {restockProduct.unit}s
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Cantidad a ingresar al almacén:
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Nuevo stock resultante: <strong className="font-mono text-emerald-700">{restockProduct.stock + restockQty} {restockProduct.unit}s</strong>
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Motivo / Observación de la reposición:
                </label>
                <input
                  type="text"
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden"
                />
              </div>

              {restockFeedback && (
                <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                  restockFeedback.error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{restockFeedback.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Confirmar Reposición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
