'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { Skeleton } from 'primereact/skeleton';
import { BreadCrumb } from 'primereact/breadcrumb';
import { CATALOGOS_CONFIG } from '@/src/config/catalogos';
import { useAuth } from '@/layout/context/authContext';
import { usePermissions } from '@/src/hooks/usePermissions';

interface CatalogoStats {
    key: string;
    title: string;
    icon: string;
    category: string;
    route: string;
    hasAccess: boolean;
    lastUpdated?: string;
}

interface CatalogoModificado {
    id: number | string;
    key: string;
    catalogo: string;
    fecha?: string;
}

const Page = () => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [catalogosStats, setCatalogosStats] = useState<CatalogoStats[]>([]);
    const [loading, setLoading] = useState(true);
    const KEY_CATALOGOS_MODIFICADOS = 'catalogos_modificados';
    const [catalogosModificados, setCatalogosModificados] = useState<Set<string>>(new Set());
    const [catalogosModificadosLista, setCatalogosModificadosLista] = useState<CatalogoModificado[]>([]);

    const { hasAnyPermission } = usePermissions();

    const catalogosLastUpdated: Record<string, string> = {
        unidades: '2024-10-15',
        objetivos: '2024-09-28',
        politicas: '2024-10-01',
        programas: '2024-09-15',
        marcoNormativo: '2024-08-22',
        'tipos-actividad': '2024-09-30',
        'tipo-proyecto': '2024-10-10',
        beneficiarios: '2024-09-20',
        entregables: '2024-08-30',
        cargos: '2024-09-25',
        partidas: '2024-10-05',
        combustibles: '2024-08-15',
        viaticos: '2024-09-18',
        precios: '2024-10-12'
    };

    const loadCatalogosStats = async () => {
        try {
            setLoading(true);
            const stats: CatalogoStats[] = CATALOGOS_CONFIG.map((config) => ({
                key: config.key,
                title: config.title,
                icon: config.icon,
                category: config.category,
                route: config.route,
                hasAccess: hasAnyPermission(config.permissions || []),
                lastUpdated: catalogosLastUpdated[config.key]
            }));
            setCatalogosStats(stats);

            // ✅ Detectar badges junto con los stats — misma key que escribe CatalogoBasePage
            if (typeof window !== 'undefined') {
                let listaModificados: CatalogoModificado[] = [];

                try {
                    const raw = localStorage.getItem(KEY_CATALOGOS_MODIFICADOS);
                    const parsed = raw ? JSON.parse(raw) : [];
                    listaModificados = Array.isArray(parsed) ? parsed : [parsed];
                } catch {
                    listaModificados = [];
                }

                const listaNormalizada = listaModificados.filter((item) => !!item?.key);
                setCatalogosModificadosLista(listaNormalizada);
                setCatalogosModificados(new Set(listaNormalizada.map((item) => item.key)));
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    // ✅ Limpiar la key del catálogo cuando el usuario hace click en "Gestionar"
    //    para que el badge desaparezca la próxima vez que vuelva al Dashboard
    const handleNavegar = (catalogo: CatalogoStats) => {
        if (typeof window !== 'undefined') {
            try {
                const raw = localStorage.getItem(KEY_CATALOGOS_MODIFICADOS);
                const parsed = raw ? JSON.parse(raw) : [];
                const lista = Array.isArray(parsed) ? parsed : [parsed];
                const filtrados = lista.filter((item: CatalogoModificado) => item?.key !== catalogo.key);
                localStorage.setItem(KEY_CATALOGOS_MODIFICADOS, JSON.stringify(filtrados));
            } catch {}

            setCatalogosModificados((prev) => {
                const next = new Set(prev);
                next.delete(catalogo.key);
                return next;
            });
            setCatalogosModificadosLista((prev) => prev.filter((item) => item.key !== catalogo.key));
        }

        router.push(catalogo.route);
    };

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        loadCatalogosStats();
    }, [isAuthenticated, router]);

    const getCategoryTitle = (category: string) => {
        switch (category) {
            case 'organizacional':
                return 'Organizacionales y Estratégicos';
            case 'planeacion':
                return 'Planeación Técnica';
            case 'recursos':
                return 'Recursos Humanos, Presupuestarios y Financieros';
            case 'tabuladores':
                return 'Tabuladores';
            default:
                return category;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'organizacional':
                return 'pi pi-users';
            case 'planeacion':
                return 'pi pi-folder';
            case 'recursos':
                return 'pi pi-tags';
            case 'tabuladores':
                return 'pi pi-table';
            default:
                return 'pi pi-folder';
        }
    };

    const formatLastUpdated = (dateString?: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const groupedCatalogos = catalogosStats.reduce((acc, catalogo) => {
        if (!acc[catalogo.category]) acc[catalogo.category] = [];
        acc[catalogo.category].push(catalogo);
        return acc;
    }, {} as Record<string, CatalogoStats[]>);

    const catalogoTemplate = (catalogo: CatalogoStats) => {
        // ✅ Badge naranja si tiene acciones pendientes en localStorage
        const isModificado = catalogosModificados.has(catalogo.key);

        if (!catalogo.hasAccess) {
            return (
                <div className="col-12 sm:col-6 lg:col-4 xl:col-3">
                    <div className="card h-full surface-100 catalogo-card">
                        {catalogo.lastUpdated && (
                            <div className="last-updated-badge opacity-70">
                                <i className="pi pi-clock mr-1"></i>
                                <span>{formatLastUpdated(catalogo.lastUpdated)}</span>
                            </div>
                        )}
                        <div className="text-center">
                            <div className="flex align-items-center justify-content-center bg-gray-100 border-round mb-3 mx-auto" style={{ width: '3rem', height: '3rem' }}>
                                <i className={`${catalogo.icon} text-400 text-2xl`}></i>
                            </div>
                            <h6 className="text-600 mb-2">{catalogo.title}</h6>
                            <div className="flex align-items-center justify-content-center gap-2">
                                <i className="pi pi-lock text-400"></i>
                                <span className="text-500 text-sm">Sin acceso</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="col-12 sm:col-6 lg:col-4 xl:col-3">
                <div className={`card h-full cursor-pointer hover:shadow-3 transition-duration-200 catalogo-card ${isModificado ? 'catalogo-modificado' : ''}`}>
                    {/* Badge de última fecha de actualización */}
                    {catalogo.lastUpdated && (
                        <div className="last-updated-badge">
                            <i className="pi pi-clock mr-1"></i>
                            <span>{formatLastUpdated(catalogo.lastUpdated)}</span>
                        </div>
                    )}

                    {/* ✅ Badge naranja de "¡Catálogo actualizado!" */}
                    {isModificado && <div className="catalogo-badge-actualizado">¡Catálogo actualizado!</div>}

                    <div className="text-center" onClick={() => handleNavegar(catalogo)}>
                        <div className="flex align-items-center justify-content-center bg-primary-100 border-round mb-3 mx-auto" style={{ width: '3rem', height: '3rem' }}>
                            <i className={`${catalogo.icon} text-primary-600 text-2xl`}></i>
                        </div>
                        <h6 className="font-semibold text-900 mb-3">{catalogo.title}</h6>

                        <div className="border-top-1 border-300 pt-3">
                            <Button
                                label="Gestionar"
                                icon="pi pi-arrow-right"
                                size="small"
                                className="w-full"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavegar(catalogo);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const breadcrumbItems = [
        { label: 'Inicio', command: () => router.push('/') },
        { label: 'Catálogos', className: 'font-medium text-400' },
        { label: 'Gestión de Catálogos', className: 'font-bold text-900' }
    ];

    const home = { icon: 'pi pi-home', command: () => router.push('/') };

    const renderSkeleton = () => (
        <div className="grid">
            {[...Array(8)].map((_, index) => (
                <div key={index} className="col-12 sm:col-6 lg:col-4 xl:col-3">
                    <Card>
                        <div className="text-center">
                            <Skeleton shape="circle" size="4rem" className="mb-3" />
                            <Skeleton width="100%" height="1.5rem" className="mb-2" />
                            <Skeleton width="60%" height="1rem" className="mb-3" />
                            <Skeleton width="100%" height="2rem" />
                        </div>
                    </Card>
                </div>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="grid">
                <div className="col-12">
                    <BreadCrumb model={breadcrumbItems} home={home} className="mb-4" />
                </div>
                <div className="col-12">
                    <div className="card mb-3">
                        <div className="flex align-items-center justify-content-center p-8">
                            <i className="pi pi-spin pi-spinner text-4xl text-blue-500 mr-3"></i>
                            <span className="text-xl text-600">Cargando información de catálogos...</span>
                        </div>
                    </div>
                </div>
                <div className="col-12">{renderSkeleton()}</div>
            </div>
        );
    }

    return (
        <div className="grid">
            <div className="col-12">
                <BreadCrumb model={breadcrumbItems} home={home} className="mb-4" />
            </div>

            <div className="col-12">
                <div className="card mb-3">
                    <div className="flex align-items-center gap-3">
                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '3rem', height: '3rem' }}>
                            <i className="pi pi-key text-blue-500 text-2xl"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-900 m-0">Gestión de Catálogos</h2>
                            <p className="text-600 m-0 mt-1">Gestión centralizada de catálogos que se utilizan en todo el sistema</p>
                        </div>
                    </div>
                    <div className="flex align-items-center gap-2 mt-3 p-3 bg-blue-50 border-round">
                        <i className="pi pi-info-circle text-blue-600"></i>
                        <p className="text-600 m-0">Selecciona un catálogo para ver sus elementos, agregar nuevos, editar o cambiar su estatus</p>
                    </div>
                    {catalogosModificadosLista.length > 0 && (
                        <div className="mt-3 p-3 border-round surface-50 border-1 border-200">
                            <h6 className="m-0 mb-2 text-900">Catálogos modificados</h6>
                            <div className="grid">
                                {catalogosModificadosLista.map((item) => (
                                    <div key={item.key} className="col-12 md:col-6">
                                        <div className="flex align-items-center justify-content-between py-2 border-bottom-1 border-200">
                                            <span className="text-700">ID: {item.id}</span>
                                            <span className="text-900 font-medium">{item.catalogo}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {Object.entries(groupedCatalogos).map(([category, catalogos]) => (
                <div key={category} className="col-12 mb-3">
                    <div className="card">
                        <div className="flex align-items-center justify-content-between mb-4">
                            <div className="flex align-items-center gap-3">
                                <div className="flex align-items-center justify-content-center bg-primary-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                    <i className={`${getCategoryIcon(category)} text-primary-600 text-xl`}></i>
                                </div>
                                <h5 className="font-semibold text-900 m-0">{getCategoryTitle(category)}</h5>
                            </div>
                            <Badge value={catalogos.length} severity="info" />
                        </div>

                        <div className="grid">
                            {catalogos.map((catalogo) => (
                                <React.Fragment key={catalogo.key}>{catalogoTemplate(catalogo)}</React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            ))}

            <style jsx global>{`
                .catalogo-card {
                    position: relative;
                    overflow: visible !important;
                }
                .last-updated-badge {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.375rem 0.75rem;
                    border-radius: 1rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 10;
                    white-space: nowrap;
                    border: 2px solid var(--surface-card);
                    animation: fadeInScale 0.3s ease-out;
                }
                .last-updated-badge i {
                    font-size: 0.625rem;
                }
                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .catalogo-card:hover .last-updated-badge {
                    transform: scale(1.05);
                    transition: transform 0.2s ease;
                }
                @media (max-width: 768px) {
                    .last-updated-badge {
                        top: -6px;
                        right: -6px;
                        padding: 0.25rem 0.5rem;
                        font-size: 0.7rem;
                    }
                }
                .catalogo-modificado {
                    border: 2.5px solid #f59e42 !important;
                    box-shadow: 0 0 0 3px #ffe6c7 !important;
                    position: relative;
                }
                .catalogo-badge-actualizado {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: #f59e42;
                    color: #fff;
                    padding: 0.25rem 0.75rem;
                    border-radius: 1rem;
                    font-size: 0.85rem;
                    font-weight: 600;
                    z-index: 20;
                    box-shadow: 0 2px 8px rgba(245, 158, 66, 0.15);
                    animation: fadeInScale 0.3s;
                }
            `}</style>
        </div>
    );
};

export default Page;
