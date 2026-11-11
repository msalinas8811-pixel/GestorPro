# GestorPro — Control de órdenes, tareas e inventario

PWA en español para registrar órdenes de trabajo, tareas, avances fotográficos, técnicos, inventario, movimientos y reportes.

## Ejecutar localmente

Requiere Node.js y npm.

```bash
npm install
npm run dev
```

Vite muestra la dirección local en la terminal.

## Firebase conectado

- Proyecto: `gestorpro-importoys-2026`.
- Firestore Standard, región `us-central1`.
- Google Sign-In habilitado.
- Los registros se guardan en Firestore al iniciar sesión y se conservan también en el almacenamiento local del navegador.
- Las reglas autorizan únicamente la cuenta Google verificada `msalinas8811@gmail.com`.

La configuración web de Firebase está en `firebase-applet-config.json`. La clave web de Firebase se usa en el cliente; la protección de los datos depende de las reglas de Firestore, que restringen el acceso a la cuenta autorizada.

Las fotografías se almacenan dentro de cada registro. La sincronización rechaza un registro que supere 850 KB para evitar exceder el límite de Firestore; reduce las fotografías si aparece ese aviso.

## Compilar y publicar en Firebase Hosting

```bash
npm run build
firebase deploy --only firestore:rules,hosting
```

La configuración publica en el sitio `gestorpro-importoys-2026.web.app`. El proyecto predeterminado está fijado en `.firebaserc`.

## Datos de ejemplo

Los registros iniciales son ficticios. Al iniciar sesión por primera vez, se copian a Firestore si todavía no existen registros remotos. Las copias de seguridad JSON son locales y no deben subirse al repositorio público.
