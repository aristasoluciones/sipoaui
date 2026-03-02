'use client';

import PreciosPrototypeForm from '@/src/components/catalogos/PreciosPrototypeForm';
import { usePermissions } from '@/src/hooks/usePermissions';
import { AccessDenied } from '@/src/components/AccessDeneid';

const CombustiblesPage = () => {
    const { hasAnyPermission } = usePermissions();

    if (!hasAnyPermission(['catalogos.tabuladores.combustibles'])) {
        return <AccessDenied message="No tienes permisos para acceder a este catálogo." variant="detailed" />;
    }

    return <PreciosPrototypeForm mode="combustibles" />;
};

export default CombustiblesPage;
