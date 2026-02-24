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
import  { useAllPermissions } from '@/src/hooks/useAllPermissions';
import  { usePermissions } from '@/src/hooks/usePermissions';
import { CatalogosActualizacionesService } from '@/src/services/catalogosActualizaciones.service';

interface CatalogoStats {
  key: string;
  title: string;
  icon: string;
  category: string;
  route: string;
  hasAccess: boolean;
  lastUpdated?: string;
  isUnread: boolean;
}

type TrackerEntry = { is_unread: boolean; updated_at?: string | null };

const TRACKER_KEY_BY_CATALOGO: Record<string, string> = {
  partidas: 'partidas_presupuestales'
};

const TRACKER_KEYS_BY_CATALOGO: Record<string, string[]> = {
  partidas: ['partidas_presupuestales', 'capitulos_presupuestales', 'rhpf_presupuestales', 'partidas']
};

const TRACKER_READ_KEYS_BY_CATALOGO: Record<string, string[]> = {
  partidas: ['partidas_presupuestales', 'capitulos_presupuestales', 'rhpf_presupuestales', 'partidas'],
  'tipos-actividad': ['tipos_actividad', 'tipos-actividad'],
  'tipo-proyecto': ['tipos_proyecto', 'tipo-proyecto'],
  marcoNormativo: ['marcos_normativos', 'marco_normativo', 'marco-normativo', 'marcoNormativo'],
  objetivos: ['objetivos', 'objetivos_estrategicos']
};

const getTrackerKey = (catalogoKey: string): string =>
  TRACKER_KEY_BY_CATALOGO[catalogoKey] || catalogoKey;

const toSnakeCase = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();

const toKebabCase = (value: string): string =>
  toSnakeCase(value).replace(/_/g, '-');

const getTrackerReadKeys = (catalogoKey: string): string[] => {
  const trackerKey = getTrackerKey(catalogoKey);
  const explicit = TRACKER_READ_KEYS_BY_CATALOGO[catalogoKey] || [];
  const keys = [
    catalogoKey,
    trackerKey,
    toSnakeCase(catalogoKey),
    toSnakeCase(trackerKey),
    toKebabCase(catalogoKey),
    toKebabCase(trackerKey),
    ...explicit
  ];

  return Array.from(new Set(keys.map(key => key.trim()).filter(Boolean)));
};

const parseTrackerDate = (value?: string | null): Date | null => {
  if (!value) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const normalized = value.trim();
  const dmySlash = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const dmyDash = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  const match = dmySlash || dmyDash;
  if (!match) return null;

  const parsed = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const resolveTrackerEntry = (
  catalogoKey: string,
  updates: Record<string, TrackerEntry>
): TrackerEntry => {
  const candidateKeys = TRACKER_KEYS_BY_CATALOGO[catalogoKey] || [catalogoKey];
  let isUnread = false;
  let updatedAt: string | null = null;
  let updatedAtDate: Date | null = null;

  candidateKeys.forEach(key => {
    const entry = updates[key];
    if (!entry) return;

    if (entry.is_unread) isUnread = true;

    if (!entry.updated_at) return;
    const parsed = parseTrackerDate(entry.updated_at);

    if (!parsed) {
      if (!updatedAt) updatedAt = entry.updated_at;
      return;
    }

    if (!updatedAtDate || parsed > updatedAtDate) {
      updatedAtDate = parsed;
      updatedAt = entry.updated_at;
    }
  });

  return { is_unread: isUnread, updated_at: updatedAt };
};

const CatalogosDashboard = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [catalogosStats, setCatalogosStats] = useState<CatalogoStats[]>([]);
  const [loading, setLoading] = useState(true);

  const catalogosPermissions = useAllPermissions(user);
  const { hasAnyPermission } = usePermissions();

  const markCatalogoAsReadLocally = (catalogoKey: string) => {
    setCatalogosStats(current =>
      current.map(item =>
        item.key === catalogoKey ? { ...item, isUnread: false } : item
      )
    );
  };

  const handleCatalogoOpen = async (catalogo: CatalogoStats) => {
    if (catalogo.isUnread) {
      try {
        const trackerKeys = getTrackerReadKeys(catalogo.key);
        const markResults = await Promise.allSettled(
          trackerKeys.map(trackerKey => CatalogosActualizacionesService.markAsRead(trackerKey))
        );

        if (markResults.some(result => result.status === 'fulfilled')) {
          markCatalogoAsReadLocally(catalogo.key);
        }
      } catch (error) {
      }
    }

    router.push(catalogo.route);
  };

  const loadCatalogosStats = async () => {
    try {
      setLoading(true);
      let catalogosActualizaciones: Record<string, TrackerEntry> = {};
      try {
        catalogosActualizaciones = await CatalogosActualizacionesService.getAll();
      } catch (error) {
      }

      const stats: CatalogoStats[] = CATALOGOS_CONFIG.map(config => {
        const trackerKey = getTrackerKey(config.key);
        const trackerEntry = resolveTrackerEntry(config.key, catalogosActualizaciones);
        return {
          key: config.key,
          title: config.title,
          icon: config.icon,
          category: config.category,
          route: config.route,
          hasAccess: hasAnyPermission(config.permissions || []),
          lastUpdated: trackerEntry.updated_at || catalogosActualizaciones?.[trackerKey]?.updated_at || undefined,
          isUnread: Boolean(trackerEntry.is_unread || catalogosActualizaciones?.[trackerKey]?.is_unread)
        };
      });

      setCatalogosStats(stats);
    } catch (error) {
    } finally {
      setLoading(false);
    }
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
    
    const directDate = new Date(dateString);
    let parsedDate = directDate;

    if (Number.isNaN(directDate.getTime())) {
      const normalized = dateString.trim();
      const dmySlash = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      const dmyDash = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);

      if (dmySlash || dmyDash) {
        const match = dmySlash || dmyDash;
        const day = Number(match?.[1]);
        const month = Number(match?.[2]) - 1;
        const year = Number(match?.[3]);
        parsedDate = new Date(year, month, day);
      }
    }

    if (Number.isNaN(parsedDate.getTime())) return dateString;

    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = months[parsedDate.getMonth()];
    const year = parsedDate.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  const groupedCatalogos = catalogosStats.reduce((acc, catalogo) => {
    if (!acc[catalogo.category]) {
      acc[catalogo.category] = [];
    }
    acc[catalogo.category].push(catalogo);
    return acc;
  }, {} as Record<string, CatalogoStats[]>);

  const renderCatalogoBadges = (catalogo: CatalogoStats, muted = false) => {
    const hasDate = Boolean(catalogo.lastUpdated);
    const hasUnread = catalogo.isUnread;

    if (!hasDate && !hasUnread) return null;

    return (
      <div className={`catalogo-badges ${muted ? 'catalogo-badges-muted' : ''}`}>
        {hasUnread && (
          <div className="catalogo-updated-badge">
            <span className="catalogo-updated-dot"></span>
            <span>Actualizado</span>
          </div>
        )}
        {hasDate && (
          <div className="last-updated-badge">
            <i className="pi pi-clock"></i>
            <span>{formatLastUpdated(catalogo.lastUpdated)}</span>
          </div>
        )}
      </div>
    );
  };

  const catalogoTemplate = (catalogo: CatalogoStats) => {
    if (!catalogo.hasAccess) {
      return (
        <div className="col-12 sm:col-6 lg:col-4 xl:col-3">
          <div className={`card h-full surface-100 catalogo-card ${catalogo.isUnread ? 'catalogo-card-unread' : ''}`}>
            {/* Etiqueta flotante de última actualización */}
            {renderCatalogoBadges(catalogo, true)}
            
            <div className="text-center">
              <div className="flex align-items-center justify-content-center bg-gray-100 border-round mb-3 mx-auto"
                   style={{ width: '3rem', height: '3rem' }}>
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
        <div className={`card h-full cursor-pointer hover:shadow-3 transition-duration-200 catalogo-card ${catalogo.isUnread ? 'catalogo-card-unread' : ''}`}>
          {/* Etiqueta flotante de última actualización */}
          {renderCatalogoBadges(catalogo)}
          
          <div className="text-center" onClick={() => handleCatalogoOpen(catalogo)}>
            <div className="flex align-items-center justify-content-center bg-primary-100 border-round mb-3 mx-auto"
                 style={{ width: '3rem', height: '3rem' }}>
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
                  handleCatalogoOpen(catalogo);
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
     { 
      label: 'Catálogos',
      className: 'font-medium text-400'
    },
    {
      label: 'Gestión de Catálogos',
      className: 'font-bold text-900'
    }
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
        <div className="col-12">
          {renderSkeleton()}
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="col-12">
        <BreadCrumb model={breadcrumbItems} home={home} className="mb-4" />
      </div>
      
      {/* Título y descripción del módulo */}
      <div className="col-12">
        <div className="card mb-3">
          <div className="flex align-items-center gap-3">
            <div className="flex align-items-center justify-content-center bg-blue-100 border-round"
                 style={{ width: '3rem', height: '3rem' }}>
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
        </div>
      </div>
        
        {Object.entries(groupedCatalogos).map(([category, catalogos]) => (
          <div key={category} className="col-12 mb-3">
            <div className="card">
              <div className="flex align-items-center justify-content-between mb-4">
                <div className="flex align-items-center gap-3">
                  <div className="flex align-items-center justify-content-center bg-primary-100 border-round"
                       style={{ width: '2.5rem', height: '2.5rem' }}>
                    <i className={`${getCategoryIcon(category)} text-primary-600 text-xl`}></i>
                  </div>
                  <h5 className="font-semibold text-900 m-0">{getCategoryTitle(category)}</h5>
                </div>
                <Badge value={catalogos.length} severity="info" />
              </div>
              
              <div className="grid">
                
                {catalogos.map(catalogo => 
                  <React.Fragment key={catalogo.key}>
                    {catalogoTemplate(catalogo)}
                  </React.Fragment>
                )}
              </div>
            </div>
          </div>
        ))}

      {/* Estilos para las etiquetas flotantes */}
      <style jsx global>{`
        .catalogo-card {
          position: relative;
          overflow: visible !important;
        }

        .catalogo-card-unread {
          border: 2px dashed #ec4899 !important;
          box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.14), 0 10px 22px rgba(236, 72, 153, 0.2) !important;
          background: linear-gradient(180deg, rgba(252, 231, 243, 0.62) 0%, rgba(255, 255, 255, 1) 45%);
        }

        .catalogo-badges {
          position: absolute;
          top: -12px;
          right: -10px;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          z-index: 10;
        }

        .catalogo-badges-muted {
          opacity: 0.78;
        }

        .last-updated-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.34rem 0.72rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          box-shadow: 0 4px 10px rgba(102, 126, 234, 0.34);
          white-space: nowrap;
          border: 2px solid var(--surface-card);
        }

        .catalogo-updated-badge {
          background: linear-gradient(180deg, #fff8fc 0%, #ffeaf5 100%);
          color: #be185d;
          padding: 0.34rem 0.72rem;
          border-radius: 1rem;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          box-shadow: 0 3px 8px rgba(236, 72, 153, 0.2);
          border: 2px solid #f9a8d4;
          text-transform: uppercase;
          animation: badgePulse 1.6s ease-in-out infinite;
        }

        .catalogo-updated-dot {
          width: 0.38rem;
          height: 0.38rem;
          border-radius: 999px;
          background: #ec4899;
          box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.45);
          animation: dotPing 1.6s ease-out infinite;
        }

        .last-updated-badge i,
        .catalogo-updated-badge i {
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

        @keyframes badgePulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }

        @keyframes dotPing {
          0% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.45); }
          70% { box-shadow: 0 0 0 7px rgba(236, 72, 153, 0); }
          100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0); }
        }

        .catalogo-card:hover .last-updated-badge,
        .catalogo-card:hover .catalogo-updated-badge {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .catalogo-badges {
            top: -10px;
            right: -6px;
            gap: 0.35rem;
          }

          .catalogo-updated-badge,
          .last-updated-badge {
            padding: 0.26rem 0.52rem;
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CatalogosDashboard;

