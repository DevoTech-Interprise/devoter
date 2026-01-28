import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PrivateRoute from "./routes/PrivateRoutes";
import { ThemeProvider } from "./context/ThemeContext";
import { UserProvider } from "./context/UserContext";
import { CampaignProvider } from "./context/CampaignContext";
import { sessionService } from "./services/sessionService";
import { ChatBotButton } from "./components/ChatBotButton";

import Login from "./pages/login/login";
import Dashboard from "./pages/dashboard/dashboard";
import InvitePage from "./pages/invite/invite";
import Invites from "./pages/invites/invites";
import CampaignsPage from "./pages/campaign/campaign";
import NetworkPage from "./pages/network/network";
import CampaignNetworksPage from "./pages/networks/campaignNetworks";
import AlcancePage from "./pages/range/range";
import UserManagement from "./pages/user/users";
import UserProfile from "./pages/profile/UserProfile";
import ForgotPassword from "./pages/forgotPassword.tsx/ForgotPassword";
import Terms from "./pages/terms/terms";
import PrivacyPolicy from "./pages/privacity/privacity";
import EngagementPage from "./pages/engagement/EngagementPage";

import { NewsList } from './pages/news/NewsList';
import { NewsForm } from './pages/news/NewsForm';
import { NewsDetail } from './pages/news/NewsDetail';

import { ScheduleCalendar } from './pages/schedule/ScheduleCalendar';
import { ScheduleForm } from './pages/schedule/ScheduleForm';
import { ScheduleDetail } from './pages/schedule/ScheduleDetail';

import CampaignLeadersProgress from './pages/campaign/CampaignLeadersProgress';
import AddCampaignManagers from './pages/campaign/AddCampaignManagers';

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
      <UserProvider>
        <CampaignProvider>
          <Router>
            {/* ToastContainer ADICIONADO AQUI - É OBRIGATÓRIO */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />

            <Routes>
            {/* Páginas públicas */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/esqueci-a-senha" element={<ForgotPassword />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/privacidade" element={<PrivacyPolicy />} />
            <Route path="/invite/:token" element={<InvitePage />} />


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

            <Route
              path="/campanhas/:campaignId/lideranças"
              element={
                <PrivateRoute>
                  <CampaignLeadersProgress />
                </PrivateRoute>
              }
            />

            <Route
              path="/campanhas/:campaignId/adicionar-lideranças"
              element={
                <PrivateRoute>
                  <AddCampaignManagers />
                </PrivateRoute>
              }
            />

            <Route
              path="/rede"
              element={
                <PrivateRoute>
                  <NetworkPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/redes-campanhas"
              element={
                <PrivateRoute>
                  <CampaignNetworksPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/alcance-campanhas"
              element={
                <PrivateRoute>
                  <AlcancePage />
                </PrivateRoute>
              }
            />

            <Route
              path="/usuarios"
              element={
                <PrivateRoute>
                  <UserManagement />
                </PrivateRoute>
              }
            />

            <Route
              path="/engajamento"
              element={
                <PrivateRoute>
                  <EngagementPage />
                </PrivateRoute>
              }
            />

            <Route path="/news" element={<NewsList />} />
            <Route path="/news/create" element={<NewsForm />} />
            <Route path="/news/edit/:id" element={<NewsForm />} />
            <Route path="/news/:id" element={<NewsDetail />} />

            <Route path="/schedule" element={<ScheduleCalendar />} />
            <Route path="/schedule/create" element={<ScheduleForm />} />
            <Route path="/schedule/edit/:id" element={<ScheduleForm />} />
            <Route path="/schedule/:id" element={<ScheduleDetail />} />

            <Route path="/perfil" element={<UserProfile />} />

            {/* ⚠️ Rota curinga (fallback) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ChatBotButton />
        </Router>
      </CampaignProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;