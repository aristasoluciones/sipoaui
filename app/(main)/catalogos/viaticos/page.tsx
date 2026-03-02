'use client';

import { usePermissions } from '@/src/hooks/usePermissions';
import { AccessDenied } from '@/src/components/AccessDeneid';
import ViaticosPrototypeForm from '@/src/components/catalogos/ViaticosPrototypeForm';

const ViaticosPage = () => {
    const { hasAnyPermission } = usePermissions();
    if (!hasAnyPermission(['catalogos.tabuladores.viaticos'])) {
        return (
            <div className="card">
                <AccessDenied message="No tienes permisos para acceder a este catálogo." variant="detailed" />
            </div>
        );
    }
    return <ViaticosPrototypeForm />;
};

export default ViaticosPage;
