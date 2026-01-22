import { Metadata } from 'next';
import AppConfig from '../../layout/AppConfig';
import React from 'react';

interface SimpleLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: process.env.NEXT_PUBLIC_TITLE_PAGE,
    description: process.env.NEXT_PUBLIC_DESCRIPTION_PAGE
};

export default function SimpleLayout({ children }: SimpleLayoutProps) {
    return (
        <React.Fragment>
            {children}
            
        </React.Fragment>
    );
}
