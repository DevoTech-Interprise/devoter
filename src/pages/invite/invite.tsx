import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, MapPin, ChevronRight, Loader2 } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, ToastContainer } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { inviteService } from "../../services/inviteService";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(8, "Telefone inválido"),
  sexo: z.string().nonempty("Selecione o sexo"),
  estado: z.string().nonempty("Selecione o estado"),
  cidade: z.string().nonempty("Selecione a cidade"),
  bairro: z.string().min(2, "Informe o bairro"),
  senha: z
    .string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Inclua pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "Inclua pelo menos um número")
    .regex(/[!@#$%^&*]/, "Inclua pelo menos um símbolo especial"),
  confirmarSenha: z.string(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type FormType = z.infer<typeof formSchema>;

const InviteRegister = () => {
  const [step, setStep] = useState(1);
  const [timer, setTimer] = useState(600);
  const [estados, setEstados] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignData, setCampaignData] = useState<any>(null);
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!token) {
        toast.error("Token de convite inválido");
        navigate("/");
        return;
      }

      try {
        const data = await inviteService.getCampaignByInviteToken(token);
        setCampaignData(data);
      } catch (error) {
        console.error("Erro ao buscar dados da campanha:", error);
        toast.error("Erro ao carregar informações do convite");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, [token, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema),
  });

  // 🕒 Timer regressivo
  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const formatTimer = () => {
    const min = Math.floor(timer / 60)
      .toString()
      .padStart(2, "0");
    const sec = (timer % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  // 📍 IBGE Estados e Cidades
  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
      .then((res) => res.json())
      .then((data) =>
        setEstados(data.sort((a: any, b: any) => a.nome.localeCompare(b.nome)))
      );
  }, []);

  useEffect(() => {
    const estadoSelecionado = watch("estado");
    if (estadoSelecionado) {
      fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSelecionado}/municipios`
      )
        .then((res) => res.json())
        .then((data) =>
          setCidades(data.sort((a: any, b: any) => a.nome.localeCompare(b.nome)))
        );
    }
  }, [watch("estado")]);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const onSubmit = (data: FormType) => {
    console.log(data);
    toast.success("✅ Cadastro concluído com sucesso!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!campaignData) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">
            Erro ao carregar informações do convite
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para a página inicial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 py-12 px-4 sm:px-6">
      <ToastContainer position="top-right" autoClose={4000} />
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Banner */}
            <div
              className="relative p-8 text-white overflow-hidden"
              style={{
                background: campaignData.campaign.color_primary,
              }}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{
                  backgroundImage: `url(${campaignData.campaign.logo})`,
                }}
              />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex-1">
                  <img
                    src={campaignData.campaign.logo}
                    alt={campaignData.campaign.name}
                    className="w-48 h-48 object-cover rounded-xl mb-8"
                  />
                  <h1 className="text-3xl font-bold mb-4">
                    {campaignData.campaign.name}
                  </h1>
                  <p className="text-lg mb-6 opacity-90">
                    {campaignData.campaign.description}
                  </p>
                  <div className="space-y-3 text-lg">
                    <p><strong>Convidado por:</strong> {campaignData.inviter.name}</p>
                  </div>
                </div>

                {/* Timer */}
                {/* <div className="mt-8">
                  {timer > 0 ? (
                    <div className="inline-block bg-white bg-opacity-20 px-6 py-3 rounded-xl">
                      <p>Tempo restante: {formatTimer()}</p>
                    </div>
                  ) : (
                    <div className="bg-red-500 px-6 py-3 rounded-xl">
                      <p>Tempo para aceitar o convite expirou!</p>
                    </div>
                  )}
                </div> */}
              </div>
            </div>

            {/* Form */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                <motion.form
                  key={step}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className="max-w-md mx-auto space-y-6"
                  onSubmit={handleSubmit(onSubmit)}
                >
                  {step === 1 && (
                    <>
                      <h2 className="text-2xl font-bold mb-6 text-gray-800">
                        Dados Pessoais
                      </h2>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome Completo
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                              <User size={20} />
                            </span>
                            <input
                              type="text"
                              {...register("nome")}
                              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.nome
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              placeholder="Digite seu nome completo"
                            />
                          </div>
                          {errors.nome && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.nome.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            E-mail
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                              <Mail size={20} />
                            </span>
                            <input
                              type="email"
                              {...register("email")}
                              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.email
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              placeholder="Digite seu e-mail"
                            />
                          </div>
                          {errors.email && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.email.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefone
                          </label>
                          <PhoneInput
                            country={"br"}
                            value={watch("telefone")}
                            onChange={(phone) => setValue("telefone", phone)}
                            containerClass="phone-input"
                            inputClass={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              errors.telefone
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {errors.telefone && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.telefone.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sexo
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                              <User size={20} />
                            </span>
                            <select
                              {...register("sexo")}
                              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.sexo
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            >
                              <option value="">Selecione seu sexo</option>
                              <option value="M">Masculino</option>
                              <option value="F">Feminino</option>
                              <option value="NI">Prefiro não informar</option>
                            </select>
                          </div>
                          {errors.sexo && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.sexo.message}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleNext}
                          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          style={{
                            backgroundColor: campaignData.campaign.color_primary,
                          }}
                        >
                          Próximo
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <h2 className="text-2xl font-bold mb-6 text-gray-800">
                        Localização
                      </h2>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                              <MapPin size={20} />
                            </span>
                            <select
                              {...register("estado")}
                              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.estado
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            >
                              <option value="">Selecione seu estado</option>
                              {estados.map((estado) => (
                                <option key={estado.id} value={estado.id}>
                                  {estado.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                          {errors.estado && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.estado.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cidade
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                              <MapPin size={20} />
                            </span>
                            <select
                              {...register("cidade")}
                              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.cidade
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            >
                              <option value="">Selecione sua cidade</option>
                              {cidades.map((cidade) => (
                                <option key={cidade.id} value={cidade.id}>
                                  {cidade.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                          {errors.cidade && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.cidade.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bairro
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                              <MapPin size={20} />
                            </span>
                            <input
                              type="text"
                              {...register("bairro")}
                              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.bairro
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              placeholder="Digite seu bairro"
                            />
                          </div>
                          {errors.bairro && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.bairro.message}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={handleBack}
                            className="w-1/2 py-2 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            Voltar
                          </button>
                          <button
                            type="button"
                            onClick={handleNext}
                            className="w-1/2 py-2 px-4 text-white rounded-lg hover:opacity-90 transition-colors"
                            style={{
                              backgroundColor: campaignData.campaign.color_primary,
                            }}
                          >
                            Próximo
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <h2 className="text-2xl font-bold mb-6 text-gray-800">
                        Defina sua senha
                      </h2>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Senha
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                              <Lock size={20} />
                            </span>
                            <input
                              type="password"
                              {...register("senha")}
                              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.senha
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              placeholder="Digite sua senha"
                            />
                          </div>
                          {errors.senha && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.senha.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirme sua senha
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                              <Lock size={20} />
                            </span>
                            <input
                              type="password"
                              {...register("confirmarSenha")}
                              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.confirmarSenha
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              placeholder="Confirme sua senha"
                            />
                          </div>
                          {errors.confirmarSenha && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.confirmarSenha.message}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={handleBack}
                            className="w-1/2 py-2 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            Voltar
                          </button>
                          <button
                            type="submit"
                            className="w-1/2 py-2 px-4 text-white rounded-lg hover:opacity-90 transition-colors"
                            style={{
                              backgroundColor: campaignData.campaign.color_primary,
                            }}
                          >
                            Concluir
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </motion.form>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteRegister;