import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { authService } from "../../services/authService";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { loginSchema, type LoginFormData } from "../../schemas/auth";
import { sessionService } from "../../services/sessionService";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, colors } = useTheme();
  const { setUser } = useUser();

  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<"email" | "phone">("email");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    setError,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const loginData = {
        password: data.password,
        ...(loginType === "email"
          ? { email: data.email }
          : { phone: data.phone?.replace("+55", "") }),
      };

      const response = await authService.login(loginData);

      if (!response.access_token)
        throw new Error("Token não encontrado na resposta.");

      const userData = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
        campaign_id: response.user.campaign_id,
      };

      // Salvar token primeiro
      localStorage.setItem("token", response.access_token);
      
      // Usar o UserContext para setar o usuário (isso vai atualizar o localStorage também)
      setUser(userData);

      // Inicializa a sessão com o tempo de expiração fornecido pela API
      sessionService.updateLastActivity(response.expires_in);

      toast.success("Login realizado com sucesso!");

      // Redirecionamento baseado na role
      if (userData.role === "admin") {
        navigate("/dashboard");
      } else if (userData.role === "user") {
        navigate("/convites");
      } else {
        navigate("/"); // fallback para qualquer outra role
      }
    } catch (error: any) {
      let errorMessage = "Email ou telefone incorreto ou senha inválida.";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.messages.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError("root", { type: "manual", message: errorMessage });
      
      // Limpar dados em caso de erro
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  // Observar mudanças no tipo de login para validação condicional
  const emailValue = watch("email");
  const phoneValue = watch("phone");

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div
        className={`w-full max-w-md rounded-2xl shadow-lg overflow-hidden ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* HEADER */}
        <div
          className="p-6 text-center"
          style={{
            background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
          }}
        >
          <Lock className="w-12 h-12 text-white mx-auto" />
          <h2 className="text-2xl font-bold text-white mt-3">
            Bem-vindo de volta
          </h2>
          <p className="text-gray-100 text-sm mt-1">
            Faça login com {loginType === "email" ? "email" : "telefone"}
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
          {/* Alternar tipo de login */}
          <div className="flex justify-center space-x-3 mb-4">
            <button
              type="button"
              onClick={() => {
                setLoginType("email");
                setValue("phone", "");
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                loginType === "email"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType("phone");
                setValue("email", "");
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                loginType === "phone"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              Telefone
            </button>
          </div>

          {/* Campo de login */}
          {loginType === "email" ? (
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="text-gray-400 w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-400"
                      : "bg-white border-gray-300 text-gray-700 focus:ring-primary-500"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-200"
              >
                Telefone
              </label>
              <PhoneInput
                country={"br"}
                value={phoneValue}
                onChange={(value) => setValue("phone", value)}
                inputProps={{
                  name: "phone",
                  required: true,
                }}
                inputStyle={{
                  width: "100%",
                  height: "42px",
                  borderRadius: "0.5rem",
                  backgroundColor: darkMode ? "#374151" : "white",
                  color: darkMode ? "white" : "black",
                  border: darkMode ? "1px solid #4B5563" : "1px solid #D1D5DB",
                  fontSize: "16px", // Prevenir zoom no iOS
                }}
                buttonStyle={{
                  backgroundColor: darkMode ? "#4B5563" : "#F3F4F6",
                  border: darkMode ? "1px solid #4B5563" : "1px solid #D1D5DB",
                  borderRadius: "0.5rem 0 0 0.5rem",
                }}
                dropdownStyle={{
                  backgroundColor: darkMode ? "#374151" : "white",
                  color: darkMode ? "white" : "black",
                }}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.phone.message}
                </p>
              )}
            </div>
          )}

          {/* Campo senha */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
            >
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="text-gray-400 w-5 h-5" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className={`w-full pl-10 pr-10 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-400"
                    : "bg-white border-gray-300 text-gray-700 focus:ring-primary-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {errors.root && (
            <div className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-900/20 py-2 px-3 rounded-lg border border-red-200 dark:border-red-800">
              {errors.root.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg px-4 py-2 font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: colors.primary }}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Carregando...
              </div>
            ) : (
              "Entrar"
            )}
          </button>

          {/* Links adicionais */}
          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Esqueceu sua senha?
            </button>
            <div>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Alternar para modo {darkMode ? "claro" : "escuro"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;