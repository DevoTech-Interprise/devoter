import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoutes";
import { ThemeProvider } from "./context/ThemeContext";
import { sessionService } from "./services/sessionService";


import Login from "./pages/login/login";
import Dashboard from "./pages/dashboard/dashboard";
import InvitePage from "./pages/invite/invite";
import Invites from "./pages/invites/invites";
import CampaignsPage from "./pages/campaign/campaign";


const RootRedirect = () => {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;

  if (sessionService.isSessionExpired()) {
    sessionService.clearSession();
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <Router >

        <Routes >
          {/* Páginas públicas */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          {/* Nota: /auth/logout é rota da API; logout do cliente é feito chamando a API diretamente */}

          {/* Páginas privadas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/invite/:token"
            element={<InvitePage />}
          />
          <Route
            path="/invite"
            element={<InvitePage />}
          />
          <Route
            path="/convites"
            element={
              <PrivateRoute>
                <Invites />
              </PrivateRoute>
            }
          />
          <Route
            path="/campanhas"
            element={
              <PrivateRoute>
                <CampaignsPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;