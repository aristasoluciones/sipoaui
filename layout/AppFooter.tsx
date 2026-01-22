/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import { LayoutContext } from './context/layoutcontext';

const AppFooter = () => {
    const { layoutConfig } = useContext(LayoutContext);

    return (
        <div className="layout-footer">
            <div className='flex flex-column md:flex-row align-items-center'>
                <img src={`/layout/images/logo-circulo.png`} alt="Logo" height="40" className="mr-2" />
                <span className='text-gray-500'>by</span>
                <span className="font-medium ml-2 text-primary-500">Unidad Técnica de Servicios Informáticos</span>
            </div>
            
        </div>
    );
};

export default AppFooter;
