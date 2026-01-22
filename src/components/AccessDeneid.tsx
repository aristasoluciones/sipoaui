import React from 'react';
import { Button } from 'primereact/button';
import { useAuth } from '../../layout/context/authContext';

interface AccessDeniedProps {
    /** Tipo de mensaje a mostrar */
    variant?: 'default' | 'minimal' | 'detailed' | 'card';
    /** Título personalizado */
    title?: string;
    /** Mensaje personalizado */
    message?: string;
    /** Recurso al que se intentó acceder */
    resource?: string;
    /** Acción que se intentó realizar */
    action?: string;
    /** Mostrar información de contacto */
    showContact?: boolean;
    /** Mostrar botón de volver */
    showBackButton?: boolean;
    /** Función personalizada para el botón volver */
    onBack?: () => void;
    /** Clase CSS adicional */
    className?: string;
}

/**
 * Componente para mostrar cuando el usuario no tiene permisos de acceso
 * Proporciona diferentes variantes visuales y mensajes informativos
 */
export const AccessDenied: React.FC<AccessDeniedProps> = ({
    variant = 'default',
    title,
    message,
    resource,
    action,
    showContact = false,
    showBackButton = true,
    onBack,
    className = ''
}) => {
    const { user } = useAuth();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            window.history.back();
        }
    };

    // Generar mensaje automático basado en recurso y acción
    const getAutoMessage = () => {
        if (resource && action) {
            const actionNames: { [key: string]: string } = {
                'create': 'crear',
                'read': 'ver',
                'update': 'editar',
                'delete': 'eliminar',
                'manage': 'gestionar'
            };
            
            const resourceNames: { [key: string]: string } = {
                'users': 'usuarios',
                'roles': 'roles',
                'personas': 'personas',
                'proyectos': 'proyectos',
                'catalogos': 'catálogos',
                'admin': 'administración',
                'reports': 'reportes'
            };

            const actionText = actionNames[action] || action;
            const resourceText = resourceNames[resource] || resource;
            
            return `No tienes permisos para ${actionText} ${resourceText}`;
        }
        return 'No tienes permisos para acceder a esta sección';
    };

    const finalTitle = title || 'Acceso Restringido';
    const finalMessage = message || getAutoMessage();

    // Variante Minimal - Para espacios pequeños
    if (variant === 'minimal') {
        return (
            <div className={`text-center p-3 bg-gray-50 border-round ${className}`}>
                <i className="pi pi-lock text-gray-400 text-xl mb-2"></i>
                <p className="text-gray-600 m-0 text-sm">{finalMessage}</p>
            </div>
        );
    }

    // Variante Card - Estilo tarjeta
    if (variant === 'card') {
        return (
            <div className={`surface-card p-4 border-round shadow-2 text-center max-w-md mx-auto ${className}`}>
                <div className="mb-3">
                    <i className="pi pi-shield text-4xl text-orange-500"></i>
                </div>
                <h3 className="text-900 font-semibold mb-2">{finalTitle}</h3>
                <p className="text-600 mb-3 line-height-3">{finalMessage}</p>
                
                {showContact && (
                    <div className="bg-blue-50 p-3 border-round mb-3">
                        <p className="text-blue-700 m-0 text-sm">
                            <i className="pi pi-info-circle mr-2"></i>
                            Si necesitas acceso, contacta al administrador del sistema
                        </p>
                    </div>
                )}
                
                {showBackButton && (
                    <Button 
                        label="Volver" 
                        icon="pi pi-arrow-left" 
                        className="p-button-outlined"
                        onClick={handleBack}
                    />
                )}
            </div>
        );
    }

    // Variante Detailed - Con información adicional
    if (variant === 'detailed') {
        return (
            <div className={`text-center p-6 ${className}`}>
                <div className="mb-4">
                    <i className="pi pi-lock text-6xl text-gray-400"></i>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-700 mb-2">{finalTitle}</h2>
                <p className="text-gray-600 mb-4 text-lg">{finalMessage}</p>
                
                {user && (
                    <div className="bg-blue-50 border border-blue-200 p-4 border-round mb-4 max-w-md mx-auto">
                        <h4 className="text-blue-800 font-semibold mb-2">
                            <i className="pi pi-user mr-2"></i>
                            Información de tu cuenta
                        </h4>
                        <div className="text-left text-sm text-blue-700">
                            <p className="m-0 mb-1"><strong>Usuario:</strong> {user.name || user.email}</p>
                            <p className="m-0 mb-1"><strong>Email:</strong> {user.email}</p>
                            {resource && <p className="m-0 mb-1"><strong>Recurso solicitado:</strong> {resource}</p>}
                            {action && <p className="m-0"><strong>Acción solicitada:</strong> {action}</p>}
                        </div>
                    </div>
                )}
                
                {showContact && (
                    <div className="bg-orange-50 border border-orange-200 p-4 border-round mb-4 max-w-md mx-auto">
                        <h4 className="text-orange-800 font-semibold mb-2">
                            <i className="pi pi-phone mr-2"></i>
                            ¿Necesitas acceso?
                        </h4>
                        <p className="text-orange-700 text-sm m-0 mb-2">
                            Contacta al administrador del sistema para solicitar los permisos necesarios.
                        </p>
                        <p className="text-orange-600 text-xs m-0">
                            Incluye la información de tu cuenta y el recurso al que necesitas acceder.
                        </p>
                    </div>
                )}
                
                <div className="flex gap-2 justify-center">
                    {showBackButton && (
                        <Button 
                            label="Volver" 
                            icon="pi pi-arrow-left" 
                            className="p-button-outlined"
                            onClick={handleBack}
                        />
                    )}
                    <Button 
                        label="Ir al Dashboard" 
                        icon="pi pi-home" 
                        className="p-button-secondary"
                        onClick={() => window.location.href = '/'}
                    />
                </div>
            </div>
        );
    }

    // Variante Default - Estilo estándar
    return (
        <div className={`text-center p-6 ${className}`}>
            <div className="mb-4">
                <i className="pi pi-lock text-5xl text-gray-400"></i>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{finalTitle}</h2>
            <p className="text-gray-600 mb-4">{finalMessage}</p>
            
            {showContact && (
                <div className="bg-blue-50 border border-blue-200 p-3 border-round mb-4 max-w-sm mx-auto">
                    <p className="text-blue-700 m-0 text-sm">
                        <i className="pi pi-info-circle mr-2"></i>
                        Contacta al administrador si necesitas acceso
                    </p>
                </div>
            )}
            
            {showBackButton && (
                <Button 
                    label="Volver" 
                    icon="pi pi-arrow-left" 
                    className="p-button-outlined"
                    onClick={handleBack}
                />
            )}
        </div>
    );
};

// Componentes especializados para casos específicos
export const PageAccessDenied: React.FC<{ resource?: string }> = ({ resource }) => (
    <AccessDenied 
        variant="detailed"
        resource={resource}
        action="read"
        showContact={true}
        title="Página Restringida"
    />
);

export const ActionAccessDenied: React.FC<{ action?: string; resource?: string }> = ({ action, resource }) => (
    <AccessDenied 
        variant="minimal"
        action={action}
        resource={resource}
        showBackButton={false}
    />
);

export const AdminAccessDenied: React.FC = () => (
    <AccessDenied 
        variant="card"
        resource="admin"
        action="access"
        showContact={true}
        title="Área de Administración"
        message="Esta sección está restringida a administradores del sistema"
    />
);

export default AccessDenied;
