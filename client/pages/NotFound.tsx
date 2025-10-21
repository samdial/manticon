import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-display text-primary mb-4">404</h1>
        <p className="text-lg text-muted-foreground mb-4">
          Страница не найдена
        </p>
        <a
          href="/"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          На главную
        </a>
      </div>
    </div>
  );
};

export default NotFound;
