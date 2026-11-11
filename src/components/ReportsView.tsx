import React, { useState } from 'react';
import { 
  BarChart3, 
  Printer, 
  Download, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  FileSpreadsheet,
  Boxes,
  PieChart
} from 'lucide-react';
import { AppData } from '../types';
import { 
  exportOrdersCSV, 
  exportTasksCSV, 
  exportProductsCSV, 
  exportMovementsCSV 
} from '../services/exportService';

interface ReportsViewProps {
  data: AppData;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ data }) => {
  const [filterPeriod, setFilterPeriod] = useState<'30' | '90' | 'all'>('all');

  const { orders, tasks, products, movements } = data;

  // Operational metrics
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'Completada').length;
  const inProgressOrders = orders.filter(o => o.status === 'En Proceso' || o.status === 'En Diagnóstico' || o.status === 'En Pruebas').length;
  const pendingOrders = orders.filter(o => o.status === 'Pendiente' || o.status === 'En Espera').length;

  const orderCompletionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  // Financial calculations
  const totalEstimatedBudget = orders.reduce((sum, o) => sum + (o.estimatedBudget || 0), 0);
  const totalActualCost = orders.reduce((sum, o) => sum + (o.actualCost || 0), 0);
  const costVariance = totalEstimatedBudget - totalActualCost;

  // Task metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Finalizada').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

  // Inventory value & critical items
  const inventoryTotalValue = products.reduce((sum, p) => sum + (p.stock * p.unitPrice), 0);
  const inventoryTotalCost = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  // Category distribution
  const categoryCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.category] = (acc[o.category] || 0) + 1;
    return acc;
  }, {});

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Buttons */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Reportes Ejecutivos & Métricas de Rendimiento</h3>
          <p className="text-xs text-slate-500">Métricas consolidadas de productividad, balance de costos y gestión de almacén</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir Reporte (PDF)
          </button>
        </div>
      </div>

      {/* CSV Export Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Descarga Directa de Libros de Datos (Excel CSV)</h4>
            <p className="text-[11px] text-slate-500">Exporta las bases de datos con formato compatible para hojas de cálculo</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportOrdersCSV(orders)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Órdenes CSV
          </button>
          <button
            onClick={() => exportTasksCSV(tasks)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Tareas CSV
          </button>
          <button
            onClick={() => exportProductsCSV(products)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Inventario CSV
          </button>
          <button
            onClick={() => exportMovementsCSV(movements)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Kardex CSV
          </button>
        </div>
      </div>

      {/* Main KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasa de Entrega OT</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {orderCompletionRate}%
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({completedOrders}/{totalOrders} OTs)
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {inProgressOrders} en ejecución activa
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Presupuesto Facturado</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              ${totalEstimatedBudget.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            Costo real invertido: ${totalActualCost.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Margen Operativo</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${costVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${costVariance.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {costVariance >= 0 ? 'Rendimiento financiero positivo' : 'Desviación sobre presupuesto'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Eficiencia de Horas</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {totalActualHours}h
            </span>
            <span className="text-xs text-slate-500 font-mono">
              / {totalEstimatedHours}h est.
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {totalTasks} tareas operativas gestionadas
          </p>
        </div>
      </div>

      {/* 2-Column Analytics: Orders by Category & Inventory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Analysis */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Distribución de Órdenes por Especialidad</h4>
            <PieChart className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
              return (
                <div key={cat} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{cat}</span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inventory Valuation and Health */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Estado y Valorización del Almacén</h4>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Valorización Total al Costo:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ${inventoryTotalCost.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Valorización a Precio Venta:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  ${inventoryTotalValue.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Total de Repuestos Catalogados:</span>
                <span className="font-mono font-bold text-slate-900">
                  {products.length} productos
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Alertas de Stock Crítico:</span>
                <span className={`font-mono font-bold ${lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {lowStockCount} alertas activas
                </span>
              </div>
            </div>

            <div className="pt-2 text-slate-500 text-[11px] leading-relaxed">
              El Kardex registra un total de <strong className="font-mono text-slate-800">{movements.length} movimientos</strong> entre recepciones de compra y despachos directos a órdenes de trabajo.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
