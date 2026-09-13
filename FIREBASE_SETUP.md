# Despliegue Automático en Firebase desde GitHub (Sin usar la terminal)

Este repositorio ya está preparado con un flujo de **GitHub Actions** (`.github/workflows/firebase-deploy.yml`) que compila y despliega automáticamente la aplicación y las Cloud Functions a Firebase cada vez que se guarda un cambio en la rama `main`.

---

## ⚠️ Importante: Cómo funciona la descarga de Reels en producción

- La **Cloud Function** (`functions/index.js`) extrae el video real con **yt-dlp** (vía `youtube-dl-exec`). **No necesita API key ni cuotas** de RapidAPI.
- El binario de yt-dlp para Linux se descarga automáticamente durante el `npm install` de la función. `yt-dlp.exe` está en `.gitignore`.
- **Las Cloud Functions requieren el plan Blaze** (facturación por uso). Sin funciones, Instagram no descarga.
- `yt-dlp.exe` es solo para desarrollo local en Windows (`npm run dev`).

---

## 📋 Pasos para conectar GitHub con Firebase (Solo se hace una vez)

### 1. Obtener el token de Firebase
Para que GitHub tenga permiso de desplegar en tu cuenta de Firebase:
- En tu navegador, visita:  
  👉 **[Google Cloud Console - Cuentas de Servicio](https://console.cloud.google.com/iam-admin/serviceaccounts)**  
  *(o la sección Configuración del Proyecto > Cuentas de servicio en Firebase)*.
- Selecciona tu proyecto de Firebase.
- Haz clic en tu cuenta de servicio de Firebase, ve a la pestaña **Claves (Keys)** > **Agregar clave** > **Crear clave nueva (JSON)** y descárgala.
- O bien, si tienes acceso a una consola: ejecuta `firebase login:ci` para obtener un token alfanumérico.

### 2. Guardar el secreto en GitHub
1. Abre tu repositorio en GitHub:  
   👉 **[https://github.com/elektrorate/EsquinaBaja/settings/secrets/actions](https://github.com/elektrorate/EsquinaBaja/settings/secrets/actions)**
2. Haz clic en el botón verde **«New repository secret»**.
3. En **Name**, escribe exactamente:  
   `FIREBASE_TOKEN`
4. En **Secret**, pega el token generado o el contenido del archivo JSON de la clave.
5. Haz clic en **«Add secret»**.

---

## 🚀 ¡Listo!
A partir de este momento:
- Cada cambio en el código se compilará y desplegará automáticamente.
- Puedes ver el progreso en vivo en la pestaña **[Actions](https://github.com/elektrorate/EsquinaBaja/actions)** de tu repositorio.
- Tu aplicación estará disponible en:  
  `https://<tu-id-de-proyecto>.web.app`
