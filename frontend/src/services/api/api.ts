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
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
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
    if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    const responseData = error?.response?.data;
    const msg =
      responseData?.message ||
      responseData?.error ||
      error?.message ||
      'Error en la respuesta del servidor.';

    if (responseData) {
      showToast(msg, 'error');
    } else if (error?.request) {
      showToast('No se recibió respuesta del servidor.', 'warning');
    } else {
      showToast(msg, 'error');
    }

    return Promise.reject(error);
  }
);

export default api;
