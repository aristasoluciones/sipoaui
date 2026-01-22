/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import { useAuth } from './context/authContext';
import { useRouter } from 'next/navigation'

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const { logout, user } = useAuth();
    const router = useRouter();
    const [userMenuVisible, setUserMenuVisible] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        await logout();
        router.push('/auth/login');
    };

    const handleProfileClick = () => {
        router.push('/perfil'); // Asumiendo que existe una ruta de perfil
        setUserMenuVisible(false);
    };

    // Cerrar el menú si se hace clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current,
    }));

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo">
                <img src={`/layout/images/logo-circulo.png`} height="60px" alt="logo" />
                <span className='text-primary'>I E P C</span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                <div className="user-menu-container" ref={userMenuRef}>
                    <button 
                        type="button" 
                        onClick={() => setUserMenuVisible(!userMenuVisible)}
                        className="user-menu-trigger"
                    >
                        <div className="user-avatar">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user?.name || 'Usuario'}</span>
                            <span className="user-role">Administrador</span>
                        </div>
                        <i className={`pi ${userMenuVisible ? 'pi-chevron-up' : 'pi-chevron-down'} user-chevron`}></i>
                    </button>

                    {userMenuVisible && (
                        <div className="modern-user-menu">
                            <div className="menu-arrow"></div>
                            <div className="menu-content">
                                <div className="menu-header">
                                    <div className="user-avatar-large">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="user-details">
                                        <h4>{user?.name || 'Usuario'}</h4>
                                        <p>{user?.email || 'usuario@ejemplo.com'}</p>
                                    </div>
                                </div>
                                {/*
                                <div className="menu-divider"></div>
                                
                                <div className="menu-options">
                                   <button 
                                        className="menu-option" 
                                        onClick={handleProfileClick}
                                    >
                                        <i className="pi pi-user"></i>
                                        <span>Mi Perfil</span>
                                    </button>
                                    
                                    <button 
                                        className="menu-option" 
                                        onClick={() => {
                                            // Ruta a configuración si existe
                                            router.push('/configuracion');
                                            setUserMenuVisible(false);
                                        }}
                                    >
                                        <i className="pi pi-cog"></i>
                                        <span>Configuración</span>
                                    </button>
                                </div>
                                */}
                                <div className="menu-divider"></div>
                                
                                <button 
                                    className="menu-option logout-option" 
                                    onClick={handleLogout}
                                >
                                    <i className="pi pi-sign-out"></i>
                                    <span>Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
