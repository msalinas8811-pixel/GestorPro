# GestorPro - Control de Órdenes, Tareas e Inventario

Sistema profesional de operaciones para seguimiento de órdenes de trabajo (OT), gestión de tareas con bitácora fotográfica de avances, control de inventario con kardex automatizado y reportes ejecutivos.

---

## 🚀 Guía Rápida para Subir a GitHub

1. **Descomprimir el archivo ZIP** en tu carpeta de preferencia.
2. Abre una terminal dentro de la carpeta del proyecto y ejecuta:

```bash
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
```

---

## 📦 Instalación y Ejecución Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre en tu navegador en `http://localhost:3000`.

---

## ⚡ Conexión con Firebase Firestore (Opcional)

1. Ve a [Firebase Console](https://console.firebase.google.com/) y crea un proyecto nuevo.
2. Activa **Firestore Database** en modo de producción.
3. Copia tus credenciales en `src/firebaseConfig.ts` o variables de entorno `.env`.
4. Utiliza las reglas de seguridad incluidas en el archivo `firestore.rules`.

---

## 📁 Estructura del Proyecto

- `src/components/`: Módulos de Órdenes, Tareas, Inventario, Reportes, Modales y Fotografías.
- `src/types/`: Definiciones TypeScript estrictas.
- `src/services/`: Servicios de almacenamiento persistente, exportaciones CSV y generador de ZIP.
- `backup-datos-gestorpro.json`: Copia exacta de los registros actuales listos para importar.
