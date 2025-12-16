import { useLocation } from "react-router";
import { Link } from "../components/general";
import css from "../styles/global.module.css";

const NotFoundPage = () => {
  const location = useLocation();

  const returnPath =
    (location.state as { from?: string })?.from ?? "/";

  return (
    <main className={css.notFound}>
      <h1>Página no encontrada</h1>

      <Link path={returnPath}>
        Volver
      </Link>
    </main>
  );
};

export default NotFoundPage;