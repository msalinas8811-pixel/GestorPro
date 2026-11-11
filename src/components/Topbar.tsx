import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Download, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  User as UserIcon, 
  Flame,
  Menu,
  Smartphone,
  Cloud,
  CloudOff,
  LoaderCircle
} from 'lucide-react';
import { NavView } from './Sidebar';
import { auth, loginWithGoogle, logoutFirebase } from '../firebase';
import { User, onAuthStateChanged } from 'firebase/auth';

interface TopbarProps {
  currentView: NavView;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCreateModal: () => void;
  onOpenProjectExporter: () => void;
  onOpenInstallModal: () => void;
  onToggleMobileMenu?: () => void;
  appMode: 'admin' | 'bodega';
  onToggleMode: (mode: 'admin' | 'bodega') => void;
  currentTechnicianName?: string;
  cloudSyncStatus: 'local' | 'loading' | 'syncing' | 'synced' | 'error';
}

export const Topbar: React.FC<TopbarProps> = ({
  currentView,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  onOpenProjectExporter,
  onOpenInstallModal,
  onToggleMobileMenu,
  appMode,
  onToggleMode,
  currentTechnicianName,
  cloudSyncStatus
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      await loginWithGoogle();
    } catch (err) {
      console.error('Error al autenticar con Google:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  const titles: Record<NavView, { main: string; sub: string; actionLabel: string }> = {
    dashboard: {
      main: 'Panel General Importoys SV',
      sub: 'Monitoreo de órdenes, vehículos en taller, repuestos y alertas',
      actionLabel: 'Nueva Reparación'
    },
    orders: {
      main: 'Órdenes de Reparación',
      sub: 'Diagnóstico, avance con fotos y baja de repuestos de almacén',
      actionLabel: 'Nueva Reparación'
    },
    tasks: {
      main: 'Tareas y Bitácora Operativa',
      sub: 'Asignación técnica, checklists de calidad y reportes fotográficos',
      actionLabel: 'Nueva Tarea'
    },
    inventory: {
      main: 'Inventario de Repuestos & Kardex',
      sub: 'Baterías, controladores, carburadores, llantas, cadenas y piezas ($ USD)',
      actionLabel: 'Nuevo Repuesto'
    },
    technicians: {
      main: 'Gestión de Usuarios y Accesos',
      sub: 'Altas de administradores y técnicos de taller con contraseñas',
      actionLabel: 'Dar de Alta Usuario'
    },
    reports: {
      main: 'Métricas y Finanzas de Taller',
      sub: 'Productividad de mecánicos, costos de reparación y rotación ($ USD)',
      actionLabel: 'Exportar Reporte'
    }
  };

  const currentInfo = titles[currentView] || titles.dashboard;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-10">
      {/* Zone 1: Mobile Hamburger & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            title="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 truncate tracking-tight">
              {currentInfo.main}
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200 hidden sm:inline-block">
              Importoys El Salvador
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate hidden md:block">
            {currentInfo.sub}
          </p>
        </div>
      </div>

      {/* Zone 2: Global Search */}
      <div className="flex-1 max-w-sm hidden lg:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar moto, cuadri, cliente o repuesto..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-red-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Zone 3: Auth & Mode Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mode Switcher Badge */}
        <button
          onClick={() => onToggleMode(appMode === 'admin' ? 'bodega' : 'admin')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
            appMode === 'admin'
              ? 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
              : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
          }`}
          title="Alternar entre Administrador y Bodega/Taller"
        >
          <span>{appMode === 'admin' ? '👑 Admin' : '🔧 Bodega Taller'}</span>
          <span className="text-[10px] opacity-75 underline ml-0.5">Cambiar</span>
        </button>

        {/* Mobile / Tablet App Installer Button */}
        <button
          onClick={onOpenInstallModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          title="Instalar en tu iPhone o generar APK para tablets de bodega"
        >
          <Smartphone className="w-3.5 h-3.5 text-red-600" />
          <span className="hidden xl:inline">Instalar App (iPhone / Tablet)</span>
          <span className="xl:hidden hidden sm:inline">Instalar App</span>
        </button>

        {/* Google Authentication for Admin */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <span
              className={`hidden lg:flex items-center gap-1 text-[10px] font-semibold ${
                cloudSyncStatus === 'error' ? 'text-rose-600' : 'text-emerald-700'
              }`}
              title={
                cloudSyncStatus === 'error'
                  ? 'No se pudieron sincronizar los datos con Firebase; la copia local sigue disponible.'
                  : cloudSyncStatus === 'loading'
                    ? 'Cargando los datos de Firebase'
                    : cloudSyncStatus === 'syncing'
                      ? 'Guardando cambios en Firebase'
                      : 'Datos sincronizados con Firebase'
              }
            >
              {cloudSyncStatus === 'loading' || cloudSyncStatus === 'syncing' ? (
                <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
              ) : cloudSyncStatus === 'error' ? (
                <CloudOff className="w-3.5 h-3.5" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              <span>
                {cloudSyncStatus === 'loading'
                  ? 'Cargando'
                  : cloudSyncStatus === 'syncing'
                    ? 'Sincronizando'
                    : cloudSyncStatus === 'error'
                      ? 'Error nube'
                      : 'En la nube'}
              </span>
            </span>
            {currentUser.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || 'Admin'} 
                className="w-8 h-8 rounded-full border border-slate-300 shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                {(currentUser.displayName || currentUser.email || 'A')[0].toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <span title="Admin Autenticado con Google">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                {currentUser.email === 'msalinas8811@gmail.com' ? 'Super Admin' : 'Admin'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Cerrar sesión de Google"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold shadow-xs transition-all hover:border-slate-400"
            title="Iniciar sesión como Administrador con tu cuenta de Google"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="hidden sm:inline">Ingresar con Google</span>
          </button>
        )}

        {/* Primary Action Button */}
        {appMode === 'admin' && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">{currentInfo.actionLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
};
