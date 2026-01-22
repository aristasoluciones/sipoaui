/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '@/types';
import { usePermissions } from '@/src/hooks/usePermissions';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const { hasPermission,isSuperAdmin,userRoles } = usePermissions();

    const filterMenuItems = (items: AppMenuItem[]): AppMenuItem[] => {
        return items.filter(item => {
            // Si el item tiene subitems, filtrarlos recursivamente
            if (item.items) {
                const filteredSubItems = filterMenuItems(item.items);
                if (filteredSubItems.length === 0) {
                    return false; // Si no hay subitems válidos, ocultar el item padre
                }
                item.items = filteredSubItems;
            }

            if (isSuperAdmin) return true; // SuperAdmin ve todo

            // si solo superadmin puede entrar, se debe  verificar el rol
            if (item.superAdminOnly) {
                return !!isSuperAdmin;
            }

            if (item.permission && item.permission !== '') {
                return hasPermission(item.permission);
            }
            
            if (item.permissions && item.permissions.length > 0) {
                return item.permissions.some(perm => hasPermission(perm));
            }
            
            return true;
        });
    };

    const model: AppMenuItem[] = [
        {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }],
            superAdminOnly: true, // Ejemplo de permiso requerido
        },

        {
            label: 'Catalogos',
            icon: 'pi pi-fw pi-th-large',
            items: [
                { 
                    label: 'Gestion de catálogos', 
                    icon: 'pi pi-fw pi-folder', 
                    to: '/catalogos',
                    permissions: ['catalogos']  // Ejemplo de permiso requerido
                },
            ],
            permissions: ['catalogos']  // Ejemplo de permiso requerido
        },
        {
            label: 'Roles y usuarios',
            icon: 'pi pi-fw pi-th-large',
            items: [
                { label: 'Usuarios', icon: 'pi pi-fw pi-shield', to: '/usuarios', permissions: ['roles_y_usuarios.usuarios'] },
                { label: 'Roles', icon: 'pi pi-fw pi-key', to: '/roles', permissions: ['roles_y_usuarios.roles'] },
            ],
            permissions: ['roles_y_usuarios','roles_y_usuarios.usuarios','roles_y_usuarios.roles']  // Ejemplo de permiso requerido
        },
        {
            label: 'Cartera de proyectos',
            items: [
                { label: 'Ejercicios fiscales', icon: 'pi pi-fw pi-table', to: '/ejercicios-fiscales', permissions: ['cartera_de_proyectos.ejercicios_fiscales'] },
                { label: 'Proyectos', icon: 'pi pi-fw pi-table', to: '/proyectos', permissions: ['cartera_de_proyectos.proyectos'] },
            ],
            permissions: ['cartera_de_proyectos']  // Ejemplo de permiso requerido
        },
        {
            label: 'Centro de reportes',
            items: [
                { label: 'Reportes', icon: 'pi pi-fw pi-file', to: '/reportes', permissions: ['reportes'] },
            ],
            permissions: ['centro_de_reportes','reportes']  // Ejemplo de permiso requerido
        }
       
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {filterMenuItems(model).map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}

            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
