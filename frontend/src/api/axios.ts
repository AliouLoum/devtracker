import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Si on est hors ligne et que ce n'est pas un GET, on pourrait simuler le succès,
  // mais laissons l'appel échouer pour qu'il soit attrapé par l'intercepteur de réponse.
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Ne pas intercepter les 401 pour les routes de connexion/inscription
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.error("401 Unauthorized encountered for URL:", originalRequest.url);
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await api.post('/auth/refresh', { refreshToken });
          if (res.data.accessToken) {
            localStorage.setItem('accessToken', res.data.accessToken);
            if (res.data.refreshToken) {
               localStorage.setItem('refreshToken', res.data.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          }
        } catch (e) {
          console.error("Token refresh failed", e);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        console.warn("No refresh token found, redirecting to login");
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    // Gérer le mode hors-ligne
    if (!navigator.onLine && originalRequest.method !== 'get') {
      const { useOfflineStore } = await import('../store/offlineStore');
      useOfflineStore.getState().enqueueRequest({
        method: originalRequest.method,
        url: originalRequest.url,
        data: originalRequest.data,
        headers: originalRequest.headers,
      });
      // Retourner une réponse "simulée" pour ne pas bloquer le frontend
      return Promise.resolve({ data: { success: true, offline: true } });
    }

    return Promise.reject(error);
  }
);

export default api;
