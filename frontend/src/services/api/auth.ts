import api from './api';
import type { Credentials } from '../../types';

export const login = (credentials: Credentials) => {
  return api.post('auth/login', credentials);
};

export const restorePassword = (credentials: Pick<Credentials, "username">) => {
  return api.patch('auth/forgot-password', credentials);
};
