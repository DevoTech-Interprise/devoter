import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { sessionService } from "../services/sessionService";

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const token = localStorage.getItem("token");

  // Se não houver token, redireciona para /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Se a sessão expirou, limpar sessão e redirecionar para /login
  if (sessionService.isSessionExpired()) {
    sessionService.clearSession();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;