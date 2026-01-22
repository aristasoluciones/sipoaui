import React, { useState, useEffect } from 'react';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
import { Checkbox } from 'primereact/checkbox';
import '@/styles/components/PermissionsTreeTable.scss';

// Tipos para los nodos del árbol de permisos
interface PermissionNode {
  key: string;
  data: {
    module: string;
    access?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
  children?: PermissionNode[];
  leaf?: boolean;
}

// Tipos para los permisos seleccionados
interface SelectedPermissions {
  [key: string]: {
    access?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
}

interface PermissionsTreeTableProps {
  selectedPermissions: string[];
  onPermissionsChange: (permissions: string[]) => void;
  permissionsData?: PermissionNode[];
}

const PermissionsTreeTable: React.FC<PermissionsTreeTableProps> = ({
  selectedPermissions,
  onPermissionsChange,
  permissionsData
}) => {
  const [nodes, setNodes] = useState<PermissionNode[]>([]);
  const [selectedNodePermissions, setSelectedNodePermissions] = useState<SelectedPermissions>({});

  // Datos de ejemplo - en producción vendrán de la API
  const defaultPermissionsStructure: PermissionNode[] = [
    {
      key: 'usuarios',
      data: { module: 'Usuarios' },
      children: [
        {
          key: 'usuarios.gestion',
          data: { module: 'Gestión de Usuarios', access: false, create: false, edit: false, delete: false },
          leaf: true
        },
        {
          key: 'usuarios.perfiles',
          data: { module: 'Perfiles de Usuario', access: false, create: false, edit: false, delete: false },
          leaf: true
        }
      ]
    },
    {
      key: 'roles',
      data: { module: 'Roles y Permisos' },
      children: [
        {
          key: 'roles.gestion',
          data: { module: 'Gestión de Roles', access: false, create: false, edit: false, delete: false },
          leaf: true
        },
        {
          key: 'roles.permisos',
          data: { module: 'Asignación de Permisos', access: false, create: false, edit: false, delete: false },
          leaf: true
        }
      ]
    },
    {
      key: 'proyectos',
      data: { module: 'Proyectos' },
      children: [
        {
          key: 'proyectos.gestion',
          data: { module: 'Gestión de Proyectos', access: false, create: false, edit: false, delete: false },
          leaf: true
        },
        {
          key: 'proyectos.seguimiento',
          data: { module: 'Seguimiento', access: false, create: false, edit: false, delete: false },
          leaf: true
        },
        {
          key: 'proyectos.reportes',
          data: { module: 'Reportes', access: false, create: false, edit: false, delete: false },
          leaf: true
        }
      ]
    },
    {
      key: 'catalogos',
      data: { module: 'Catálogos' },
      children: [
        {
          key: 'catalogos.unidades',
          data: { module: 'Unidades Responsables', access: false, create: false, edit: false, delete: false },
          leaf: true
        },
        {
          key: 'catalogos.programas',
          data: { module: 'Programas', access: false, create: false, edit: false, delete: false },
          leaf: true
        },
        {
          key: 'catalogos.beneficiarios',
          data: { module: 'Tipos de Beneficiarios', access: false, create: false, edit: false, delete: false },
          leaf: true
        }
      ]
    },
    {
      key: 'reportes',
      data: { module: 'Reportes y Estadísticas' },
      children: [
        {
          key: 'reportes.dashboard',
          data: { module: 'Dashboard Ejecutivo', access: false, create: false, edit: false, delete: false },
          leaf: true
        },
        {
          key: 'reportes.exportes',
          data: { module: 'Exportación de Datos', access: false, create: false, edit: false, delete: false },
          leaf: true
        }
      ]
    }
  ];

  useEffect(() => {
    const dataToUse = permissionsData || defaultPermissionsStructure;
    console.log('Using permissions data:', dataToUse);
    initializePermissions(dataToUse);
  }, [selectedPermissions, permissionsData]);

  // Inicializar permisos basado en los permisos seleccionados
  const initializePermissions = (permissionsStructure: PermissionNode[]) => {
    const updatedNodes = JSON.parse(JSON.stringify(permissionsStructure));
    const selectedPermsMap: SelectedPermissions = {};

    const updateNodePermissions = (node: PermissionNode) => {
      if (node.leaf && node.data) {
        const key = node.key;
        selectedPermsMap[key] = {
          access: selectedPermissions.includes(`${key}.access`),
          create: selectedPermissions.includes(`${key}.create`),
          edit: selectedPermissions.includes(`${key}.edit`),
          delete: selectedPermissions.includes(`${key}.delete`)
        };
        
        // Actualizar el nodo con los permisos seleccionados
        node.data.access = selectedPermsMap[key].access;
        node.data.create = selectedPermsMap[key].create;
        node.data.edit = selectedPermsMap[key].edit;
        node.data.delete = selectedPermsMap[key].delete;
      }

      if (node.children) {
        node.children.forEach(updateNodePermissions);
      }
    };

    updatedNodes.forEach(updateNodePermissions);
    setNodes(updatedNodes);
    setSelectedNodePermissions(selectedPermsMap);
  };

  // Obtener el estado de un nodo padre (completo, parcial, sin selección)
  const getParentCheckboxState = (node: PermissionNode): boolean | null => {
    if (!node.children) return null;

    let hasSelected = false;
    let hasUnselected = false;

    const checkChildren = (child: PermissionNode) => {
      if (child.leaf) {
        const permissions = selectedNodePermissions[child.key];
        const hasAnyPermission = permissions && (
          permissions.access || permissions.create || permissions.edit || permissions.delete
        );
        
        if (hasAnyPermission) {
          hasSelected = true;
        } else {
          hasUnselected = true;
        }
      } else if (child.children) {
        child.children.forEach(checkChildren);
      }
    };

    node.children.forEach(checkChildren);

    if (hasSelected && hasUnselected) return null; // Estado intermedio
    if (hasSelected) return true; // Todos seleccionados
    return false; // Ninguno seleccionado
  };

  // Manejar cambio en checkbox de nodo padre
  const handleParentCheckboxChange = (node: PermissionNode, checked: boolean) => {
    const updatedPermissions = [...selectedPermissions];
    
    const updateChildrenPermissions = (child: PermissionNode) => {
      if (child.leaf) {
        const permissionTypes = ['access', 'create', 'edit', 'delete'];
        
        permissionTypes.forEach(type => {
          const permissionKey = `${child.key}.${type}`;
          const index = updatedPermissions.indexOf(permissionKey);
          
          if (checked && index === -1) {
            updatedPermissions.push(permissionKey);
          } else if (!checked && index > -1) {
            updatedPermissions.splice(index, 1);
          }
        });
      } else if (child.children) {
        child.children.forEach(updateChildrenPermissions);
      }
    };

    if (node.children) {
      node.children.forEach(updateChildrenPermissions);
    }

    onPermissionsChange(updatedPermissions);
  };

  // Manejar cambio en checkbox de permiso específico
  const handlePermissionChange = (nodeKey: string, permissionType: string, checked: boolean) => {
    const permissionKey = `${nodeKey}.${permissionType}`;
    const updatedPermissions = [...selectedPermissions];
    const index = updatedPermissions.indexOf(permissionKey);

    if (checked && index === -1) {
      updatedPermissions.push(permissionKey);
      
      // Si se selecciona cualquier permiso que no sea 'access', también seleccionar 'access'
      if (permissionType !== 'access') {
        const accessKey = `${nodeKey}.access`;
        if (!updatedPermissions.includes(accessKey)) {
          updatedPermissions.push(accessKey);
        }
      }
    } else if (!checked && index > -1) {
      updatedPermissions.splice(index, 1);
      
      // Si se deselecciona 'access', deseleccionar todos los demás permisos
      if (permissionType === 'access') {
        ['create', 'edit', 'delete'].forEach(type => {
          const otherPermissionKey = `${nodeKey}.${type}`;
          const otherIndex = updatedPermissions.indexOf(otherPermissionKey);
          if (otherIndex > -1) {
            updatedPermissions.splice(otherIndex, 1);
          }
        });
      }
    }

    onPermissionsChange(updatedPermissions);
  };

  // Template para la columna del módulo
  const moduleTemplate = (node: any) => {
    if (node.leaf) {
      return <span className="ml-2">{node.data.module}</span>;
    }

    const checkboxState = getParentCheckboxState(node);
    
    return (
      <div className="flex align-items-center">
        <TriStateCheckbox
          value={checkboxState}
          onChange={(e) => handleParentCheckboxChange(node, e.value === true)}
          className="mr-2"
        />
        <span className="font-medium">{node.data.module}</span>
      </div>
    );
  };

  // Template para checkbox de acceso
  const accessTemplate = (node: any) => {
    if (!node.leaf) return null;
    
    return (
      <div className="flex justify-content-center">
        <Checkbox
          checked={selectedPermissions.includes(`${node.key}.access`)}
          onChange={(e) => handlePermissionChange(node.key, 'access', e.checked || false)}
        />
      </div>
    );
  };

  // Template para checkbox de crear
  const createTemplate = (node: any) => {
    if (!node.leaf) return null;
    
    const hasAccess = selectedPermissions.includes(`${node.key}.access`);
    
    return (
      <div className="flex justify-content-center">
        <Checkbox
          checked={selectedPermissions.includes(`${node.key}.create`)}
          onChange={(e) => handlePermissionChange(node.key, 'create', e.checked || false)}
          disabled={!hasAccess}
        />
      </div>
    );
  };

  // Template para checkbox de editar
  const editTemplate = (node: any) => {
    if (!node.leaf) return null;
    
    const hasAccess = selectedPermissions.includes(`${node.key}.access`);
    
    return (
      <div className="flex justify-content-center">
        <Checkbox
          checked={selectedPermissions.includes(`${node.key}.edit`)}
          onChange={(e) => handlePermissionChange(node.key, 'edit', e.checked || false)}
          disabled={!hasAccess}
        />
      </div>
    );
  };

  // Template para checkbox de eliminar
  const deleteTemplate = (node: any) => {
    if (!node.leaf) return null;
    
    const hasAccess = selectedPermissions.includes(`${node.key}.access`);
    
    return (
      <div className="flex justify-content-center">
        <Checkbox
          checked={selectedPermissions.includes(`${node.key}.delete`)}
          onChange={(e) => handlePermissionChange(node.key, 'delete', e.checked || false)}
          disabled={!hasAccess}
        />
      </div>
    );
  };

  return (
    <div className="permissions-tree-table">
      <TreeTable 
        value={nodes} 
        className="p-treetable-sm"
        showGridlines
        resizableColumns
      >
        <Column 
          field="module" 
          header="Módulo / Funcionalidad" 
          expander 
          body={moduleTemplate}
          style={{ width: '40%' }}
        />
        <Column 
          header="Acceso" 
          body={accessTemplate} 
          style={{ width: '15%', textAlign: 'center' }}
        />
        <Column 
          header="Crear" 
          body={createTemplate} 
          style={{ width: '15%', textAlign: 'center' }}
        />
        <Column 
          header="Editar" 
          body={editTemplate} 
          style={{ width: '15%', textAlign: 'center' }}
        />
        <Column 
          header="Eliminar" 
          body={deleteTemplate} 
          style={{ width: '15%', textAlign: 'center' }}
        />
      </TreeTable>
      
      <div className="mt-3 p-2 surface-50 border-round">
        <small className="text-color-secondary">
          <strong>Nota:</strong> El permiso de &quot;Acceso&quot; es requerido para habilitar otros permisos. 
          Los checkboxes de módulos padre permiten seleccionar/deseleccionar todos los permisos de sus submódulos.
        </small>
      </div>
    </div>
  );
};

export default PermissionsTreeTable;