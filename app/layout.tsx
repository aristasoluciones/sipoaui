'use client';
import { LayoutProvider } from '../layout/context/layoutcontext';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import { ConfirmPopup } from 'primereact/confirmpopup';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';
import '../styles/demo/Demos.scss';
import { AuthProvider } from '@/layout/context/authContext';
import { NotificationProvider } from '../layout/context/notificationContext'
import { SessionManager } from '@/src/components/SessionManager';

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link id="theme-css" href={`/themes/lara-light-pink/theme.css`} rel="stylesheet"></link>
            </head>
            <body>
                <PrimeReactProvider>
                    <ConfirmPopup />
                    <AuthProvider>
                        <NotificationProvider>
                            <SessionManager>
                                <LayoutProvider>{children}</LayoutProvider>
                            </SessionManager>
                        </NotificationProvider>
                    </AuthProvider>
                </PrimeReactProvider>
            </body>
        </html>
    );
}
