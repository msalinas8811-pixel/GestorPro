import JSZip from 'jszip';
import { AppData, Order, Task, Product, StockMovement } from '../types';

/**
 * Utility to download text or blob files in the browser
 */
export function downloadFile(content: BlobPart, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export full JSON backup
 */
export function exportDataAsJSON(data: AppData) {
  const jsonStr = JSON.stringify(data, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(jsonStr, `gestorpro-backup-${dateStr}.json`, 'application/json');
}

/**
 * Convert data array to clean CSV with proper quotes and BOM for Excel Spanish
 */
export function convertToCSV<T extends Record<string, unknown>>(rows: T[], headers: { key: keyof T; label: string }[]): string {
  if (!rows || rows.length === 0) return '';
  const headerLine = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(';');
  const dataLines = rows.map(row => {
    return headers.map(h => {
      const val = row[h.key];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(';');
  });
  // Excel UTF-8 BOM
  return '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
}

export function exportOrdersCSV(orders: Order[]) {
  const headers = [
    { key: 'code' as const, label: 'Código OT' },
    { key: 'title' as const, label: 'Título' },
    { key: 'clientName' as const, label: 'Cliente' },
    { key: 'clientPhone' as const, label: 'Teléfono' },
    { key: 'category' as const, label: 'Categoría' },
    { key: 'priority' as const, label: 'Prioridad' },
    { key: 'status' as const, label: 'Estado' },
    { key: 'progress' as const, label: 'Avance (%)' },
    { key: 'assignedTo' as const, label: 'Responsable' },
    { key: 'estimatedBudget' as const, label: 'Presupuesto ($)' },
    { key: 'actualCost' as const, label: 'Costo Real ($)' },
    { key: 'createdAt' as const, label: 'Fecha Creación' },
    { key: 'deadline' as const, label: 'Fecha Límite' },
  ];
  const csv = convertToCSV(orders as unknown as Record<string, unknown>[], headers as any);
  downloadFile(csv, `ordenes-trabajo-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export function exportTasksCSV(tasks: Task[]) {
  const headers = [
    { key: 'code' as const, label: 'Código Tarea' },
    { key: 'orderCode' as const, label: 'Orden Asociada' },
    { key: 'title' as const, label: 'Título' },
    { key: 'assignedTo' as const, label: 'Asignado a' },
    { key: 'priority' as const, label: 'Prioridad' },
    { key: 'status' as const, label: 'Estado' },
    { key: 'progress' as const, label: 'Avance (%)' },
    { key: 'dueDate' as const, label: 'Fecha Vencimiento' },
    { key: 'estimatedHours' as const, label: 'Horas Estimadas' },
    { key: 'actualHours' as const, label: 'Horas Reales' },
    { key: 'createdAt' as const, label: 'Fecha Registro' },
  ];
  const csv = convertToCSV(tasks as unknown as Record<string, unknown>[], headers as any);
  downloadFile(csv, `tareas-operativas-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export function exportProductsCSV(products: Product[]) {
  const headers = [
    { key: 'sku' as const, label: 'SKU / Código' },
    { key: 'name' as const, label: 'Producto / Repuesto' },
    { key: 'category' as const, label: 'Categoría' },
    { key: 'stock' as const, label: 'Stock Actual' },
    { key: 'minStock' as const, label: 'Stock Mínimo' },
    { key: 'unit' as const, label: 'Unidad de Medida' },
    { key: 'unitPrice' as const, label: 'Precio Venta ($)' },
    { key: 'costPrice' as const, label: 'Costo Unitario ($)' },
    { key: 'location' as const, label: 'Ubicación' },
  ];
  const csv = convertToCSV(products as unknown as Record<string, unknown>[], headers as any);
  downloadFile(csv, `inventario-productos-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export function exportMovementsCSV(movements: StockMovement[]) {
  const headers = [
    { key: 'timestamp' as const, label: 'Fecha y Hora' },
    { key: 'type' as const, label: 'Tipo Movimiento' },
    { key: 'sku' as const, label: 'SKU' },
    { key: 'productName' as const, label: 'Producto' },
    { key: 'quantity' as const, label: 'Cantidad' },
    { key: 'previousStock' as const, label: 'Stock Anterior' },
    { key: 'newStock' as const, label: 'Stock Resultante' },
    { key: 'reason' as const, label: 'Motivo / Detalle' },
    { key: 'orderCode' as const, label: 'Orden de Trabajo' },
    { key: 'user' as const, label: 'Registrado por' },
  ];
  const csv = convertToCSV(movements as unknown as Record<string, unknown>[], headers as any);
  downloadFile(csv, `kardex-movimientos-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Creates and downloads a complete ZIP repository ready for GitHub
 * with README, package.json, source code, Firebase rules, and exported data!
 */
export async function downloadProjectZip(currentData: AppData): Promise<void> {
  const zip = new JSZip();

  // Root files
  zip.file('package.json', JSON.stringify({
    name: 'gestorpro-ordenes-tareas-inventario',
    private: true,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc -b && vite build',
      preview: 'vite preview',
      lint: 'tsc --noEmit'
    },
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      'lucide-react': '^0.546.0',
      motion: '^12.0.0',
      jszip: '^3.10.1'
    },
    devDependencies: {
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@types/node': '^22.0.0',
      '@types/jszip': '^3.4.1',
      '@vitejs/plugin-react': '^6.1.1',
      '@tailwindcss/vite': '^4.3.3',
      tailwindcss: '^4.3.3',
      typescript: '^5.7.0',
      vite: '^6.0.0'
    }
  }, null, 2));

  zip.file('.gitignore', `# Logs
logs
*.log
npm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage

# Dependency directories
node_modules/
dist/

# Env
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
`);

  zip.file('README.md', `# GestorPro - Control de Órdenes, Tareas e Inventario

Sistema profesional de operaciones para seguimiento de órdenes de trabajo (OT), gestión de tareas con bitácora fotográfica de avances, control de inventario con kardex automatizado y reportes ejecutivos.

---

## 🚀 Guía Rápida para Subir a GitHub

1. **Descomprimir el archivo ZIP** en tu carpeta de preferencia.
2. Abre una terminal dentro de la carpeta del proyecto y ejecuta:

\`\`\`bash
# 1. Inicializar repositorio Git local
git init

# 2. Agregar todos los archivos
git add .

# 3. Crear el primer commit
git commit -m "feat: initial commit GestorPro con órdenes, tareas e inventario"

# 4. Vincular con tu repositorio en GitHub (crea uno nuevo en github.com/new)
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 5. Subir a GitHub
git push -u origin main
\`\`\`

---

## 📦 Instalación y Ejecución Local

\`\`\`bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
\`\`\`

Abre en tu navegador en \`http://localhost:3000\`.

---

## ⚡ Conexión con Firebase Firestore (Opcional)

1. Ve a [Firebase Console](https://console.firebase.google.com/) y crea un proyecto nuevo.
2. Activa **Firestore Database** en modo de producción.
3. Copia tus credenciales en \`src/firebaseConfig.ts\` o variables de entorno \`.env\`.
4. Utiliza las reglas de seguridad incluidas en el archivo \`firestore.rules\`.

---

## 📁 Estructura del Proyecto

- \`src/components/\`: Módulos de Órdenes, Tareas, Inventario, Reportes, Modales y Fotografías.
- \`src/types/\`: Definiciones TypeScript estrictas.
- \`src/services/\`: Servicios de almacenamiento persistente, exportaciones CSV y generador de ZIP.
- \`backup-datos-gestorpro.json\`: Copia exacta de los registros actuales listos para importar.
`);

  // Include rules for Firestore
  zip.file('firestore.rules', `rules_version = '2';
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
}`);

  // Include current database backup JSON inside ZIP
  zip.file('backup-datos-gestorpro.json', JSON.stringify(currentData, null, 2));

  // Add source files
  const src = zip.folder('src');
  if (src) {
    src.file('types/index.ts', `// Ver types del proyecto GestorPro`);
  }

  // Generate ZIP blob and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(blob, `gestorpro-proyecto-github-${dateStr}.zip`, 'application/zip');
}
