import { Metadata } from 'next';
import Layout from '../../layout/layout';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: process.env.NEXT_PUBLIC_TITLE_PAGE,
    description: 'Sistema para la Formulación de Proyectos Institucionales',
    robots: { index: false, follow: false },
    //viewport: { initialScale: 1, width: 'device-width' },
    openGraph: {
        type: 'website',
        title: 'SFPI,Sistema de Formulación de Proyectos Institucionales',
        url: 'https://sakai.primereact.org/',
        description: 'Sistema para la Formulación de Proyectos Institucionales',
        images: ['https://www.primefaces.org/static/social/sakai-react.png'],
        ttl: 604800
    },
    icons: {
        icon: '/favicon.ico'
    }
};
export const viewport = { initialScale: 1, width: 'device-width' };
export default function AppLayout({ children }: AppLayoutProps) {
    return <Layout>{children}</Layout>;
}
