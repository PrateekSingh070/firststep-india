import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'FirstStep — Find your first opportunity',icons:{icon:'/favicon.svg'},description:'Real internships in India. Public sources, LLM role and city tags, and a fresh start every day.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
