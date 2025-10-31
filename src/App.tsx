import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoutes";
import { ThemeProvider } from "./context/ThemeContext";


import Login from "./pages/login/login";
import Dashboard from "./pages/dashboard/dashboard";
import InvitePage from "./pages/invite/invite";
import Invites from "./pages/invites/invites";


function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Páginas públicas */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />

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
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;