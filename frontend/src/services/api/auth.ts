import api from './api';
import type { ChangePassword, Credentials } from '../../types';

export const login = (credentials: Credentials) => {
  return api.post('auth/login', credentials);
};

export const restorePassword = (credentials: Pick<Credentials, "username">) => {
  return api.patch('auth/forgot-password', credentials);
};

export const changePassword = ({ password_anterior, password_nuevo }: ChangePassword) => {
  const passwordData = { password_anterior, password_nuevo };
  return api.patch('auth/change-password', passwordData);
};
