import { StrictMode, Suspense, lazy, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { DataProvider } from './lib/DataContext.jsx';
import Home from './pages/Home.jsx';
import CitaPage from './pages/CitaPage.jsx';
import Book from './pages/Book.jsx';
import NotFound from './pages/NotFound.jsx';
import './styles/site.css';

const Admin = lazy(() => import('./admin/Admin.jsx'));

function ScrollToTop() {
  const { pathname } = useLocation();
    useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <DataProvider>
        <Suspense fallback={<div className="loading-screen">Cargando…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cita/:slug" element={<CitaPage />} />
            <Route path="/cita/:slug/libro" element={<Book />} />
            <Route path="/cita/:slug/libro/:cap" element={<Book />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </DataProvider>
    </BrowserRouter>
  </StrictMode>,
);
