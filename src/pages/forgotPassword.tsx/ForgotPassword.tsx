// src/pages/ForgotPassword.tsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Mail, Lock, CheckCircle, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { authService } from "../../services/authService";
import { usePasswordRecovery } from "../hooks/usePasswordRecovery";
import {
    forgotPasswordSchema,
    resetPasswordSchema,
    type ForgotPasswordFormData,
    type ResetPasswordFormData
} from "../../schemas/auth";

type Step = 'email' | 'verify' | 'reset';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const { darkMode, colors } = useTheme();
    const {
        recoveryReady,
        recoveryLoading,
        recoveryError,
        refreshRecoveryToken
    } = usePasswordRecovery();

    const [currentStep, setCurrentStep] = useState<Step>('email');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const [verificationToken, setVerificationToken] = useState<string>(""); // NOVO ESTADO

    // Formulário para solicitar redefinição
    const {
        register: registerEmail,
        handleSubmit: handleSubmitEmail,
        formState: { errors: errorsEmail },
        setError: setEmailError,
        clearErrors: clearEmailErrors,
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    // Formulário para redefinir senha
    const {
        register: registerReset,
        handleSubmit: handleSubmitReset,
        formState: { errors: errorsReset },
        setError: setResetError,
        clearErrors: clearResetErrors,
        watch: watchReset,
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const newPassword = watchReset("newPassword");

    // Solicitar código de verificação
    const handleSendCode = async (data: ForgotPasswordFormData) => {
        if (!recoveryReady) {
            setEmailError("root", {
                type: "manual",
                message: "Sistema de recuperação não está pronto. Tente novamente."
            });
            return;
        }

        setIsSubmitting(true);
        clearEmailErrors();

        try {
            console.log('🔄 [Page] Iniciando envio de código para:', data.email);
            const response = await authService.forgotPassword(data);

            setUserEmail(data.email);
            setUserId(response.userId);
            setCurrentStep('verify');

            toast.success("Código de verificação enviado para seu email!");
        } catch (error: any) {
            console.error('❌ [Page] Erro no handleSendCode:', error);

            setEmailError("root", {
                type: "manual",
                message: error.message || "Erro ao enviar código. Tente novamente."
            });

            setCurrentStep('email');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Verificar código
    const handleVerifyCode = async (token: string) => {
        setIsSubmitting(true);

        try {
            console.log('🔄 [Page] Verificando código...');
            const response = await authService.verifyResetCode({
                email: userEmail,
                token: token
            });

            setUserId(response.userId);
            setVerificationToken(token); // SALVA O TOKEN
            setCurrentStep('reset');

            toast.success("Código verificado com sucesso!");
        } catch (error: any) {
            console.error('❌ [Page] Erro na verificação:', error);
            toast.error(error.message || "Código inválido ou expirado.");

            // Mantém na etapa de verificação
            setCurrentStep('verify');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Redefinir senha
    const handleResetPassword = async (data: ResetPasswordFormData) => {
        if (!recoveryReady) {
            setResetError("root", {
                type: "manual",
                message: "Sistema de recuperação não está pronto. Tente novamente."
            });
            return;
        }

        setIsSubmitting(true);
        clearResetErrors();

        try {
            if (!userId) {
                throw new Error("Erro de sessão. Solicite um novo código.");
            }

            if (!verificationToken) {
                throw new Error("Token de verificação não encontrado.");
            }

            console.log('🔄 [Page] Redefinindo senha para usuário:', userId);

            await authService.resetPassword({
                ...data,
                email: userEmail,
                token: verificationToken
            });

            // TOAST COM CONFIGURAÇÃO EXPLÍCITA
            toast.success("Senha redefinida com sucesso!", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: darkMode ? "dark" : "light",
            });

            console.log('✅ [DEBUG] Toast de sucesso disparado');

            // Aguarda um pouco MAIS para garantir que o toast seja visto
            setTimeout(() => {
                console.log('📍 [DEBUG] Navegando para /login');

                // Limpa estados ANTES de navegar
                setUserEmail("");
                setUserId(null);
                setVerificationToken("");

                navigate("/login");
            }, 2000); // Aumentei para 2 segundos

        } catch (error: any) {
            console.error('❌ [Page] Erro no reset de senha:', error);

            // TOAST DE ERRO TAMBÉM COM CONFIGURAÇÃO EXPLÍCITA
            toast.error(error.message || "Erro ao redefinir senha. Tente novamente.", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: darkMode ? "dark" : "light",
            });

            setResetError("root", {
                type: "manual",
                message: error.message || "Erro ao redefinir senha. Tente novamente."
            });

            setCurrentStep('reset');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Componente para entrada do código de verificação
    const VerificationCodeInput: React.FC = () => {
        const [code, setCode] = useState(["", "", "", "", "", ""]);

        const handleChange = (index: number, value: string) => {
            if (value.length <= 1 && /^\d*$/.test(value)) {
                const newCode = [...code];
                newCode[index] = value;
                setCode(newCode);

                // Avançar para o próximo input
                if (value && index < 5) {
                    const nextInput = document.getElementById(`code-${index + 1}`);
                    nextInput?.focus();
                }

                // Se todos os dígitos foram preenchidos, verificar
                if (newCode.every(digit => digit !== "") && index === 5) {
                    handleVerifyCode(newCode.join(""));
                }
            }
        };

        const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
            if (e.key === "Backspace" && !code[index] && index > 0) {
                const prevInput = document.getElementById(`code-${index - 1}`);
                prevInput?.focus();
            }
        };

        return (
            <div className="space-y-6">
                <div className="text-center">
                    <Mail className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Verificação por Email
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Enviamos um código de 6 dígitos para
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {userEmail}
                    </p>
                </div>

                <div className="flex justify-center space-x-2">
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            id={`code-${index}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className={`w-12 h-12 text-center text-lg font-semibold rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${darkMode
                                    ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-400"
                                    : "bg-white border-gray-300 text-gray-900 focus:ring-primary-500"
                                }`}
                        />
                    ))}
                </div>

                <div className="text-center space-y-2">
                    <button
                        type="button"
                        onClick={() => {
                            // Limpa o código atual e reenvia
                            setCode(["", "", "", "", "", ""]);
                            handleSendCode({ email: userEmail });
                        }}
                        disabled={isSubmitting || !recoveryReady}
                        className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Enviando...' : 'Reenviar código'}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        O código expira em 10 minutos
                    </p>
                </div>
            </div>
        );
    };

    // Função para recarregar o sistema de recovery
    const handleRetryRecovery = async () => {
        try {
            await refreshRecoveryToken();
            toast.success("Sistema de recuperação reconectado!");
        } catch (error: any) {
            toast.error("Erro ao reconectar sistema de recuperação");
        }
    };

    // Função auxiliar para determinar o status do step
    const getStepStatus = (step: Step) => {
        const stepOrder: Step[] = ['email', 'verify', 'reset'];
        const currentIndex = stepOrder.indexOf(currentStep);
        const stepIndex = stepOrder.indexOf(step);

        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'current';
        return 'upcoming';
    };

    return (
        <div
            className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
                }`}
        >
            <div
                className={`w-full max-w-md rounded-2xl shadow-lg overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"
                    }`}
            >
                {/* HEADER */}
                <div
                    className="p-6 text-center relative"
                    style={{
                        background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
                    }}
                >
                    <button
                        onClick={() => navigate("/login")}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <Lock className="w-12 h-12 text-white mx-auto" />
                    <h2 className="text-2xl font-bold text-white mt-3">
                        Redefinir Senha
                    </h2>
                    <p className="text-gray-100 text-sm mt-1">
                        {currentStep === 'email' && "Digite seu email cadastrado"}
                        {currentStep === 'verify' && "Digite o código de verificação"}
                        {currentStep === 'reset' && "Crie sua nova senha"}
                    </p>

                    {/* Status do sistema de recovery
          <div className="mt-2">
            {recoveryLoading && (
              <p className="text-xs text-yellow-200 flex items-center justify-center">
                <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                Conectando sistema...
              </p>
            )}
            {recoveryError && (
              <div className="text-xs text-red-200">
                <p> Erro no sistema</p>
                <button
                  onClick={handleRetryRecovery}
                  className="underline hover:text-red-300 text-xs mt-1"
                >
                  Tentar novamente
                </button>
              </div>
            )}
            {recoveryReady && !recoveryLoading && (
              <p className="text-xs text-green-200"> Sistema pronto</p>
            )}
          </div> */}
                </div>

                {/* PROGRESS STEPS */}
                <div className="px-8 pt-6">
                    <div className="flex items-center justify-center space-x-2"> {/* Adicionei space-x-2 */}
                        {['email', 'verify', 'reset'].map((step, index) => {
                            const stepStatus = getStepStatus(step as Step);

                            return (
                                <React.Fragment key={step}>
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${stepStatus === 'completed'
                                                ? "bg-green-500 text-white"
                                                : stepStatus === 'current'
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                                            }`}
                                    >
                                        {stepStatus === 'completed' ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    {index < 2 && (
                                        <div
                                            className={`w-12 h-1 transition-colors ${stepStatus === 'completed'
                                                    ? "bg-green-500"
                                                    : "bg-gray-300 dark:bg-gray-600"
                                                }`}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* FORM */}
                <div className="p-8 space-y-6">
                    {/* STEP 1: Email */}
                    {currentStep === 'email' && (
                        <form onSubmit={handleSubmitEmail(handleSendCode)}>
                            <div className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200"
                                    >
                                        Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="text-gray-400 w-5 h-5" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            {...registerEmail("email")}
                                            className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${darkMode
                                                    ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-400"
                                                    : "bg-white border-gray-300 text-gray-700 focus:ring-primary-500"
                                                }`}
                                        />
                                    </div>
                                    {errorsEmail.email && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errorsEmail.email.message}
                                        </p>
                                    )}
                                    {errorsEmail.root && (
                                        <div className="mt-2 text-sm text-red-500 text-center bg-red-50 dark:bg-red-900/20 py-2 px-3 rounded-lg border border-red-200 dark:border-red-800">
                                            {errorsEmail.root.message}
                                        </div>
                                    )}
                                </div>

                                {/* BOTÃO PARA STEP 1 */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !recoveryReady}
                                    className="w-full rounded-lg px-4 py-2 font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                                    style={{ backgroundColor: colors.primary }}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Enviando código...
                                        </div>
                                    ) : (
                                        'Enviar Código'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* STEP 2: Verificação */}
                    {currentStep === 'verify' && <VerificationCodeInput />}

                    {/* STEP 3: Nova Senha */}
                    {currentStep === 'reset' && (
                        <form onSubmit={handleSubmitReset(handleResetPassword)}>
                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="newPassword"
                                        className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                                    >
                                        Nova Senha
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="text-gray-400 w-5 h-5" />
                                        </div>
                                        <input
                                            id="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            {...registerReset("newPassword")}
                                            className={`w-full pl-10 pr-10 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${darkMode
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
                                    {errorsReset.newPassword && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errorsReset.newPassword.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                                    >
                                        Confirmar Nova Senha
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="text-gray-400 w-5 h-5" />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            {...registerReset("confirmPassword")}
                                            className={`w-full pl-10 pr-10 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${darkMode
                                                    ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-400"
                                                    : "bg-white border-gray-300 text-gray-700 focus:ring-primary-500"
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    {errorsReset.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errorsReset.confirmPassword.message}
                                        </p>
                                    )}
                                </div>

                                {/* Requisitos da senha */}
                                {newPassword && (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <p className="text-sm font-medium mb-2">A senha deve conter:</p>
                                        <ul className="text-xs space-y-1">
                                            <li className={`flex items-center ${newPassword.length >= 8 ? 'text-green-500' : 'text-gray-500'}`}>
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Pelo menos 8 caracteres
                                            </li>
                                            <li className={`flex items-center ${/[a-z]/.test(newPassword) ? 'text-green-500' : 'text-gray-500'}`}>
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Uma letra minúscula
                                            </li>
                                            <li className={`flex items-center ${/[A-Z]/.test(newPassword) ? 'text-green-500' : 'text-gray-500'}`}>
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Uma letra maiúscula
                                            </li>
                                            <li className={`flex items-center ${/\d/.test(newPassword) ? 'text-green-500' : 'text-gray-500'}`}>
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Um número
                                            </li>
                                            <li className={`flex items-center ${/[@$!%*?&]/.test(newPassword) ? 'text-green-500' : 'text-gray-500'}`}>
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Um caractere especial (@$!%*?&)
                                            </li>
                                        </ul>
                                    </div>
                                )}

                                {errorsReset.root && (
                                    <div className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-900/20 py-2 px-3 rounded-lg border border-red-200 dark:border-red-800">
                                        {errorsReset.root.message}
                                    </div>
                                )}

                                {/* BOTÃO PARA STEP 3 */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !recoveryReady}
                                    className="w-full rounded-lg px-4 py-2 font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                                    style={{ backgroundColor: colors.primary }}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Redefinindo senha...
                                        </div>
                                    ) : (
                                        'Redefinir Senha'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;