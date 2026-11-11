import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Boxes, 
  ArrowDownRight, 
  ArrowUpRight, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  FileText, 
  Layers, 
  Download,
  X,
  PackagePlus,
  PackageMinus
} from 'lucide-react';
import { Product, StockMovement, Order } from '../types';
import { exportMovementsCSV, exportProductsCSV } from '../services/exportService';

interface InventoryViewProps {
  products: Product[];
  movements: StockMovement[];
  orders: Order[];
  inventoryCategories: string[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onRegisterStockMovement: (
    productId: string,
    type: 'ENTRADA' | 'SALIDA',
    quantity: number,
    reason: string,
    orderCode?: string,
    referenceDoc?: string
  ) => { success: boolean; message: string };
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  movements,
  orders,
  inventoryCategories,
  onSaveProduct,
  onDeleteProduct,
  onRegisterStockMovement
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'movements' | 'alerts'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [movementProductId, setMovementProductId] = useState<string>('');
  const [movementQuantity, setMovementQuantity] = useState<number>(1);
  const [movementReason, setMovementReason] = useState<string>('');
  const [movementOrderCode, setMovementOrderCode] = useState<string>('');
  const [movementRefDoc, setMovementRefDoc] = useState<string>('');
  const [movementError, setMovementError] = useState<string | null>(null);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'Todas' || p.category === categoryFilter;

    if (activeTab === 'alerts') {
      return matchesSearch && matchesCategory && p.stock <= p.minStock;
    }
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  const handleOpenCreateProduct = () => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sku: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: inventoryCategories[0] || 'Mecánica',
      description: '',
      stock: 10,
      minStock: 5,
      unitPrice: 25.00,
      costPrice: 15.00,
      location: 'Pasillo A - Estante 1',
      unit: 'unidad',
      lastUpdated: new Date().toISOString().slice(0, 10)
    };
    setEditingProduct(newProduct);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct({ ...prod });
    setIsProductModalOpen(true);
  };

  const handleSaveProductModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name.trim() || !editingProduct.sku.trim()) {
      alert('Por favor complete el SKU y nombre del producto.');
      return;
    }
    onSaveProduct(editingProduct);
    setIsProductModalOpen(false);
  };

  const handleOpenMovement = (type: 'ENTRADA' | 'SALIDA', defaultProdId?: string) => {
    setMovementType(type);
    setMovementProductId(defaultProdId || (products[0]?.id ?? ''));
    setMovementQuantity(1);
    setMovementReason(type === 'ENTRADA' ? 'Reposición de stock por compra' : 'Despacho a orden de trabajo');
    setMovementOrderCode('');
    setMovementRefDoc('');
    setMovementError(null);
    setIsMovementModalOpen(true);
  };

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementProductId) {
      setMovementError('Seleccione un producto.');
      return;
    }
    if (movementQuantity <= 0) {
      setMovementError('La cantidad debe ser mayor a 0.');
      return;
    }

    const res = onRegisterStockMovement(
      movementProductId,
      movementType,
      movementQuantity,
      movementReason.trim() || (movementType === 'ENTRADA' ? 'Ingreso a almacén' : 'Salida de almacén'),
      movementOrderCode || undefined,
      movementRefDoc || undefined
    );

    if (!res.success) {
      setMovementError(res.message);
      return;
    }

    setIsMovementModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Segmented Tabs & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'catalog'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Catálogo de Productos ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'alerts'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Stock Bajo ({lowStockCount})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'movements'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kardex / Movimientos ({movements.length})
          </button>
        </div>

        {/* Action Buttons: Entrada, Salida, Nuevo Producto */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => handleOpenMovement('ENTRADA')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            Registrar Entrada
          </button>

          <button
            onClick={() => handleOpenMovement('SALIDA')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
            Registrar Salida
          </button>

          <button
            onClick={handleOpenCreateProduct}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Main Content: Catalog / Alerts Tab */}
      {(activeTab === 'catalog' || activeTab === 'alerts') && (
        <div className="space-y-4">
          {/* Search & Category Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por SKU, nombre del repuesto o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden"
            >
              <option value="Todas">Todas las categorías</option>
              {inventoryCategories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>

            <button
              onClick={() => exportProductsCSV(products)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors shrink-0"
              title="Descargar lista de productos en Excel CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Producto / Repuesto</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4 text-right">Stock Actual</th>
                    <th className="py-3 px-4 text-right">Mínimo</th>
                    <th className="py-3 px-4 text-right">Precio Venta</th>
                    <th className="py-3 px-4">Ubicación</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No se encontraron productos en el inventario.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => {
                      const isLowStock = prod.stock <= prod.minStock;
                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {prod.sku}
                          </td>
                          <td className="py-3.5 px-4 min-w-[200px]">
                            <div className="font-semibold text-slate-900">{prod.name}</div>
                            {prod.description && (
                              <div className="text-[11px] text-slate-500 truncate max-w-xs">{prod.description}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                            {prod.category}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded ${
                              isLowStock ? 'bg-amber-100 text-amber-900 font-extrabold' : 'text-slate-900'
                            }`}>
                              {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                              {prod.stock} {prod.unit}s
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-slate-500">
                            {prod.minStock} {prod.unit}s
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-semibold text-slate-800">
                            ${prod.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                            {prod.location}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenMovement('ENTRADA', prod.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                title="Ingresar stock"
                              >
                                <ArrowDownRight className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenMovement('SALIDA', prod.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Despachar stock"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                                title="Editar"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar ${prod.name} (${prod.sku}) del inventario?`)) {
                                    onDeleteProduct(prod.id);
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
        </div>
      )}

      {/* Kardex / Movements Tab */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Historial de Kardex y Movimientos</h3>
              <p className="text-xs text-slate-500">Trazabilidad completa de entradas, salidas y consumos en órdenes</p>
            </div>
            <button
              onClick={() => exportMovementsCSV(movements)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Kardex (CSV)
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">SKU & Producto</th>
                    <th className="py-3 px-4 text-right">Cantidad</th>
                    <th className="py-3 px-4 text-right">Saldo Stock</th>
                    <th className="py-3 px-4">Motivo / Documento</th>
                    <th className="py-3 px-4">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No hay movimientos registrados en el Kardex.
                      </td>
                    </tr>
                  ) : (
                    movements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                          {new Date(mov.timestamp).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                            mov.type === 'ENTRADA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {mov.type === 'ENTRADA' ? '+' : '-'} {mov.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 min-w-[180px]">
                          <span className="font-mono font-bold text-slate-900 block">{mov.sku}</span>
                          <span className="text-slate-600 text-[11px] truncate block">{mov.productName}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold">
                          {mov.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-slate-600">
                          {mov.previousStock} → <strong className="text-slate-900">{mov.newStock}</strong>
                        </td>
                        <td className="py-3.5 px-4 min-w-[200px]">
                          <div className="text-slate-800">{mov.reason}</div>
                          {mov.orderCode && (
                            <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                              {mov.orderCode}
                            </span>
                          )}
                          {mov.referenceDoc && (
                            <span className="text-[10px] font-mono text-slate-500 ml-1">
                              Ref: {mov.referenceDoc}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                          {mov.user}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct.id.startsWith('prod-') ? 'Crear / Editar Producto' : 'Editar Producto'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductModal} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">SKU / Código Único *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                  >
                    {inventoryCategories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre del Repuesto / Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Rodamiento Rígido de Bolas 6205-2RS..."
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Stock Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingProduct.minStock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStock: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Unidad</label>
                  <select
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                  >
                    <option value="unidad">unidad</option>
                    <option value="litro">litro</option>
                    <option value="metro">metro</option>
                    <option value="kit">kit</option>
                    <option value="caja">caja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Precio Venta / Cobro ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.unitPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Costo Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.costPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Ubicación en Almacén</label>
                <input
                  type="text"
                  placeholder="Ej: Pasillo A - Estante 2 - Gaveta 14"
                  value={editingProduct.location}
                  onChange={(e) => setEditingProduct({ ...editingProduct, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Descripción / Especificaciones</label>
                <textarea
                  rows={2}
                  placeholder="Medidas, tolerancias, compatibilidad..."
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER MOVEMENT MODAL (ENTRADA / SALIDA) */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {movementType === 'ENTRADA' ? (
                  <>
                    <PackagePlus className="w-5 h-5 text-emerald-600" />
                    Registrar Entrada de Stock
                  </>
                ) : (
                  <>
                    <PackageMinus className="w-5 h-5 text-rose-600" />
                    Registrar Salida / Despacho de Stock
                  </>
                )}
              </h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMovement} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Producto / Repuesto *</label>
                <select
                  value={movementProductId}
                  onChange={(e) => setMovementProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Stock actual: {p.stock} {p.unit}s
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Cantidad a {movementType === 'ENTRADA' ? 'ingresar' : 'retirar'} *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movementQuantity}
                  onChange={(e) => setMovementQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Motivo del Movimiento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Reposición por compra, Consumo en taller, Ajuste de inventario..."
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>

              {movementType === 'SALIDA' ? (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Orden de Trabajo Asociada (Opcional)</label>
                  <select
                    value={movementOrderCode}
                    onChange={(e) => setMovementOrderCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                  >
                    <option value="">-- Sin orden vinculada --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.code}>{o.code} - {o.title}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Factura / Guía / Documento Ref.</label>
                  <input
                    type="text"
                    placeholder="Ej: FAC-2026-904, Guía Remisión #881"
                    value={movementRefDoc}
                    onChange={(e) => setMovementRefDoc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>
              )}

              {movementError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium">
                  {movementError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white text-xs font-semibold rounded-lg transition-colors ${
                    movementType === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirmar {movementType === 'ENTRADA' ? 'Entrada' : 'Salida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
