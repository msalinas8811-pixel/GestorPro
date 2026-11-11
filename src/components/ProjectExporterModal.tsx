import React, { useState } from 'react';
import { X, Download, Upload, Github, Database, Check, AlertCircle, FileArchive, Copy, RefreshCw } from 'lucide-react';
import { AppData } from '../types';
import { downloadProjectZip, exportDataAsJSON } from '../services/exportService';

interface ProjectExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: AppData;
  onRestoreData: (restored: AppData) => void;
  onResetData: () => void;
}

export const ProjectExporterModal: React.FC<ProjectExporterModalProps> = ({
  isOpen,
  onClose,
  currentData,
  onRestoreData,
  onResetData
}) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'backup' | 'github' | 'firebase'>('zip');
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    try {
      setIsGeneratingZip(true);
      await downloadProjectZip(currentData);
    } catch (err) {
      console.error('Error al generar ZIP:', err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as AppData;
        if (!parsed.orders || !parsed.tasks || !parsed.products) {
          throw new Error('El archivo no contiene la estructura requerida de GestorPro.');
        }
        onRestoreData(parsed);
        setRestoreSuccess(true);
        setTimeout(() => setRestoreSuccess(false), 3000);
      } catch (err: any) {
        setRestoreError(err.message || 'Error al procesar el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const gitCommands = `# 1. Inicializar repositorio Git
git init

# 2. Agregar todos los archivos
git add .

# 3. Primer commit
git commit -m "feat: Sistema de control de órdenes, tareas e inventario GestorPro"

# 4. Vincular con tu repositorio en GitHub
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 5. Subir a GitHub
git push -u origin main`;

  const firebaseRulesContent = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isGestorProOwner() {
      return request.auth != null
        && request.auth.token.email_verified == true
        && request.auth.token.email == 'msalinas8811@gmail.com';
    }
    match /orders/{id} { allow read, write: if isGestorProOwner(); }
    match /tasks/{id} { allow read, write: if isGestorProOwner(); }
    match /products/{id} { allow read, write: if isGestorProOwner(); }
    match /movements/{id} { allow read, write: if isGestorProOwner(); }
    match /technicians/{id} { allow read, write: if isGestorProOwner(); }
    match /gestorpro_meta/{id} { allow read, write: if isGestorProOwner(); }
    match /{document=**} { allow read, write: if false; }
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Exportación, GitHub y Firebase</h2>
            <p className="text-xs text-slate-500">Descarga el código en ZIP, crea backups y vincula tu base de datos</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2">
          <button
            onClick={() => setActiveTab('zip')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'zip'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileArchive className="w-4 h-4" />
            Descargar ZIP (Proyecto Completo)
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'backup'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Respaldo y Restauración
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'github'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Github className="w-4 h-4" />
            Subir a GitHub
          </button>
          <button
            onClick={() => setActiveTab('firebase')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'firebase'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Base de Datos Firebase
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'zip' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 text-blue-800 rounded-lg shrink-0">
                    <FileArchive className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">Paquete ZIP listo para GitHub y Producción</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      El archivo ZIP incluye la estructura completa del proyecto: configuración de Vite, TypeScript, Tailwind CSS, componentes React, reglas de seguridad de Firebase y una copia snapshot en JSON de todos tus registros actuales (órdenes, tareas e inventario).
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Incluye <span className="font-semibold text-slate-800">{currentData.orders.length} órdenes</span>,{' '}
                    <span className="font-semibold text-slate-800">{currentData.tasks.length} tareas</span> y{' '}
                    <span className="font-semibold text-slate-800">{currentData.products.length} productos</span>.
                  </div>
                  <button
                    onClick={handleDownloadZip}
                    disabled={isGeneratingZip}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {isGeneratingZip ? 'Empaquetando ZIP...' : 'Descargar Proyecto ZIP'}
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-2">
                <p className="font-medium text-slate-700">Contenido del archivo ZIP:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
                  <li><code className="font-mono bg-slate-100 px-1 py-0.5 rounded">package.json</code> con todas las dependencias y scripts de construcción.</li>
                  <li><code className="font-mono bg-slate-100 px-1 py-0.5 rounded">README.md</code> con las instrucciones de instalación paso a paso.</li>
                  <li><code className="font-mono bg-slate-100 px-1 py-0.5 rounded">firestore.rules</code> con reglas de seguridad listas para Firebase.</li>
                  <li><code className="font-mono bg-slate-100 px-1 py-0.5 rounded">backup-datos-gestorpro.json</code> con tus registros actuales.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Export backup */}
              <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between bg-white">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Crear Copia de Seguridad (JSON)</h4>
                  <p className="text-xs text-slate-500">Guarda una copia descargable de todas las órdenes, fotos de avances, tareas y kardex de inventario.</p>
                </div>
                <button
                  onClick={() => exportDataAsJSON(currentData)}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar Copia JSON
                </button>
              </div>

              {/* Import backup */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Restaurar Copia de Seguridad</h4>
                    <p className="text-xs text-slate-500">Importa un archivo .json previamente exportado para recuperar todos los registros.</p>
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    Cargar Archivo JSON
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {restoreSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs">
                    <Check className="w-4 h-4 text-emerald-600" />
                    ¡Copia de seguridad restaurada con éxito! Todos los registros han sido actualizados.
                  </div>
                )}

                {restoreError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-800 rounded-lg text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    {restoreError}
                  </div>
                )}
              </div>

              {/* Reset to defaults */}
              <div className="border border-rose-200 rounded-lg p-4 bg-rose-50/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-rose-900">Reestablecer a Datos Demostrativos</h4>
                  <p className="text-xs text-rose-700">Reinicia los datos a los valores de prueba iniciales de fábrica.</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de que deseas reiniciar los datos a valores iniciales de fábrica?')) {
                      onResetData();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reiniciar Datos
                </button>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Sigue estos comandos en tu terminal para publicar el proyecto en tu cuenta de GitHub:
              </p>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                  {gitCommands}
                </pre>
                <button
                  onClick={() => handleCopy(gitCommands, 'git')}
                  className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
                  title="Copiar comandos"
                >
                  {copiedCode === 'git' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                <p className="font-bold">Requisito previo:</p>
                <p>Crea primero un repositorio vacío en tu perfil de <a href="https://github.com/new" target="_blank" rel="noreferrer" className="underline font-semibold">github.com/new</a> y reemplaza <code className="bg-amber-100 px-1 rounded">TU_USUARIO/TU_REPOSITORIO</code> con tu URL.</p>
              </div>
            </div>
          )}

          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Reglas de seguridad recomendadas para <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">firestore.rules</code>:
              </p>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                  {firebaseRulesContent}
                </pre>
                <button
                  onClick={() => handleCopy(firebaseRulesContent, 'firebase')}
                  className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
                  title="Copiar reglas"
                >
                  {copiedCode === 'firebase' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-2">
                <p className="font-bold">Estructura de colecciones Firestore:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white rounded border border-blue-100">
                    <span className="font-mono font-bold">/orders</span>: Órdenes de trabajo y bitácora
                  </div>
                  <div className="p-2 bg-white rounded border border-blue-100">
                    <span className="font-mono font-bold">/tasks</span>: Tareas, checklist y horas
                  </div>
                  <div className="p-2 bg-white rounded border border-blue-100">
                    <span className="font-mono font-bold">/inventory</span>: Repuestos y existencias
                  </div>
                  <div className="p-2 bg-white rounded border border-blue-100">
                    <span className="font-mono font-bold">/movements</span>: Kardex de entradas/salidas
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
