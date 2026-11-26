import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'BSN — Independent Creative Studio',description:'Création audiovisuelle indépendante et culture automobile.'};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="fr" data-scroll-behavior="smooth"><body>{children}</body></html>}
