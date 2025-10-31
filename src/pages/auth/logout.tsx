import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sessionService } from "../../services/sessionService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Limpa sessão e dá feedback
    sessionService.clearSession();
    toast.info("Você saiu da conta.");

    const t = setTimeout(() => {
      navigate("/login");
    }, 700);

    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <ToastContainer position="top-right" autoClose={2000} />
      <div className="text-center">
        <p className="text-lg text-gray-700 dark:text-gray-200">Saindo...</p>
      </div>
    </div>
  );
};

export default Logout;
