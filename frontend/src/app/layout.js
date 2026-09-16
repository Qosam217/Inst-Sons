import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AuthProvider } from '../context/AuthContext';
import AuthGuard from '../components/AuthGuard';

export const metadata = {
  title: 'Inst Sons — Personal Productivity Tools',
  description: 'Aplikasi Modular Monolith untuk berbagai alat produktivitas (PDF, Audio, YouTube, Image Tools)',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <AuthGuard>{children}</AuthGuard>
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
