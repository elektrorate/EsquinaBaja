# Descargador de Videos (TikTok & Instagram)

Una aplicación web moderna, rápida y 100% responsiva con diseño minimalista para descargar videos de **TikTok** e **Instagram** (Reels y Posts) sin marcas de agua, extraer audio en formato MP3 y descargar miniaturas en alta resolución.

![Descargador de Videos](https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&auto=format&fit=crop&q=80)

---

## Características Principales

- **Detección Automática de Plataforma**: Identifica al instante si el enlace pertenece a TikTok o Instagram.
- **Sin Marca de Agua (Watermark-Free)**: Descarga videos MP4 en su resolución original más alta disponible.
- **Extractor de Audio MP3**: Descarga únicamente el audio o música del video.
- **Descarga de Portadas / Miniaturas**: Guarda la imagen en alta definición JPG.
- **Reproductor de Previsualización**: Mira el video y escucha el audio antes de descargarlo.
- **Pegado Rápido con 1 Clic**: Botón para leer directamente desde el portapapeles del dispositivo.
- **Historial Local**: Almacenamiento seguro en el navegador para volver a acceder a descargas recientes.
- **Descargas Directas Vía Proxy**: Evita bloqueos de CORS y asegura que el archivo se guarde directamente en tu carpeta de descargas (`attachment`).
- **Diseño Minimalista & Responsivo**: Optimizado para teléfonos móviles (iOS/Android), tablets y computadoras de escritorio.

---

## Tecnologías Utilizadas

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/), [Motion](https://motion.dev/)
- **Backend**: [Node.js](https://nodejs.org/) con [Express](https://expressjs.com/) y [Vite](https://vitejs.dev/) en modo middleware
- **Empaquetado**: [esbuild](https://esbuild.github.io/) y [tsx](https://github.com/privatenumber/tsx)

---

## Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU-USUARIO/TU-REPOSITORIO.git
cd TU-REPOSITORIO
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

### 4. Compilar para producción
```bash
npm run build
npm start
```

---

## Endpoints de la API Backend

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/extract` | Extrae metadatos del video, opciones de descarga (HD, sin marca, audio) y estadísticas |
| `GET` | `/api/proxy-download` | Descarga el archivo multimedia directamente forzando `Content-Disposition: attachment` |
| `GET` | `/api/health` | Verificación de estado del servidor |

---

## Licencia

Este proyecto se distribuye bajo la licencia MIT.
