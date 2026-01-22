'use client';

import React, { useState, useEffect } from 'react';
import { Tree, TreeCheckboxSelectionKeys, TreeSelectionEvent } from 'primereact/tree';
import { TreeNode } from 'primereact/treenode';

interface PermissionsTreeProps {
  selectedPermissions: string[];
  onPermissionsChange: (permissions: string[]) => void;
  permissionsData: TreeNode[];
}

const PermissionsTree: React.FC<PermissionsTreeProps> = ({
  selectedPermissions,
  onPermissionsChange,
  permissionsData
}) => {
  const [selectedKeys, setSelectedKeys] = useState<TreeCheckboxSelectionKeys>({});

  // Sincronizar selectedPermissions con selectedKeys
  useEffect(() => {
    if (permissionsData.length === 0) return;

    const keys: TreeCheckboxSelectionKeys = {};
    
    // Función recursiva para calcular estados de nodos
    const calculateNodeState = (node: TreeNode): { checked: boolean, partialChecked: boolean } => {
      if (node.children && node.children.length > 0) {
        // Nodo padre - calcular basado en hijos
        const childStates = node.children.map(child => calculateNodeState(child));
        const checkedCount = childStates.filter(state => state.checked).length;
        const partialCount = childStates.filter(state => state.partialChecked).length;
        
        if (checkedCount === node.children.length) {
          // Todos los hijos están seleccionados
          return { checked: true, partialChecked: false };
        } else if (checkedCount > 0 || partialCount > 0) {
          // Algunos hijos seleccionados o con estado parcial
          return { checked: false, partialChecked: true };
        } else {
          // Ningún hijo seleccionado
          return { checked: false, partialChecked: false };
        }
      } else {
        // Nodo hoja - verificar si está seleccionado
        const isSelected = selectedPermissions.includes(node.key as string);
        return { checked: isSelected, partialChecked: false };
      }
    };
    
    // Función recursiva para aplicar estados a todos los nodos
    const applyStates = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        const state = calculateNodeState(node);
        
        // Solo agregar al objeto keys si el nodo tiene algún tipo de selección
        if (state.checked || state.partialChecked) {
          keys[node.key as string] = state;
        }
        
        // Procesar hijos recursivamente
        if (node.children && node.children.length > 0) {
          applyStates(node.children);
        }
      });
    };
    
    applyStates(permissionsData);
    
    console.log('Selected permissions:', selectedPermissions);
    console.log('Calculated selection keys:', keys);
    
    setSelectedKeys(keys);
  }, [selectedPermissions, permissionsData]);

  const handleSelectionChange = (e: TreeSelectionEvent) => {
    const newSelectedKeys = e.value as TreeCheckboxSelectionKeys;
    
    console.log('Selection changed:', newSelectedKeys);
    
    setSelectedKeys(newSelectedKeys);
    
    // Extraer todas las keys que están completamente seleccionadas (tanto nodos hoja como padres)
    const permissions: string[] = [];
    
    // Función recursiva para recopilar todos los nodos seleccionados (completos Y parciales)
    const collectSelectedPermissions = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        const key = node.key as string;
        const selectionState = newSelectedKeys[key];
        
        // Incluir nodos que están completamente seleccionados O parcialmente seleccionados
        if (selectionState && typeof selectionState === 'object' && 
            (selectionState.checked || selectionState.partialChecked)) {
          permissions.push(key);
        }
        
        // Procesar hijos recursivamente
        if (node.children && node.children.length > 0) {
          collectSelectedPermissions(node.children);
        }
      });
    };
    
    collectSelectedPermissions(permissionsData);
    
    console.log('Extracted permissions (including parent nodes - complete and partial):', permissions);
    onPermissionsChange(permissions);
  };

  return (
    <div className="permissions-tree">
      <Tree
        value={permissionsData}
        selectionMode="checkbox"
        selectionKeys={selectedKeys}
        onSelectionChange={handleSelectionChange}
        propagateSelectionUp={true}
        propagateSelectionDown={true}
        className="w-full"
      />
    </div>
  );
};

export default PermissionsTree;