import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a] text-white">
      <div className="text-center">
        <h1 className="mb-4 text-7xl font-bold">404</h1>
        <p className="mb-6 text-xl text-zinc-400">Oops! Page not found</p>
        <a href="/" className="text-white underline underline-offset-4 hover:text-zinc-300">
          Return to Home
        </a>
        <div className="mt-20 text-[10px] text-zinc-600">
          Versão Beta 1.1.154
        </div>
      </div>
    </div>
  );
};

export default NotFound;
