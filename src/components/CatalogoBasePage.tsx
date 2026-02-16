'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { useRouter } from 'next/navigation';
import CatalogoManager from '@/src/components/CatalogoManager';
import { CATALOGOS_CONFIG } from '@/src/config/catalogos';
import { MOCK_CONFIG, MOCK_CATALOGOS, mockUtils } from '@/src/mocks';
import { useAuth } from '@/layout/context/authContext';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { CatalogoService } from '@/src/services/catalogos.service';
import { usePermissions } from '@/src/hooks/usePermissions';
import { AccessDenied } from './AccessDeneid';

interface CatalogoPageProps {
    catalogoKey: string;
    title: string;
    description: string;
}

const CatalogoBasePage: React.FC<CatalogoPageProps> = ({ catalogoKey, title, description }) => {
    const toast = useRef<Toast>(null);
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [catalogoService, setCatalogoService] = useState<CatalogoService | null>(null);

    const { hasAnyPermission } = usePermissions();
    const config = CATALOGOS_CONFIG.find((c) => c.key === catalogoKey);

    // Una sola key por catalogo — siempre array, nunca objeto suelto
    // El dashboard lee esta key para mostrar el badge
    const KEY_DATOS = `catalogo_accion_datos_${catalogoKey}`;
    const KEY_CATALOGOS_MODIFICADOS = 'catalogos_modificados';

    const registrarCatalogoModificado = () => {
        if (typeof window === 'undefined') return;

        const configIndex = CATALOGOS_CONFIG.findIndex((c) => c.key === catalogoKey);
        const catalogoId = configIndex >= 0 ? configIndex + 1 : catalogoKey;
        const catalogoNombre = config?.title ?? title;

        let catalogosModificados: any[] = [];
        try {
            const raw = localStorage.getItem(KEY_CATALOGOS_MODIFICADOS);
            const parsed = raw ? JSON.parse(raw) : [];
            catalogosModificados = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            catalogosModificados = [];
        }

        const nextItem = {
            id: catalogoId,
            key: catalogoKey,
            catalogo: catalogoNombre,
            fecha: new Date().toISOString()
        };

        const index = catalogosModificados.findIndex((item) => item?.key === catalogoKey);
        if (index >= 0) {
            catalogosModificados[index] = nextItem;
        } else {
            catalogosModificados.push(nextItem);
        }

        localStorage.setItem(KEY_CATALOGOS_MODIFICADOS, JSON.stringify(catalogosModificados));
    };

    const limpiarCatalogoModificadoActual = () => {
        if (typeof window === 'undefined') return;

        let catalogosModificados: any[] = [];
        try {
            const raw = localStorage.getItem(KEY_CATALOGOS_MODIFICADOS);
            const parsed = raw ? JSON.parse(raw) : [];
            catalogosModificados = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            catalogosModificados = [];
        }

        const filtrados = catalogosModificados.filter((item) => item?.key !== catalogoKey);
        localStorage.setItem(KEY_CATALOGOS_MODIFICADOS, JSON.stringify(filtrados));
    };

    const registrarAccion = (accion: 'creado' | 'editado' | 'eliminado', item: any) => {
        if (typeof window === 'undefined') return;

        let acciones: any[] = [];
        try {
            const raw = localStorage.getItem(KEY_DATOS);
            const parsed = raw ? JSON.parse(raw) : [];
            acciones = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            acciones = [];
        }

        acciones.push({
            accion,
            id: item?.id,
            nombre: item?.nombre ?? '',
            codigo: item?.codigo ?? '',
            estado: item?.estado ?? '',
            usuario: (user as any)?.name ?? (user as any)?.email ?? 'desconocido',
            fecha: new Date().toISOString()
        });

        localStorage.setItem(KEY_DATOS, JSON.stringify(acciones));
        registrarCatalogoModificado();
    };

    // Al montar: mostrar toasts de acciones previas (sticky — no se cierran solos)
    // Al desmontar: borrar la key para que el badge desaparezca en el dashboard
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Al entrar al catalogo se considera "visto", por eso quitamos su marca global.
        limpiarCatalogoModificadoActual();

        const raw = localStorage.getItem(KEY_DATOS);
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw);
            const acciones: any[] = Array.isArray(parsed) ? parsed : [parsed];

            acciones.forEach((entry: any, idx: number) => {
                const accion = entry.accion;
                if (!accion) return;

                let summary = '';
                let severity: any = 'info';

                if (accion === 'creado') {
                    summary = 'Elemento creado';
                    severity = 'success';
                }
                if (accion === 'editado') {
                    summary = 'Elemento actualizado';
                    severity = 'info';
                }
                if (accion === 'eliminado') {
                    summary = 'Elemento eliminado';
                    severity = 'error';
                }

                const detail = `${entry.nombre}, codigo: ${entry.codigo}, Estado: ${entry.estado}`;

                setTimeout(() => {
                    toast.current?.show({ severity, summary, detail, sticky: true, closable: true });
                }, 500 + idx * 350);
            });
        } catch {}

        return () => {
            localStorage.removeItem(KEY_DATOS);
        };
    }, [catalogoKey]);

    useEffect(() => {
        if (config && config.hasApiAccess !== false) {
            const service = new CatalogoService(catalogoKey);
            setCatalogoService(service);
        }
    }, [catalogoKey, config]);

    const loadData = async () => {
        try {
            setLoading(true);
            if (config?.hasApiAccess === false) {
                await mockUtils.delay();
                const mockKey = catalogoKey === 'marcoNormativo' ? 'marcoNormativo' : catalogoKey;
                const mockData = (MOCK_CATALOGOS as any)[mockKey] || [];
                setData(mockData);
            } else {
                if (catalogoService) {
                    const items = await catalogoService.getAll();
                    setData(items);
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        if (catalogoService || config?.hasApiAccess === false) {
            loadData();
        }
    }, [isAuthenticated, router, catalogoService, config]);

    const handleSave = async (item: any) => {
        const accion = item.id ? 'editado' : 'creado';

        if (MOCK_CONFIG.enabled || config?.hasApiAccess === false) {
            await mockUtils.delay(500);
            const mockKey = catalogoKey === 'marcoNormativo' ? 'marcoNormativo' : catalogoKey;
            const mockData = (MOCK_CATALOGOS as any)[mockKey];

            if (item.id) {
                const index = mockData.findIndex((u: any) => u.id === item.id);
                if (index !== -1) mockData[index] = { ...item };
            } else {
                const newItem = {
                    ...item,
                    id: Math.max(...mockData.map((u: any) => u.id), 0) + 1
                };
                mockData.push(newItem);
            }
            // Mock exitoso — registrar
            registrarAccion(accion, item);
        } else {
            if (catalogoService) {
                const { estado, ...otros } = item;
                const payload = { ...otros, estatus: estado };
                if (item.id) {
                    await catalogoService.update(item.id, payload);
                } else {
                    await catalogoService.create(payload);
                }
                // Solo se registra si el back respondio sin error
                registrarAccion(accion, item);
            }
        }
    };

    const handleDelete = async (id: number) => {
        const item = data.find((u: any) => u.id === id);

        if (MOCK_CONFIG.enabled || config?.hasApiAccess === false) {
            await mockUtils.delay(300);
            const mockKey = catalogoKey === 'marcoNormativo' ? 'marcoNormativo' : catalogoKey;
            const mockData = (MOCK_CATALOGOS as any)[mockKey];
            const index = mockData.findIndex((u: any) => u.id === id);
            if (index !== -1) mockData.splice(index, 1);
            // Mock exitoso — registrar
            if (item) registrarAccion('eliminado', item);
        } else {
            if (catalogoService) {
                await catalogoService.delete(id);
                // Solo se registra si el back respondio sin error
                if (item) registrarAccion('eliminado', item);
            }
        }
    };

    const getCategoryPath = () => {
        if (!config) return '';
        switch (config.category) {
            case 'organizacional':
                return 'Organizacionales y Estratégicos';
            case 'planeacion':
                return 'Planeacion Tecnica';
            case 'recursos':
                return 'Recursos Humanos, Presupuestarios y Financieros';
            case 'tabuladores':
                return 'Tabuladores';
            default:
                return '';
        }
    };

    const breadcrumbItems = [
        { label: 'Inicio', command: () => router.push('/') },
        { label: 'Catalogos', command: () => router.push('/catalogos'), className: 'text-primary font-medium' },
        { label: getCategoryPath() },
        { label: title, className: 'font-bold text-900' }
    ];

    const home = { icon: 'pi pi-home', command: () => router.push('/') };

    if (!config) {
        return (
            <div className="card">
                <h5>Error: Configuracion no encontrada</h5>
            </div>
        );
    }

    const hasReadPermission = hasAnyPermission(config.permissions);
    if (!hasReadPermission) {
        return (
            <div className="card">
                <AccessDenied message="No tienes permisos para acceder a este catalogo." variant="detailed" />
            </div>
        );
    }

    return (
        <>
            <Toast ref={toast} position="top-right" />
            <div className="grid">
                <div className="col-12">
                    <BreadCrumb model={breadcrumbItems} home={home} className="mb-4" />
                    <div className="flex align-items-center justify-content-between mb-4">
                        <div className="flex align-items-center">
                            <i className={`${config.icon} text-3xl text-primary mr-3`}></i>
                            <div>
                                <h2 className="text-2xl font-bold text-900 m-0">{config.title}</h2>
                                <p className="text-600 m-0">{description}</p>
                            </div>
                        </div>
                        <Button label="Regresar a catalogos" icon="pi pi-arrow-left" className="p-button-outlined" onClick={() => router.push('/catalogos')} />
                    </div>
                    <CatalogoManager config={config} data={data} onSave={handleSave} onDelete={handleDelete} onRefresh={loadData} />
                </div>
            </div>
        </>
    );
};

export default CatalogoBasePage;
