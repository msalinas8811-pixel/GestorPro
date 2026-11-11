import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  CheckSquare, 
  Boxes, 
  BarChart3, 
  Users,
  Github, 
  HardDriveDownload,
  ShieldCheck,
  Plus,
  Wrench,
  Flame,
  X
} from 'lucide-react';

export type NavView = 'dashboard' | 'orders' | 'tasks' | 'inventory' | 'technicians' | 'reports';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  openNewOrderModal: () => void;
  openProjectExporter: () => void;
  appMode: 'admin' | 'bodega';
  onToggleMode: (mode: 'admin' | 'bodega') => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  counts: {
    activeOrders: number;
    pendingTasks: number;
    lowStockCount: number;
    techniciansCount?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  openNewOrderModal,
  openProjectExporter,
  appMode,
  onToggleMode,
  isOpenMobile = false,
  onCloseMobile,
  counts
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavView,
      label: 'Panel General',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'orders' as NavView,
      label: 'Órdenes de Reparación',
      icon: ClipboardList,
      badge: counts.activeOrders > 0 ? String(counts.activeOrders) : null
    },
    {
      id: 'tasks' as NavView,
      label: 'Tareas y Bitácora',
      icon: CheckSquare,
      badge: counts.pendingTasks > 0 ? String(counts.pendingTasks) : null
    },
    {
      id: 'inventory' as NavView,
      label: 'Inventario & Kardex',
      icon: Boxes,
      badge: counts.lowStockCount > 0 ? `${counts.lowStockCount} alertas` : null,
      badgeAlert: counts.lowStockCount > 0
    },
    {
      id: 'technicians' as NavView,
      label: 'Usuarios y Accesos',
      icon: Users,
      badge: counts.techniciansCount ? String(counts.techniciansCount) : null
    },
    {
      id: 'reports' as NavView,
      label: 'Reportes y Métricas',
      icon: BarChart3,
      badge: null
    }
  ];

  const handleNavClick = (view: NavView) => {
    onSelectView(view);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 select-none">
      {/* Brand Header - IMPORTOYS SV */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black text-sm shadow-md shadow-red-900/50">
            <Flame className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black text-white tracking-wider uppercase">Importoys</h1>
              <span className="text-[10px] px-1.5 py-0.2 bg-red-600/30 text-red-400 font-extrabold rounded border border-red-500/30">
                SV
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Taller & Bodega El Salvador 🇸🇻</p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role / Panel Mode Switcher */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 px-1">
          <span>Modo de Operación</span>
          <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold ${
            appMode === 'admin' 
              ? 'bg-red-900/60 text-red-300 border border-red-800/40' 
              : 'bg-amber-900/60 text-amber-300 border border-amber-800/40'
          }`}>
            {appMode === 'admin' ? 'ADMIN' : 'BODEGA / TALLER'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              onToggleMode('admin');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center ${
              appMode === 'admin' 
                ? 'bg-red-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Administrador
          </button>
          <button
            onClick={() => {
              onToggleMode('bodega');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center ${
              appMode === 'bodega' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bodega Taller
          </button>
        </div>
      </div>

      {/* Primary Action Button (Only in Admin Mode) */}
      {appMode === 'admin' && (
        <div className="p-4 pb-2">
          <button
            onClick={() => {
              openNewOrderModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Nueva Reparación
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Módulos del Taller
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                isActive
                  ? 'bg-red-600/15 text-white border border-red-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold tabular-nums shrink-0 ${
                    item.badgeAlert
                      ? 'bg-amber-950/90 text-amber-300 border border-amber-800/80 animate-pulse'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Hub: GitHub, Firebase, ZIP Export */}
      <div className="p-3 border-t border-slate-800 space-y-1 bg-slate-950/60">
        <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Respaldo & Sincronización
        </div>

        <button
          onClick={() => {
            openProjectExporter();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors min-h-[40px]"
        >
          <div className="flex items-center gap-2.5">
            <Github className="w-4 h-4 text-slate-400" />
            <span>GitHub & ZIP</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
            Código
          </span>
        </button>

        <button
          onClick={() => {
            openProjectExporter();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors min-h-[40px]"
        >
          <div className="flex items-center gap-2.5">
            <HardDriveDownload className="w-4 h-4 text-slate-400" />
            <span>Base de Datos</span>
          </div>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </div>

      {/* Footer Storage Indicator */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="truncate">Firestore: miluna-5697a</span>
        <span className="font-mono text-emerald-400 text-[10px] font-bold">ONLINE</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile/Tablet Drawer (Slide-Over) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            onClick={onCloseMobile} 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
          />
          {/* Drawer content */}
          <div className="relative z-10 animate-in slide-in-from-left duration-200 h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
