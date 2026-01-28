// Tipos más específicos
export interface User {
  id: number;
  name: string;
  email: string;
  rol: string;
  permisos: string[];
  unidad?: string;
  rolesTitle?: string[];
}

export interface AuthContextProps {
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  permissions: string[];
  userRoles: string[];
  isSuperAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}