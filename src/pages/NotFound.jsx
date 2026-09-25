import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/Chrome.jsx';

export default function NotFound() {
  return (
    <div className="site">
      <SiteHeader />
      <section className="not-found">
        <p className="label">IMG_404_JPG</p>
        <h1 className="display">Esta foto no se reveló.</h1>
        <p>La página que buscas no existe o la cita todavía no está publicada.</p>
        <Link to="/" className="text-link">
          Volver a todas las citas →
        </Link>
      </section>
    </div>
  );
}
