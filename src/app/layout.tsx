import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
export const metadata={title:'My Project Hub',description:'Universal project, task and QA tracker'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><AuthProvider>{children}</AuthProvider></body></html>}
