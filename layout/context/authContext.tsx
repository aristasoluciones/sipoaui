import React, { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    useMemo,
    useCallback
 } from 'react';
import http, { setAuthToken } from '@/src/lib/axios';
import { 
    storeUserDataSecurely,
    getUserDataSecurely,
    storeTokenSecurely,
    getTokenSecurely,
    clearSessionData, 
    isSuperAdminRole,
    isValidTokenFormat
} from '@/src/utils/security';
import {User, AuthContextProps} from '@/types/auth';

// Utilidades para manejo de datos de autenticación
const extractRoleNames = (roles: any[]): string[] => {
    return roles.map(role => 
        typeof role === 'string' ? role : role.name || role.role_name || role.nombre
    ).filter(Boolean);
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Hook personalizado para lógica de permisos
const usePermissions = (permissions: string[], userRoles: string[]) => {
    const isSuperAdmin = useMemo(() => isSuperAdminRole(userRoles), [userRoles]);

    const hasPermission = useCallback((permission: string): boolean => {
        if (!permission) return false;
        if (isSuperAdmin) return true;
        return permissions.includes(permission);
    }, [permissions, isSuperAdmin]);

    const hasAnyPermission = useCallback((requiredPermissions: string[]): boolean => {
        if (!requiredPermissions || requiredPermissions.length === 0) return true;
        if (isSuperAdmin) return true;
        return requiredPermissions.some(permission => permissions.includes(permission));
    }, [permissions, isSuperAdmin]);

    const hasAllPermissions = useCallback((requiredPermissions: string[]): boolean => {
        if (!requiredPermissions || requiredPermissions.length === 0) return true;
        if (isSuperAdmin) return true;
        return requiredPermissions.every(permission => permissions.includes(permission));
    }, [permissions, isSuperAdmin]);

    return {
        isSuperAdmin,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions
    };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

     // Hook de permisos
    const { isSuperAdmin, hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions(permissions, userRoles);

    // isAuthenticated ahora valida que exista token con formato válido
    const isAuthenticated = useMemo(() => {
        return token !== null && isValidTokenFormat(token);
    }, [token]);

    // Sincronizar token con axios automáticamente
    useEffect(() => {
        setAuthToken(token);
    }, [token]);

    // Función para limpiar todo el estado
    const clearAllState = useCallback(() => {
        setUser(null);
        setToken(null);
        setPermissions([]);
        setUserRoles([]);
        clearSessionData();
    }, []);

    // Función para establecer datos de usuario con validación
    const setUserData = useCallback(async (userData: any, userPermissions: string[] = [], userRolesList: string[] = []) => {
        if (!userData) {
            clearAllState();
            return;
        }

        setUser(userData);
        setPermissions(userPermissions);
        setUserRoles(userRolesList);
        
        // Almacenar datos de usuario de forma segura (sin token)
        if (userPermissions.length > 0 || userRolesList.length > 0) {
            await storeUserDataSecurely(userData, userPermissions, userRolesList);
        }
    }, [clearAllState]);
    
    // Función para verificar autenticación
    const checkAuth = useCallback(async (): Promise<void> => {
        try {
            const res = await http.get(`/api/auth/profile`);
            const responseData = res.data || res;
            
            if (!responseData || !responseData.user) {
                clearAllState();
                return;
            }

            const userData = responseData.user;
            // Extraer permisos y roles del perfil,de esta manera siempre estara actualizada si en el backend cambian
            // los permisos o roles del usuario
            const userPermissions = userData.permisos || userData.permissions || responseData.permisos || responseData.permissions || [];
            const userRolesData = userData.roles || responseData.roles || [];

            // Convertir roles a nombres soporta arrays de strings o objetos
            const roleNames = extractRoleNames(userRolesData);

            // Establecer datos de usuario
            setUserData(userData, userPermissions, roleNames);

        } catch (error: any) {      
            // Si es 401/403, limpiar todo y el SessionGuard se encargará de redirigir
            if (error.response?.status === 401 || error.response?.status === 403) {
                clearAllState();
            } else {
                // Para otros errores, mantener datos de localStorage si existen
                const storedData = await getUserDataSecurely();
                if (!storedData || !storedData.permissions || !storedData.roles) {
                    clearAllState();
                }
            }
        }
    }, [clearAllState, setUserData]);

    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
        
            try {
                // Cargar token desde localStorage
                const storedToken = await getTokenSecurely();
                if (storedToken) {
                    setToken(storedToken);
                }

                // Cargar datos de usuario desde localStorage
                const storedData = await getUserDataSecurely();
                if (storedData && storedData.permissions && storedData.roles) {
                    setPermissions(storedData.permissions);
                    setUserRoles(storedData.roles);
                    if (storedData.user) {
                        setUser(storedData.user);
                    }
                }
                
                // Validar con el backend si tenemos token
                if (storedToken) {
                    await checkAuth();
                }

            } catch (error) {
                clearAllState();
            } finally {
                setLoading(false);
                setInitialized(true);
            }
        };

        if (!initialized) {
            initializeAuth();
        }
    }, [initialized]);

    // Función de login con tokens Sanctum
    const login = useCallback(async (email: string, password: string): Promise<void> => {
        setLoading(true);
        try {
            // Ya no necesitamos CSRF cookie para tokens Bearer
            const res: any = await http.post(`/api/auth/login`, {
                email,
                password
            });
        
            if (!res || !res.user || !res.token) {
                throw new Error('Respuesta de login inválida: falta usuario o token');
            }

            // Extraer permisos y roles del usuario
            const userPermissions = res.user?.permisos || res.permissions || [];
            const userRolesData = res.user?.roles || res.roles || [];

            // Extraer nombres de roles del array de objetos soporta arrays de strings o objetos
            const roleNames = extractRoleNames(userRolesData);

            // Guardar token de forma segura (separado de datos de usuario)
            await storeTokenSecurely(res.token);
            setToken(res.token);

            // Establecer y guardar datos de usuario
            await setUserData(res.user, userPermissions, roleNames);
            
        } catch (error) {
            clearAllState();
            throw error;
        } finally {
            setLoading(false);
        }
    }, [clearAllState, setUserData]);

     // Función de logout con revocación de token
    const logout = useCallback(async (): Promise<void> => {
        setLoading(true);
        try {
            // Revocar token en el backend
            await http.post(`/api/auth/logout`);
        } catch (error) {
            console.warn('⚠️ Error durante logout (probablemente ya desconectado):', error);
        } finally {
            // Limpiar token y todos los datos
            clearAllState();
            setLoading(false);
        }
    }, [clearAllState]);

    // Debug en desarrollo
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && initialized && !loading) {
            console.log('🔐Estado de autenticación:', {
                isAuthenticated,
                user: user?.email || 'No autenticado',
                isSuperAdmin,
                permissions: permissions.length,
                roles: userRoles,
                loading,
                initialized
            });
        }
    }, [initialized, loading, isAuthenticated, user, isSuperAdmin, permissions, userRoles]);

    return (
       <AuthContext.Provider value={{ 
            user,
            token,
            isAuthenticated, 
            loading,
            initialized,
            login, 
            logout, 
            checkAuth,
            permissions,
            userRoles,
            isSuperAdmin,
            hasPermission,
            hasAnyPermission,
            hasAllPermissions
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};