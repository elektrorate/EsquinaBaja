import { GOOGLE_CLIENT_ID, API_BASE_URL } from '../config';

interface TokenClientResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GsiClient {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (resp: TokenClientResponse) => void;
  }): { requestAccessToken: (opts?: { prompt?: string }) => void };
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2: GsiClient } };
  }
}

let loadPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('No se pudo cargar el SDK de Google. Revisa tu conexión.'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

function getAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts!.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (resp) => {
        if (resp.access_token) {
          resolve(resp.access_token);
        } else {
          reject(new Error(resp.error_description || resp.error || 'No se pudo iniciar sesión con Google.'));
        }
      },
    });
    client.requestAccessToken({ prompt: 'consent' });
  });
}

export interface DriveUploadResult {
  ok: boolean;
  fileId?: string;
  webViewLink?: string;
  folderName?: string;
  error?: string;
}

export async function uploadVideoToDrive(opts: {
  token: string;
  videoUrl: string;
  filename: string;
  mimeType?: string;
}): Promise<DriveUploadResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/drive/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: opts.token,
        videoUrl: opts.videoUrl,
        filename: opts.filename,
        mimeType: opts.mimeType,
      }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return { ok: true, fileId: json.data?.fileId, webViewLink: json.data?.webViewLink, folderName: json.data?.folderName };
    }
    return { ok: false, error: json.error || 'Error al guardar en Google Drive.' };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'No se pudo conectar con el servidor.' };
  }
}

export async function signInToGoogleAndUpload(opts: {
  videoUrl: string;
  filename: string;
  mimeType?: string;
}): Promise<DriveUploadResult> {
  if (!GOOGLE_CLIENT_ID) {
    return {
      ok: false,
      error: 'Falta configurar VITE_GOOGLE_CLIENT_ID en el backend/hosting.',
    };
  }
  try {
    await loadGsiScript();
    const token = await getAccessToken(GOOGLE_CLIENT_ID);
    return await uploadVideoToDrive({ token, ...opts });
  } catch (err: any) {
    return { ok: false, error: err?.message || 'No se pudo guardar en Google Drive.' };
  }
}