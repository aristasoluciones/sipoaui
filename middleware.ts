import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas públicas que no requieren autenticación
const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/landing'
];

/**
 * Valida el formato Bearer del token Sanctum
 * Formato esperado: Bearer {id}|{plainTextToken}
 */
const isValidBearerToken = (authHeader: string | null): boolean => {
    if (!authHeader) return false;
    
    // Regex: Bearer seguido de espacio y token Sanctum (número|alfanumérico)
    const bearerPattern = /^Bearer\s+\d+\|[a-zA-Z0-9]+$/;
    return bearerPattern.test(authHeader);
};

export function middleware(request: NextRequest) {
    const { nextUrl } = request;
    
    // Si está en modo mock, permite el acceso sin verificar tokens
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
        return NextResponse.next();
    }
    
    // Permitir acceso a assets estáticos y recursos Next.js
    if (
        nextUrl.pathname.startsWith('/_next') ||
        nextUrl.pathname.startsWith('/favicon.ico') ||
        nextUrl.pathname.startsWith('/themes') ||
        nextUrl.pathname.startsWith('/layout') ||
        nextUrl.pathname.startsWith('/assets')
    ) {
        return NextResponse.next();
    }

    // Verificar si la ruta es pública
    const isPublic = publicPaths.some(path => nextUrl.pathname.startsWith(path));
    
    if (isPublic) {
        return NextResponse.next();
    }

    // Obtener header Authorization
    const authHeader = request.headers.get('Authorization');
    const hasValidToken = isValidBearerToken(authHeader);

    // Si es endpoint de API y no tiene token válido, responde 401 JSON
    if (nextUrl.pathname.startsWith('/api')) {
        if (!hasValidToken) {
            return NextResponse.json(
                { error: 'Unauthorized: Token de autenticación inválido o ausente' }, 
                { status: 401 }
            );
        }
        return NextResponse.next();
    }

    // Para rutas web (no API), redirigir a login si no hay token
    // Nota: El token debe ser enviado por el navegador en requests fetch, no en navegación normal
    // Las páginas web deberían usar SessionGuard/SessionManager en el cliente
    return NextResponse.next();
}

// Configura los matchers para las rutas protegidas
export const config = {
    matcher: [
        '/((?!_next|themes|assets|layout|favicon.ico).*)',
    ],
}