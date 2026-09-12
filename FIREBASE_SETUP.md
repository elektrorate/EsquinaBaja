# Conectar EsquinaBaja a Firebase Hosting y Cloud Functions

Esta guía explica cómo desplegar la aplicación en **Firebase Hosting** con **Cloud Functions** para procesar videos de Instagram y TikTok desde un backend seguro sin restricciones CORS del navegador.

---

## 📁 Archivos ya configurados en el proyecto

- `firebase.json`: Configura Firebase Hosting para servir la carpeta `dist` y redirigir `/api/**` hacia la Cloud Function `api`.
- `.firebaserc`: Define el identificador del proyecto de Firebase predeterminado.
- `functions/package.json`: Dependencias de la Cloud Function (Node.js 20, Express, CORS, Firebase Functions).
- `functions/index.js`: Código del backend serverless que extrae metadatos y videos de Instagram y TikTok, e incluye proxy de descarga.

---

## 🚀 Pasos para desplegar

### 1. Iniciar sesión en Firebase CLI
En tu terminal:
```bash
npm install -g firebase-tools
firebase login
```

### 2. Vincular con tu proyecto de Firebase
Si creaste un proyecto en [Firebase Console](https://console.firebase.google.com/):
```bash
firebase use --add
# Selecciona tu proyecto y ponle el alias 'default'
```

*Nota: Para habilitar Cloud Functions, Firebase requiere que el proyecto esté en el plan **Blaze** (pago por uso, incluye 2M de ejecuciones gratuitas al mes).*

### 3. Instalar dependencias de las funciones
```bash
cd functions
npm install
cd ..
```

### 4. Compilar la web y desplegar
```bash
# Compilar la aplicación React con Vite
npm run build

# Desplegar Hosting y Cloud Functions
firebase deploy
```

Al terminar, Firebase te proporcionará la URL de producción:
`https://<tu-proyecto>.web.app`

---

## 🔐 (Opcional) Soporte de API Key para Instagram
Si cuentas con una clave de RapidAPI para garantizar el 100% de tasa de éxito en Instagram Reels:
```bash
firebase functions:secrets:set RAPIDAPI_KEY
```
O define la variable de entorno en Firebase.
