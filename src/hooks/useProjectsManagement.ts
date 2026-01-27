'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ProyectoService } from '@/src/services/proyecto';
import { EjercicioFiscalService } from '@/src/services/ejercicios';
import { useNotification } from '@/layout/context/notificationContext';
import type { Proyecto, ProyectoFormData } from '@/types/proyectos.d';
import { camelCase, snakeCase } from 'lodash';
import { toCamelCase } from '../utils/transformers';
import { useProjectOperations } from './useProjectOperations';
import { EjercicioFiscal } from '@/types/ejercicios';

interface UseProjectsManagementReturn {
  // Estado
  proyectos: Proyecto[];
  displayedProjects: Proyecto[];
  loading: boolean;
  loadingMore: boolean;
  saving: boolean;
  hasMore: boolean;

  // Filtros y búsqueda
  globalFilter: string;
  statusFilter: string | null;
  etapaFilter: string | null;
  selectedEjercicioFiscal: number | null;
  selectedEjercicioFiscalAnio: number | null;

  // Ejercicios fiscales
  ejerciciosFiscales: EjercicioFiscal[];
  ejerciciosFiscalesLoading: boolean;

  // Estados del wizard
  showWizard: boolean;
  isCreating: boolean;
  selectedProject: Proyecto | null;

  // Acciones
  loadProjects: () => Promise<void>;
  loadMoreProjects: () => Promise<void>;
  setGlobalFilter: (filter: string) => void;
  setStatusFilter: (filter: string | null) => void;
  setEtapaFilter: (filter: string | null) => void;
  changeSelectedEjercicioFiscal: (id: number) => void;

  // Dialog actions
  handleNewProject: () => void;
  handleProjectSelect: (project: Proyecto) => void;
  handleCloseWizard: () => void;

  // CRUD operations
  handleSaveProject: (data: ProyectoFormData) => Promise<void>;
  updateProjectLocally: (updatedProject: Proyecto) => void;
  addProjectToList: (newProject: Proyecto) => void;

  // Utilities
  isEjercicioFiscalCerrado: (ejercicioFiscal: EjercicioFiscal) => boolean;
  permiteCapturaProyectos: (ejercicioFiscal: EjercicioFiscal) => boolean;
  getSelectedEjercicioFiscal: () => EjercicioFiscal | null;
  filteredProjects: Proyecto[];
}

export const useProjectsManagement = (): UseProjectsManagementReturn => {
  // Estado principal
  const [page,setPage] = useState(1);
  const [perPage] = useState(15);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [displayedProjects, setDisplayedProjects] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Ref para controlar carga inicial
  const initialLoadDone = useRef(false);
  const isInitializing = useRef(false);
  const previousEjercicioFiscal = useRef<number | null>(null);

  // Filtros
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [etapaFilter, setEtapaFilter] = useState<string | null>(null);
  const [selectedEjercicioFiscal, setSelectedEjercicioFiscal] = useState<number | null>(null);
  const [selectedEjercicioFiscalAnio, setSelectedEjercicioFiscalAnio] = useState<number | null>(null);

  // Estado de ejercicios fiscales
  const [ejerciciosFiscales, setEjerciciosFiscales] = useState<EjercicioFiscal[]>([]);
  const [ejerciciosFiscalesLoading, setEjerciciosFiscalesLoading] = useState(true);

  // Estados del wizard
  const [showWizard, setShowWizard] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);

  const { success, error } = useNotification();

  // Función para verificar si un ejercicio fiscal está cerrado (fecha de cierre vencida)
  const isEjercicioFiscalCerrado = useCallback((ejercicioFiscal: EjercicioFiscal): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return ejercicioFiscal.fechaCierreEjercicio < today;
  }, []);

  // Función para verificar si un ejercicio fiscal permite capturar proyectos nuevos
  const permiteCapturaProyectos = useCallback((ejercicioFiscal: EjercicioFiscal): boolean => {
    try {
      const today = new Date().toISOString().split('T')[0];
      return ejercicioFiscal.fechaInicioCapturaProyecto <= today &&
             ejercicioFiscal.fechaCierreCapturaProyecto >= today;
    } catch (err) {
      return false;
    }
  }, []);

  // Función para obtener el ejercicio fiscal seleccionado por ID
  const getSelectedEjercicioFiscal = useCallback((): EjercicioFiscal | null => {
    if (ejerciciosFiscales.length === 0 || !selectedEjercicioFiscal) {
      return null;
    }
    const ejercicio = ejerciciosFiscales.find(e => e.id === selectedEjercicioFiscal);
    return ejercicio || null;
  }, [ejerciciosFiscales, selectedEjercicioFiscal]);

  // Cargar ejercicios fiscales desde la API (solo para uso manual posterior)
  const loadEjerciciosFiscales = useCallback(async () => {
    setEjerciciosFiscalesLoading(true);
    try {
      const ejerciciosApi = await EjercicioFiscalService.getAll();
      const ejercicios = ejerciciosApi.map(ej => toCamelCase<EjercicioFiscal>(ej));

      // Ordenar ejercicios fiscales por año descendente (más reciente primero)
      const ejerciciosOrdenados = ejercicios.sort((a, b) => b.anio - a.anio);
      setEjerciciosFiscales(ejerciciosOrdenados);
    } catch (err) {
      error('Error', 'No se pudieron cargar los ejercicios fiscales');

    } finally {
      setEjerciciosFiscalesLoading(false);
    }
  }, [error]);

  // Filtrar proyectos
  const filteredProjects = useMemo(() => proyectos.filter(project => {
    const matchesGlobal = !globalFilter ||
      project.nombre.toLowerCase().includes(globalFilter.toLowerCase()) ||
      (project.descripcion && project.descripcion.toLowerCase().includes(globalFilter.toLowerCase())) ||
      project.responsable.nombre.toLowerCase().includes(globalFilter.toLowerCase());

    const matchesStatus = !statusFilter || project.estatus === statusFilter;
    const matchesEtapa = !etapaFilter || project.etapaActual === etapaFilter;

    return matchesGlobal && matchesStatus && matchesEtapa;
  }), [proyectos, globalFilter, statusFilter, etapaFilter]);

  // Actualizar proyectos mostrados cuando cambian los filtros
  useEffect(() => {
    const filtered = filteredProjects;
    setDisplayedProjects(filtered.slice(0, 10)); // pageSize = 10
    setHasMore(filtered.length > 10);
  }, [filteredProjects]);

  // Cargar proyectos
  const loadProjects = useCallback(async (ejercicioFiscalAnio?: number) => {
   
    setLoading(true);
    try {
      const ejercicioToLoad = ejercicioFiscalAnio || selectedEjercicioFiscalAnio;
      if (!ejercicioToLoad) return;
      const response = await ProyectoService.getByEjercicioFiscal(ejercicioToLoad, 1, perPage);
      const proyectos: Proyecto[] = response.data ? toCamelCase(response.data) : [];
      setProyectos(proyectos);
      // Actualizar displayedProjects inmediatamente para evitar timing issues
      const displayed = proyectos.slice(0, 10);
      setDisplayedProjects(displayed);
      console.log('[LoadProjects] Proyectos loaded:', proyectos.length, 'Displayed:', displayed.length);
      // Resetear paginación
      setHasMore(proyectos.length === perPage);
    } catch (err) {
      error('Error', 'No se pudieron cargar los proyectos');
    } finally {
      setLoading(false);
    }
  }, [selectedEjercicioFiscal, perPage, error]);

  // Resetear estados de vista cuando cambia el ejercicio fiscal (solo después de la carga inicial)
  useEffect(() => {
    // Solo ejecutar si:
    // 1. Ya se completó la carga inicial
    // 2. No estamos en proceso de inicialización  
    // 3. Es realmente un cambio (no la primera vez que se setea)
    if (!initialLoadDone.current || isInitializing.current || previousEjercicioFiscal.current === null) {
      previousEjercicioFiscal.current = selectedEjercicioFiscal;
      return;
    }
    
    // Solo proceder si realmente cambió el valor
    if (previousEjercicioFiscal.current === selectedEjercicioFiscal) {
      return;
    }
    previousEjercicioFiscal.current = selectedEjercicioFiscal;
    
    // Cerrar wizard y resetear estados relacionados
    setShowWizard(false);
    setIsCreating(false);
    setSelectedProject(null);

    // Limpiar filtros
    setGlobalFilter('');
    setStatusFilter(null);
    setEtapaFilter(null);

    // Recargar proyectos para el nuevo ejercicio fiscal
    if (selectedEjercicioFiscalAnio) {
      loadProjects(selectedEjercicioFiscalAnio);
    }
  }, [selectedEjercicioFiscal, loadProjects]);

  // Función para cambiar el ejercicio fiscal seleccionado
  const changeSelectedEjercicioFiscal = useCallback((id: number) => {
    const ejercicioSeleccionado = ejerciciosFiscales.find(e => e.id === id);
    if (ejercicioSeleccionado) {
      setSelectedEjercicioFiscal(id);
      setSelectedEjercicioFiscalAnio(ejercicioSeleccionado.anio);
    }
  }, [ejerciciosFiscales]);

  // Función para cargar más proyectos (lazy loading)
  const loadMoreProjects = useCallback(async () => {
    if (loadingMore || !hasMore || !selectedEjercicioFiscalAnio) return;

    setLoadingMore(true);
    try {
      const nextPage = Math.floor(displayedProjects.length / perPage) + 1;
      const response = await ProyectoService.getByEjercicioFiscal(selectedEjercicioFiscalAnio, nextPage, perPage);
      const newProyectos: Proyecto[] = response.data ? toCamelCase(response.data) : [];

      if (newProyectos.length > 0) {
        setProyectos(prev => [...prev, ...newProyectos]);
        // Si se retornaron menos registros que el límite por página, no hay más datos
        setHasMore(newProyectos.length === perPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      error('Error', 'No se pudieron cargar más proyectos');
    } finally {
      setLoadingMore(false);
    }
  }, [perPage, error]);

  // Manejar nuevo proyecto
  const handleNewProject = useCallback(() => {
    try {
      const ejercicioSeleccionado = getSelectedEjercicioFiscal();

      if (!ejercicioSeleccionado) {
        error('Error', 'No se ha seleccionado un ejercicio fiscal válido');
        return;
      }

      if (!permiteCapturaProyectos(ejercicioSeleccionado)) {
        error('Captura No Permitida', 'El período de captura de proyectos para este ejercicio fiscal ha finalizado o aún no ha comenzado');
        return;
      }

      setSelectedProject(null);
      setShowWizard(true);
      setIsCreating(true);
    } catch (err) {
      error('Error', 'Ocurrió un error al intentar crear un nuevo proyecto');
    }
  }, [getSelectedEjercicioFiscal, permiteCapturaProyectos, error]);

  // Manejar selección de proyecto
  const handleProjectSelect = useCallback((project: Proyecto) => {
    setSelectedProject(project);
    setShowWizard(true);
    setIsCreating(false);
  }, []);

  // Cerrar wizard
  const handleCloseWizard = useCallback(() => {
    setShowWizard(false);
    setSelectedProject(null);
    setIsCreating(false);
  }, []);

  // Usar el hook de operaciones para manejar el guardado
  const { handleSaveProject: operationsHandleSaveProject } = useProjectOperations({
    isCreating,
    selectedProject,
    onSuccess: () => {}, // No hace nada específico por ahora
    onCloseWizard: handleCloseWizard,
    onReloadProjects: loadProjects,
    onSavingStart: () => setSaving(true),
    onSavingEnd: () => setSaving(false)
  });

  // Wrapper para mantener la misma interfaz
  const handleSaveProject = useCallback(async (data: ProyectoFormData, keepWizardOpen = false) => {
    await operationsHandleSaveProject(data, keepWizardOpen);
  }, [operationsHandleSaveProject]);

  // Actualizar proyecto localmente sin recargar
  const updateProjectLocally = useCallback((updatedProject: Proyecto) => {
    setProyectos(prevProyectos =>
      prevProyectos.map(proyecto =>
        proyecto.uuid === updatedProject.uuid ? updatedProject : proyecto
      )
    );
  }, []);

  // Agregar proyecto a la lista localmente
  const addProjectToList = useCallback((newProject: Proyecto) => {
    setProyectos(prevProyectos => [newProject, ...prevProyectos]);
  }, []);

  // Carga inicial única al montar el componente
  useEffect(() => {
    // Solo cargar si no se ha hecho la carga inicial (evitar doble carga por Strict Mode)
    if (!initialLoadDone.current && !isInitializing.current) {
      initialLoadDone.current = true; // Marcar inmediatamente para evitar re-ejecución
      isInitializing.current = true; // Bloquear otros useEffect durante la inicialización
      
      const initializeData = async () => {
        try {
          // 1. Cargar ejercicios fiscales
          const ejerciciosApi = await EjercicioFiscalService.getAll();
          const ejercicios = ejerciciosApi.map(ej => toCamelCase<EjercicioFiscal>(ej));
          
          // Ordenar ejercicios fiscales por año descendente (más reciente primero)
          const ejerciciosOrdenados = ejercicios.sort((a, b) => b.anio - a.anio);

          // Actualizar ejercicios fiscales primero
          setEjerciciosFiscales(ejerciciosOrdenados);
          setEjerciciosFiscalesLoading(false);

          // 2. Seleccionar automáticamente el ejercicio fiscal más reciente y cargar proyectos
          if (ejerciciosOrdenados.length > 0) {
            const ejercicioMasReciente = ejerciciosOrdenados[0];
            
            // 3. Cargar proyectos del ejercicio más reciente
            const response = await ProyectoService.getByEjercicioFiscal(ejercicioMasReciente.anio, 1, perPage);
            const proyectos: Proyecto[] = response.data ? toCamelCase(response.data) : [];
            
            // 4. Actualizar el resto del estado
            setSelectedEjercicioFiscal(ejercicioMasReciente.id);
            setSelectedEjercicioFiscalAnio(ejercicioMasReciente.anio);
            setProyectos(proyectos);
            // Actualizar displayedProjects inmediatamente para evitar timing issues
            const initialDisplayed = proyectos.slice(0, 10);
            setDisplayedProjects(initialDisplayed);
            console.log('[Initial Load] Proyectos loaded:', proyectos.length, 'Displayed:', initialDisplayed.length);
            setHasMore(proyectos.length === perPage);
          }
        } catch (err) {
          error('Error', 'No se pudieron cargar los datos iniciales');
          setEjerciciosFiscalesLoading(false);
        } finally {
          setLoading(false);
          isInitializing.current = false; // Desbloquear otros useEffect después de la inicialización
        }
      };

      initializeData();
    }
  }, [perPage, error]); // Solo dependencias que no cambian

  return {
    // Estado
    proyectos,
    displayedProjects,
    loading,
    loadingMore,
    saving,
    hasMore,

    // Filtros y búsqueda
    globalFilter,
    statusFilter,
    etapaFilter,
    selectedEjercicioFiscal,
    selectedEjercicioFiscalAnio,

    // Ejercicios fiscales
    ejerciciosFiscales,
    ejerciciosFiscalesLoading,

    // Estados del wizard
    showWizard,
    isCreating,
    selectedProject,

    // Acciones
    loadProjects,
    loadMoreProjects,
    setGlobalFilter,
    setStatusFilter,
    setEtapaFilter,
    changeSelectedEjercicioFiscal,

    // Dialog actions
    handleNewProject,
    handleProjectSelect,
    handleCloseWizard,

    // CRUD operations
    handleSaveProject,
    updateProjectLocally,
    addProjectToList,

    // Utilities
    isEjercicioFiscalCerrado,
    permiteCapturaProyectos,
    getSelectedEjercicioFiscal,
    filteredProjects
  };
};