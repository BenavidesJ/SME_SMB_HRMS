import api from './api';

export const login = (credentials: { username: string; password: string }) => {
  return api.post('auth/login');
};
