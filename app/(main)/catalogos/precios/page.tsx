'use client';

import { usePermissions } from '@/src/hooks/usePermissions';
import { AccessDenied } from '@/src/components/AccessDeneid';
import PreciosPrototypeForm from '@/src/components/catalogos/PreciosPrototypeForm';

const PreciosPage = () => {
    const { hasAnyPermission } = usePermissions();
    if (!hasAnyPermission(['catalogos.recursos_humanos_presupuestarios_y_financieros.precios'])) {
        return (
            <div className="card">
                <AccessDenied message="No tienes permisos para acceder a este catálogo." variant="detailed" />
            </div>
        );
    }
    return <PreciosPrototypeForm mode="master" />;
};

export default PreciosPage;
