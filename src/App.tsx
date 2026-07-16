import { useState, useCallback } from 'react';
import Sidebar, { type PageId } from './components/Sidebar';
import HomePage from './components/HomePage';
import CalendarPage from './components/CalendarPage';
import IncidentsPage from './components/IncidentsPage';
import AboutPage from './components/AboutPage';
import SentinelNodePage from './components/SentinelNodePage';
import ToastContainer, { type Toast } from './components/ToastContainer';

export default function App() {
  const [page, setPage] = useState<PageId>('home');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    setToasts((prev) => [...prev, { ...toast, id: Date.now() + Math.random() }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-scada-bg">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <main className="md:ml-60 pt-16 md:pt-0 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {page === 'home' && <HomePage />}
          {page === 'sentinel' && <SentinelNodePage onAlert={addToast} />}
          {page === 'calendar' && <CalendarPage />}
          {page === 'incidents' && <IncidentsPage />}
          {page === 'about' && <AboutPage />}
        </div>
      </main>
    </div>
  );
}
