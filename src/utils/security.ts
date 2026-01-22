/**
 * Utilidades de seguridad para el manejo de permisos y tokens
 * Incluye cifrado AES-256-GCM y validación de tokens Sanctum
 */

// Clave base para cifrado (en producción debería venir de variable de entorno segura)
const SECRET_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY || 'sfpi-secure-key-2025';

/**
 * Genera una clave de cifrado AES a partir de una contraseña
 */
const getEncryptionKey = async (): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(SECRET_KEY),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('sfpi-salt-2025'),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

/**
 * Cifra datos usando AES-256-GCM (cifrado real)
 * @param data - Datos a cifrar
 * @returns String base64 con IV + datos cifrados
 */
export const encryptAES = async (data: any): Promise<string> => {
    try {
        const encoder = new TextEncoder();
        const key = await getEncryptionKey();
        const iv = crypto.getRandomValues(new Uint8Array(12)); // IV de 96 bits para GCM
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoder.encode(JSON.stringify(data))
        );

        // Combinar IV + datos cifrados
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.length);

        // Convertir a base64
        let binary = '';
        const len = combined.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(combined[i]);
        }
        return btoa(binary);
    } catch (error) {
        throw error;
    }
};

/**
 * Descifra datos usando AES-256-GCM
 * @param encryptedData - Datos cifrados en base64
 * @returns Datos originales o null si falla
 */
export const decryptAES = async (encryptedData: string): Promise<any> => {
    try {
        const key = await getEncryptionKey();
        
        // Decodificar base64
        const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        
        // Separar IV + datos cifrados
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encrypted
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
        return null;
    }
};

/**
 * Valida el formato de un token Sanctum
 * Formato esperado: {id}|{plainTextToken}
 * Ejemplo: 1|abcdef123456789
 */
export const isValidTokenFormat = (token: string): boolean => {
    if (!token || typeof token !== 'string') return false;
    
    // Regex para formato Sanctum: número|alfanumérico
    const sanctumPattern = /^\d+\|[a-zA-Z0-9]+$/;
    return sanctumPattern.test(token);
};

/**
 * Formatea un token agregando el prefijo Bearer si no lo tiene
 */
export const formatBearerToken = (token: string): string => {
    if (!token) return '';
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
};

/**
 * ===============================================
 * GESTIÓN DE TOKENS SANCTUM
 * ===============================================
 */

/**
 * Almacena el token de autenticación de forma segura (AES-256-GCM)
 * @param token - Token Sanctum (sin prefijo Bearer)
 */
export const storeTokenSecurely = async (token: string): Promise<void> => {
    try {
        if (!isValidTokenFormat(token)) {
            throw new Error('Formato de token inválido');
        }
        const encrypted = await encryptAES({ token, timestamp: Date.now() });
        localStorage.setItem('auth_token', encrypted);
    } catch (error) {
        throw error;
    }
};

/**
 * Recupera el token de autenticación de forma segura
 * @returns Token Sanctum o null si no existe o es inválido
 */
export const getTokenSecurely = async (): Promise<string | null> => {
    try {
        const encrypted = localStorage.getItem('auth_token');
        if (!encrypted) return null;
        
        const data = await decryptAES(encrypted);
        if (!data || !data.token) {
            localStorage.removeItem('auth_token');
            return null;
        }
        
        // Validar formato del token
        if (!isValidTokenFormat(data.token)) {
            localStorage.removeItem('auth_token');
            return null;
        }
        
        return data.token;
    } catch (error) {
        localStorage.removeItem('auth_token');
        return null;
    }
};

/**
 * Elimina el token de autenticación del almacenamiento
 */
export const clearTokenSecurely = (): void => {
    localStorage.removeItem('auth_token');
};

/**
 * ===============================================
 * GESTIÓN DE DATOS DE USUARIO (separado del token)
 * ===============================================
 */

/**
 * Almacena datos de usuario de forma segura (AES-256-GCM)
 * @param user - Objeto de usuario
 * @param permissions - Array de permisos
 * @param roles - Array de roles
 */
export const storeUserDataSecurely = async (user: any, permissions: string[], roles: string[]): Promise<void> => {
    try {
        const data = { 
            user, 
            permissions, 
            roles, 
            sessionId: generateSessionId(),
            timestamp: Date.now()
        };
        const encrypted = await encryptAES(data);
        localStorage.setItem('user_session_data', encrypted);
    } catch (error) {
        throw error;
    }
};

/**
 * Recupera datos de usuario de forma segura
 * @returns Objeto con user, permissions y roles o null si no existe
 */
export const getUserDataSecurely = async (): Promise<{ user: any, permissions: string[], roles: string[] } | null> => {
    try {
        const encrypted = localStorage.getItem('user_session_data');
        if (!encrypted) return null;
        
        const data = await decryptAES(encrypted);
        if (!data) {
            localStorage.removeItem('user_session_data');
            return null;
        }
        
        return {
            user: data.user || null,
            permissions: data.permissions || [],
            roles: data.roles || []
        };
    } catch (error) {
        localStorage.removeItem('user_session_data');
        return null;
    }
};

/**
 * Limpia todos los datos de sesión de forma segura
 */
export const clearSessionData = (): void => {
    clearTokenSecurely();
    localStorage.removeItem('user_session_data');
    sessionStorage.clear();
};

/**
 * Genera un ID de sesión único
 */
const generateSessionId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};


/**
 * Valida si un rol es superadmin
 */
export const isSuperAdminRole = (roles: string[]): boolean => {
    const superAdminRoles = ['superadmin', 'super_admin', 'admin_master', 'root'];
    return roles.some(role => 
        superAdminRoles.includes(role.toLowerCase()) ||
        role.toLowerCase().includes('superadmin')
    );
};
