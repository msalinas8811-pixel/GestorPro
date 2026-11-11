import React, { useState } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Apple, 
  Share2, 
  Download, 
  CheckCircle2, 
  X, 
  Copy, 
  Terminal, 
  ExternalLink,
  Flame,
  Layers,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'iphone' | 'android' | 'apk'>('iphone');
  const [copiedCode, setCopiedCode] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    try {
      setInstalling(true);
      await install();
    } finally {
      setInstalling(false);
    }
  };

  const capacitorCommands = `# 1. Instalar Capacitor en la raíz del proyecto
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Inicializar Capacitor
npx cap init "Importoys SV" "com.importoysv.taller" --web-dir dist

# 3. Compilar la aplicación y sincronizar con Android
npm run build
npx cap add android
npx cap sync android

# 4. Abrir en Android Studio para generar el archivo .apk
npx cap open android
# (En Android Studio: Build > Build Bundle(s) / APK(s) > Build APK)`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(capacitorCommands);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-950 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-red-900/40">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold block">
                Instalación Móvil & Tablet
              </span>
              <h3 className="text-xl font-black tracking-tight">
                Instalar App Importoys SV
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 p-2 bg-slate-100 border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('iphone')}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'iphone'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Apple className="w-4 h-4 text-slate-900" />
            <span>iPhone (iOS)</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'android'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Tablet / Android</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'apk'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4 text-red-600" />
            <span>Generar APK</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5">
          {/* TAB 1: iPHONE / iOS */}
          {activeTab === 'iphone' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <Apple className="w-6 h-6 text-slate-900 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Instalación en iPhone (Safari)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Apple permite instalar la app directamente desde Safari sin necesidad de la App Store. Quedará en tu pantalla de inicio como una aplicación nativa, con su icono rojo de Importoys y a pantalla completa.
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-800">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p className="pt-0.5">
                    Abre el enlace de la aplicación en el navegador <strong>Safari</strong> de tu iPhone.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p className="pt-0.5">
                    Toca el botón <strong>Compartir</strong> (icono del cuadrado con flecha hacia arriba <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> en la barra inferior de Safari).
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p className="pt-0.5">
                    Desliza hacia abajo y presiona <strong>"Agregar a pantalla de inicio"</strong> (+).
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                    4
                  </div>
                  <p className="pt-0.5">
                    Presiona <strong>"Agregar"</strong> en la esquina superior derecha. ¡Listo! Tendrás el icono en tu iPhone para abrirla con 1 toque.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Compatible con iOS 16, 17 y 18 con soporte para notificaciones y pantalla completa.</span>
              </div>
            </div>
          )}

          {/* TAB 2: ANDROID / TABLETS */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <Tablet className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Instalación Directa en Tablets y Celulares Android
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    En Android (Chrome, Edge o Samsung Internet), el sistema genera un paquete WebAPK automático que se instala como aplicación de sistema.
                  </p>
                </div>
              </div>

              {isInstallable ? (
                <button
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <Download className="w-4 h-4" />
                  <span>{installing ? 'Instalando aplicación...' : 'Instalar Ahora en este Dispositivo Android'}</span>
                </button>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-800">
                  <p className="font-bold text-slate-900">
                    Pasos rápidos para instalar en tu tablet de bodega:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                    <li>Abre el enlace de la app en <strong>Google Chrome</strong> en la tablet o teléfono.</li>
                    <li>Toca los <strong>tres puntos (⋮)</strong> en la esquina superior derecha.</li>
                    <li>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.</li>
                    <li>Confirma la instalación; la tablet creará el acceso directo con icono propio.</li>
                  </ol>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>¿Ya instalada en este equipo?</span>
                <span className="font-bold text-slate-900">
                  {isInstalled ? '✅ Sí (Modo App Activo)' : 'ℹ️ Ejecutando en navegador'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: GENERAR APK */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Empaquetar como archivo .APK autónomo (Capacitor)
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Si deseas generar un archivo físico <strong>Importoys.apk</strong> para pasarlo por WhatsApp, Telegram o cable USB a las tablets del taller sin pasar por tiendas:
                </p>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono leading-relaxed overflow-x-auto border border-slate-800">
                  {capacitorCommands}
                </pre>
                <button
                  onClick={handleCopyCode}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar Comandos</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                <strong>Alternativa en la nube (PWABuilder):</strong> Puedes entrar a <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer" className="underline font-bold text-amber-950">PWABuilder.com</a>, ingresar la URL de tu app y descargará el `.apk` listo para instalar en cualquier Android.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Importoys SV · Taller & Bodega El Salvador
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
