import api from './api';
import type { Credentials } from '../../types';

export const login = (credentials: Credentials) => {
  return api.post('auth/login', credentials);
};
