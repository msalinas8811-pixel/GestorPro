import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Camera, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  Paperclip,
  ArrowLeft,
  X,
  Upload,
  Layers,
  Check,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { Order, OrderStatus, Priority, ProgressLog, Product, MaterialUsage } from '../types';

interface OrdersViewProps {
  orders: Order[];
  products: Product[];
  teamMembers: string[];
  categories: string[];
  selectedOrderId: string | null;
  onSelectOrder: (id: string | null) => void;
  onSaveOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onAssignMaterial: (orderId: string, productId: string, quantity: number) => { success: boolean; message: string };
  onReturnMaterial?: (orderId: string, materialUsageId: string) => { success: boolean; message: string };
  onOpenPhoto: (url: string, caption?: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  products,
  teamMembers,
  categories,
  selectedOrderId,
  onSelectOrder,
  onSaveOrder,
  onDeleteOrder,
  onAssignMaterial,
  onReturnMaterial,
  onOpenPhoto
}) => {
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todas');
  const [priorityFilter, setPriorityFilter] = useState<string>('Todas');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Add Progress Log Form state inside detail
  const [newNote, setNewNote] = useState('');
  const [newProgress, setNewProgress] = useState<number>(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>(teamMembers[0] || 'Técnico Responsable');

  // Assign Material Form inside detail
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [materialQty, setMaterialQty] = useState<number>(1);
  const [materialFeedback, setMaterialFeedback] = useState<{ text: string; error: boolean } | null>(null);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const chosenProduct = products.find(p => p.id === selectedProductId);

  // Calculate total spent on repair spare parts
  const totalSparePartsCost = (selectedOrder?.materialsUsed || []).reduce((acc, m) => acc + (m.totalCost || 0), 0);
  const totalSparePartsQuantity = (selectedOrder?.materialsUsed || []).reduce((acc, m) => acc + (m.quantity || 0), 0);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Todas' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'Todas' || order.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleOpenCreate = () => {
    const nextNumber = String(orders.length + 1).padStart(3, '0');
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      code: `OT-2026-${nextNumber}`,
      title: '',
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      category: categories[0] || 'Mantenimiento Correctivo',
      priority: 'Media',
      status: 'Pendiente',
      progress: 0,
      estimatedBudget: 0,
      actualCost: 0,
      assignedTo: teamMembers[0] || 'Técnico Demo 1',
      location: 'Taller Principal',
      description: '',
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      updates: [],
      materialsUsed: []
    };
    setEditingOrder(newOrder);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (order: Order) => {
    setEditingOrder({ ...order });
    setIsEditModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (!editingOrder.title.trim() || !editingOrder.clientName.trim()) {
      alert('Por favor complete el título de la orden y el nombre del cliente.');
      return;
    }
    onSaveOrder(editingOrder);
    setIsEditModalOpen(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddProgressLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!newNote.trim() && uploadedPhotos.length === 0) return;

    const newLog: ProgressLog = {
      id: `up-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: selectedAuthor,
      note: newNote.trim() || (uploadedPhotos.length > 0 ? 'Fotografías de avance adjuntadas' : 'Actualización de estado'),
      progressPercent: newProgress !== selectedOrder.progress ? newProgress : undefined,
      photos: [...uploadedPhotos],
      type: uploadedPhotos.length > 0 ? 'foto' : 'nota'
    };

    const updatedOrder: Order = {
      ...selectedOrder,
      progress: newProgress,
      status: newProgress === 100 ? 'Completada' : selectedOrder.status === 'Pendiente' ? 'En Proceso' : selectedOrder.status,
      completedAt: newProgress === 100 ? new Date().toISOString() : selectedOrder.completedAt,
      updates: [newLog, ...(selectedOrder.updates || [])]
    };

    onSaveOrder(updatedOrder);
    setNewNote('');
    setUploadedPhotos([]);
  };

  const handleAssignMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedProductId) return;

    const res = onAssignMaterial(selectedOrder.id, selectedProductId, materialQty);
    setMaterialFeedback({ text: res.message, error: !res.success });
    if (res.success) {
      setSelectedProductId('');
      setMaterialQty(1);
    }
    setTimeout(() => setMaterialFeedback(null), 4000);
  };

  // Status Badge Helper
  const getStatusBadge = (status: OrderStatus) => {
    const styles: Record<OrderStatus, string> = {
      'Pendiente': 'bg-slate-100 text-slate-700 border-slate-200',
      'En Diagnóstico': 'bg-purple-50 text-purple-700 border-purple-200',
      'En Proceso': 'bg-blue-50 text-blue-700 border-blue-200',
      'En Espera': 'bg-amber-50 text-amber-700 border-amber-200',
      'En Pruebas': 'bg-cyan-50 text-cyan-700 border-cyan-200',
      'Completada': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Cancelada': 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  // ==========================================
  // DETAIL VIEW FOR SELECTED ORDER
  // ==========================================
  if (selectedOrder) {
    return (
      <div className="space-y-6">
        {/* Top Detail Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectOrder(null)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Volver a la lista de órdenes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded">
                  {selectedOrder.code}
                </span>
                <span className="text-xs text-slate-400">·</span>
                {getStatusBadge(selectedOrder.status)}
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-semibold text-slate-600">{selectedOrder.priority}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {selectedOrder.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEdit(selectedOrder)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar Orden
            </button>
            <button
              onClick={() => {
                if (confirm(`¿Estás seguro de eliminar permanentemente la orden ${selectedOrder.code}?`)) {
                  onDeleteOrder(selectedOrder.id);
                  onSelectOrder(null);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          </div>
        </div>

        {/* 2-Column Info & Execution Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Technical Data, Client, Materials (1 col) */}
          <div className="space-y-6">
            {/* General Data Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Detalles de la Orden</h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Cliente / Solicitante:</span>
                  <div className="font-semibold text-slate-900 text-sm">{selectedOrder.clientName}</div>
                  <div className="flex items-center gap-3 text-slate-600 mt-1">
                    {selectedOrder.clientPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {selectedOrder.clientPhone}
                      </span>
                    )}
                    {selectedOrder.clientEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {selectedOrder.clientEmail}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Técnico Asignado:</span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {selectedOrder.assignedTo}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Ubicación física:</span>
                  <div className="text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedOrder.location}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Fecha Creación:</span>
                    <span className="font-mono text-slate-700">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Fecha Límite:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {new Date(selectedOrder.deadline).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Presupuesto Est.:</span>
                    <span className="font-mono text-slate-900 font-semibold">
                      ${selectedOrder.estimatedBudget.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Costo Acumulado:</span>
                    <span className="font-mono font-bold text-blue-600">
                      ${selectedOrder.actualCost.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Descripción del Trabajo:</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedOrder.description || 'Sin descripción detallada.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Materials and Inventory Consumption Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    Repuestos Usados en la Reparación
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Baja automática del stock en inventario y carga de costo
                  </p>
                </div>
                <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                  {totalSparePartsQuantity} piezas
                </span>
              </div>

              {/* Form to assign material from inventory */}
              <form onSubmit={handleAssignMaterialSubmit} className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800">
                    Seleccionar Repuesto a Dar de Baja:
                  </span>
                  {chosenProduct && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      chosenProduct.stock > chosenProduct.minStock ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Stock en almacén: {chosenProduct.stock} {chosenProduct.unit}s
                    </span>
                  )}
                </div>

                <div>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setMaterialQty(1);
                    }}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="">-- Buscar y seleccionar repuesto del catálogo --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                        {p.name} ({p.sku}) — Stock disponible: {p.stock} {p.unit}s (${p.unitPrice.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                {chosenProduct && (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 space-y-1">
                    <div className="flex justify-between">
                      <span>Ubicación: <strong>{chosenProduct.location}</strong></span>
                      <span>Precio Unitario: <strong className="font-mono">${chosenProduct.unitPrice.toFixed(2)}</strong></span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-blue-200/60 font-semibold">
                      <span>Subtotal a cargar a la orden:</span>
                      <span className="font-mono text-blue-950 font-bold">
                        ${(materialQty * chosenProduct.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="w-28">
                    <label className="text-[10px] text-slate-500 block mb-0.5">Cantidad:</label>
                    <input
                      type="number"
                      min={1}
                      max={chosenProduct ? chosenProduct.stock : 999}
                      value={materialQty}
                      onChange={(e) => setMaterialQty(Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="Cant."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden font-mono font-bold"
                    />
                  </div>
                  <div className="flex-1 pt-4">
                    <button
                      type="submit"
                      disabled={!selectedProductId}
                      className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Package className="w-3.5 h-3.5" />
                      Dar de Baja y Asignar a Reparación
                    </button>
                  </div>
                </div>

                {materialFeedback && (
                  <div className={`p-2 rounded text-[11px] font-medium ${
                    materialFeedback.error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {materialFeedback.text}
                  </div>
                )}
              </form>

              {/* Assigned materials table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                  <span>Repuestos Instalados</span>
                  <span className="font-mono text-blue-700">Total: ${totalSparePartsCost.toFixed(2)}</span>
                </div>

                {(!selectedOrder.materialsUsed || selectedOrder.materialsUsed.length === 0) ? (
                  <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Aún no se han retirado repuestos de inventario para esta reparación.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {selectedOrder.materialsUsed.map((mat) => (
                      <div key={mat.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{mat.productName}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{mat.sku}</span>
                            <span>{mat.quantity} un. x ${mat.unitCost.toFixed(2)}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-400">{new Date(mat.assignedAt).toLocaleDateString('es-ES')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            ${mat.totalCost.toFixed(2)}
                          </span>

                          {onReturnMaterial && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Devolver ${mat.quantity} pieza(s) de "${mat.productName}" al almacén? Se repondrá el stock en inventario y se descontará del costo de la reparación.`)) {
                                  const res = onReturnMaterial(selectedOrder.id, mat.id);
                                  setMaterialFeedback({ text: res.message, error: !res.success });
                                  setTimeout(() => setMaterialFeedback(null), 4000);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                              title="Revertir / Devolver repuesto al almacén"
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
          </div>

          {/* Right Column: Progress Timeline & Photo Uploads (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview Bar */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Progreso Global de la Orden</h3>
                  <p className="text-xs text-slate-500">Avance reportado por el equipo técnico</p>
                </div>
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  {selectedOrder.progress}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    selectedOrder.progress >= 80 ? 'bg-emerald-500' : selectedOrder.progress >= 40 ? 'bg-blue-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${selectedOrder.progress}%` }}
                />
              </div>
            </div>

            {/* New Progress Update Form (Written Note + Photo Upload) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                Registrar Nuevo Avance con Fotografías
              </h3>

              <form onSubmit={handleAddProgressLog} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Técnico que reporta:
                    </label>
                    <select
                      value={selectedAuthor}
                      onChange={(e) => setSelectedAuthor(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden"
                    >
                      {teamMembers.map((m, idx) => (
                        <option key={idx} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Actualizar porcentaje de avance: <span className="font-mono font-bold text-blue-600">{newProgress}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={newProgress}
                      onChange={(e) => setNewProgress(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer mt-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Detalle del trabajo realizado / Hallazgos:
                  </label>
                  <textarea
                    rows={3}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Describa las acciones técnicas realizadas, pruebas, cambios de piezas o anomalías detectadas..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white transition-all"
                  />
                </div>

                {/* Upload Photo Button & Previews */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                      <Camera className="w-4 h-4 text-slate-600" />
                      Adjuntar Fotografías
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-slate-400">
                      Soporta fotos desde cámara o galería (PNG, JPG)
                    </span>
                  </div>

                  {uploadedPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      {uploadedPhotos.map((photo, pIdx) => (
                        <div key={pIdx} className="relative group rounded-lg overflow-hidden border border-slate-300 w-20 h-20">
                          <img src={photo} alt="Vista previa" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setUploadedPhotos(prev => prev.filter((_, i) => i !== pIdx))}
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Guardar Avance en la Bitácora
                  </button>
                </div>
              </form>
            </div>

            {/* History of Progress Logs */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Bitácora Cronológica de Avances ({selectedOrder.updates?.length || 0})
              </h3>

              {(!selectedOrder.updates || selectedOrder.updates.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No hay avances registrados para esta orden. Registra el primero arriba.
                </p>
              ) : (
                <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedOrder.updates.map((log) => (
                    <div key={log.id} className="relative pl-8 space-y-2">
                      {/* Marker */}
                      <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{log.author}</span>
                          {log.progressPercent !== undefined && (
                            <span className="font-mono text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                              Avance: {log.progressPercent}%
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString('es-ES', { 
                            day: '2-digit', 
                            month: 'short', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {log.note}
                      </div>

                      {/* Photos Attached to this update */}
                      {log.photos && log.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {log.photos.map((photo, phIdx) => (
                            <div
                              key={phIdx}
                              onClick={() => onOpenPhoto(photo, `${log.author} - ${log.note}`)}
                              className="relative group cursor-pointer rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors w-28 h-24"
                            >
                              <img
                                src={photo}
                                alt="Evidencia de trabajo"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
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

        {/* Edit Order Modal */}
        {isEditModalOpen && editingOrder && (
          <OrderEditModal
            order={editingOrder}
            categories={categories}
            teamMembers={teamMembers}
            onChange={(field, val) => setEditingOrder(prev => prev ? { ...prev, [field]: val } : null)}
            onSave={handleSaveModal}
            onClose={() => setIsEditModalOpen(false)}
          />
        )}
      </div>
    );
  }

  // ==========================================
  // LIST OF ORDERS VIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Controls Bar: Search, Filters & Create */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código OT, cliente o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden"
            >
              <option value="Todas">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Diagnóstico">En Diagnóstico</option>
              <option value="En Proceso">En Proceso</option>
              <option value="En Espera">En Espera</option>
              <option value="En Pruebas">En Pruebas</option>
              <option value="Completada">Completada</option>
              <option value="Cancelada">Cancelada</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden"
            >
              <option value="Todas">Todas las prioridades</option>
              <option value="Urgente">Urgente</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva Orden de Trabajo
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Código OT</th>
                <th className="py-3 px-4">Trabajo & Cliente</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Prioridad</th>
                <th className="py-3 px-4">Avance</th>
                <th className="py-3 px-4">Repuestos Almacén</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4">Límite</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No se encontraron órdenes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const partsQty = (order.materialsUsed || []).reduce((s, m) => s + (m.quantity || 0), 0);
                  const partsCost = (order.materialsUsed || []).reduce((s, m) => s + (m.totalCost || 0), 0);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder(order.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                        {order.code}
                      </td>
                      <td className="py-3.5 px-4 min-w-[200px] max-w-xs">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {order.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {order.clientName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`font-semibold ${
                          order.priority === 'Urgente' ? 'text-rose-600' : order.priority === 'Alta' ? 'text-amber-600' : 'text-slate-600'
                        }`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[120px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-mono tabular-nums">{order.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full ${order.progress >= 80 ? 'bg-emerald-500' : order.progress >= 40 ? 'bg-blue-600' : 'bg-amber-500'}`}
                              style={{ width: `${order.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {partsQty > 0 ? (
                          <div className="text-[11px]">
                            <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                              {partsQty} pieza{partsQty > 1 ? 's' : ''}
                            </span>
                            <span className="font-mono text-blue-700 font-bold ml-1.5">
                              ${partsCost.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Sin repuestos</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {order.assignedTo.split(' ')[0]}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                        {new Date(order.deadline).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEdit(order)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar orden ${order.code}?`)) {
                              onDeleteOrder(order.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isEditModalOpen && editingOrder && (
        <OrderEditModal
          order={editingOrder}
          categories={categories}
          teamMembers={teamMembers}
          onChange={(field, val) => setEditingOrder(prev => prev ? { ...prev, [field]: val } : null)}
          onSave={handleSaveModal}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
};

// ==========================================
// MODAL FOR CREATING AND EDITING AN ORDER
// ==========================================
interface OrderEditModalProps {
  order: Order;
  categories: string[];
  teamMembers: string[];
  onChange: (field: keyof Order, value: any) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({
  order,
  categories,
  teamMembers,
  onChange,
  onSave,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">
            {order.id.startsWith('ord-') ? 'Detalles de la Orden de Trabajo' : 'Editar Orden'} ({order.code})
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Código OT *</label>
              <input
                type="text"
                required
                value={order.code}
                onChange={(e) => onChange('code', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono font-bold focus:outline-hidden focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Categoría</label>
              <select
                value={order.category}
                onChange={(e) => onChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
              >
                {categories.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Título / Asunto del Trabajo *</label>
            <input
              type="text"
              required
              placeholder="Ej: Mantenimiento mayor a bomba hidráulica..."
              value={order.title}
              onChange={(e) => onChange('title', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Cliente / Empresa *</label>
              <input
                type="text"
                required
                placeholder="Nombre del cliente"
                value={order.clientName}
                onChange={(e) => onChange('clientName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Teléfono</label>
              <input
                type="text"
                placeholder="+34 600..."
                value={order.clientPhone}
                onChange={(e) => onChange('clientPhone', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                placeholder="cliente@correo.com"
                value={order.clientEmail}
                onChange={(e) => onChange('clientEmail', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Estado</label>
              <select
                value={order.status}
                onChange={(e) => onChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En Diagnóstico">En Diagnóstico</option>
                <option value="En Proceso">En Proceso</option>
                <option value="En Espera">En Espera</option>
                <option value="En Pruebas">En Pruebas</option>
                <option value="Completada">Completada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Prioridad</label>
              <select
                value={order.priority}
                onChange={(e) => onChange('priority', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Responsable</label>
              <select
                value={order.assignedTo}
                onChange={(e) => onChange('assignedTo', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
              >
                {teamMembers.map((m, i) => (
                  <option key={i} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Fecha Límite</label>
              <input
                type="date"
                value={order.deadline ? order.deadline.slice(0, 10) : ''}
                onChange={(e) => onChange('deadline', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Presupuesto Estimado ($)</label>
              <input
                type="number"
                step="0.01"
                value={order.estimatedBudget}
                onChange={(e) => onChange('estimatedBudget', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Ubicación</label>
              <input
                type="text"
                value={order.location}
                onChange={(e) => onChange('location', e.target.value)}
                placeholder="Ej: Taller Banco 3"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Descripción y Requerimientos</label>
            <textarea
              rows={3}
              value={order.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Detalle de fallas, instrucciones y requerimientos especiales..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Guardar Orden
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
