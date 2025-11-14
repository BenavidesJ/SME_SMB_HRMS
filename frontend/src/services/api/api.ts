import axios from 'axios';
import { showToast } from '../toast/toastService';

const api = axios.create({
  baseURL: import.meta.env.API_URL || 'http://localhost:3000/v1/',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const storedData = localStorage.getItem('user');
    if (storedData) {
      try {
        const { data } = JSON.parse(storedData);
        const accessToken = data?.access_token;
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      } catch (error) {
        console.error('Error al decodificar los datos de autenticación', error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    if (method && method !== 'get') {
      const message = response.data.message;
      if (message) showToast(message, 'success', 'Consulta Exitosa.');
    }
    return response;
  },
  (error) => {
    if (error.message) {
      const msg =
        error.response.data.message || error.response.data.error ||  'Error en la respuesta del servidor.';
      showToast(msg, 'error');
    } else if (error.request) {
      showToast('No se recibió respuesta del servidor.', 'warning');
    } else {
      showToast(error.message, 'error');
    }
    return Promise.reject(error);
  }
);

export default api;
