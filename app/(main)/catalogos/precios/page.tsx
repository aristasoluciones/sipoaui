'use client';

import PreciosPrototypeForm from '@/src/components/catalogos/PreciosPrototypeForm';
import { usePermissions } from '@/src/hooks/usePermissions';
import { AccessDenied } from '@/src/components/AccessDeneid';

const PreciosPage = () => {
    const { hasAnyPermission } = usePermissions();

    if (!hasAnyPermission(['catalogos.recursos_humanos_presupuestarios_y_financieros.precios'])) {
        return <AccessDenied message="No tienes permisos para acceder a este catálogo." variant="detailed" />;
    }

    return <PreciosPrototypeForm mode="master" />;
};

export default PreciosPage;
