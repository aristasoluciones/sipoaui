'use client';

import ViaticosPrototypeForm from '@/src/components/catalogos/ViaticosPrototypeForm';
import { usePermissions } from '@/src/hooks/usePermissions';
import { AccessDenied } from '@/src/components/AccessDeneid';

const ViaticosPage = () => {
    const { hasAnyPermission } = usePermissions();

    if (!hasAnyPermission(['catalogos.tabuladores.viaticos'])) {
        return <AccessDenied message="No tienes permisos para acceder a este catálogo." variant="detailed" />;
    }

    return <ViaticosPrototypeForm />;
};

export default ViaticosPage;
