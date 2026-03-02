'use client';

import { usePermissions } from '@/src/hooks/usePermissions';
import { AccessDenied } from '@/src/components/AccessDeneid';
import PreciosPrototypeForm from '@/src/components/catalogos/PreciosPrototypeForm';

const CombustiblesPage = () => {
    const { hasAnyPermission } = usePermissions();
    if (!hasAnyPermission(['catalogos.tabuladores.combustibles'])) {
        return (
            <div className="card">
                <AccessDenied message="No tienes permisos para acceder a este catálogo." variant="detailed" />
            </div>
        );
    }
    return <PreciosPrototypeForm mode="combustibles" />;
};

export default CombustiblesPage;
