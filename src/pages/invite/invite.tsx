import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, MapPin, ChevronRight } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, ToastContainer } from "react-toastify";
// import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
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

const Invites = () => {
  // const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  // const [timer, setTimer] = useState(600);
  const [estados, setEstados] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);

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
  // useEffect(() => {
  //   const countdown = setInterval(() => {
  //     setTimer((prev) => (prev > 0 ? prev - 1 : 0));
  //   }, 1000);
  //   return () => clearInterval(countdown);
  // }, []);

  // const formatTimer = () => {
  //   const min = Math.floor(timer / 60)
  //     .toString()
  //     .padStart(2, "0");
  //   const sec = (timer % 60).toString().padStart(2, "0");
  //   return `${min}:${sec}`;
  // };

  // Carregar dados da campanha
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user.id;

        if (!userId) {
          toast.error("Usuário não encontrado");
          return;
        }

        const response = await inviteService.generateInvite(userId);
        setInviteLink(response.invite_token);

        const token = response.invite_token.split("/").pop();
        if (token) {
          const campaignData = await inviteService.getCampaignByInviteToken(token);
          setCampaign(campaignData);
        }
      } catch (error) {
        toast.error("Erro ao carregar informações da campanha");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, []);

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

  const onSubmit = async (data: FormType) => {
    try {
      const inviteToken = inviteLink.split("/").pop();
      if (!inviteToken) {
        throw new Error("Token de convite não encontrado");
      }

      const formattedData = {
        name: data.nome,
        email: data.email,
        password: data.senha,
        phone: data.telefone.replace("+", ""), // Remove o + do número
        gender: data.sexo || "",
        contry: "BR", // Por padrão Brasil
        city: data.cidade || "",
        neighborhood: data.bairro || "",
        invite_token: inviteToken
      };

      await inviteService.acceptInvite(formattedData);
      toast.success("✅ Cadastro concluído com sucesso!");
      
      // Aguarda um pouco para o usuário ver a mensagem de sucesso
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao finalizar cadastro. Verifique os dados e tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900 transition-all">
      <ToastContainer position="top-right" autoClose={4000} />
      {/* Banner */}
      <div 
        className="relative w-full md:w-1/2 flex items-center justify-center p-8 md:rounded-r-3xl overflow-hidden"
        style={{
          background: campaign ? `linear-gradient(to bottom right, ${campaign.campaign.color_primary}, ${campaign.campaign.color_primary}99)` : 'linear-gradient(to bottom right, #2563eb, #4f46e5)'
        }}
      >
        {campaign && (
          <img
            src={campaign.campaign.logo}
            alt={campaign.campaign.name}
            className="absolute inset-0 object-cover opacity-40"
          />
        )}
        <div className="relative z-10 text-center text-white">
          {campaign ? (
            <>
              <h1 className="text-3xl font-bold mb-1">{campaign.campaign.name}</h1>
              <p className="text-lg mb-4">{campaign.campaign.description}</p>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-md inline-block">
                <p>
                  <strong>Convidado por:</strong> {campaign.inviter.name}
                </p>
                {/* <p className="text-yellow-300 mt-1 text-sm">
                  ⏳ Convite expira em: <strong>{formatTimer()}</strong>
                </p> */}
              </div>
            </>
          ) : (
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Erro ao carregar campanha</h1>
              <p>Não foi possível carregar as informações da campanha.</p>
            </div>
          )}
        </div>
      </div>

      {/* Formulário */}
      <div className="flex flex-col w-full md:w-1/2 justify-center px-8 py-10">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
          Cadastro de Participante
        </h2>

        {/* Progresso */}
        <div className="flex justify-center mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-14 mx-1 rounded-full transition-all ${
                s <= step ? "" : "bg-gray-300 dark:bg-gray-700"
              }`}
              style={s <= step ? {
                backgroundColor: campaign?.campaign.color_primary || '#2563eb'
              } : {}}
            ></div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg mx-auto space-y-6">
          <AnimatePresence mode="wait">
            {/* Etapa 1 */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <InputLarge
                  icon={<User />}
                  placeholder="Nome completo"
                  {...register("nome")}
                  error={errors.nome?.message}
                  campaign={campaign}
                />
                <InputLarge
                  icon={<Mail />}
                  type="email"
                  placeholder="E-mail"
                  {...register("email")}
                  error={errors.email?.message}
                  campaign={campaign}
                />
                <div>
                  <PhoneInput
                    country={"br"}
                    value={watch("telefone")}
                    onChange={(value) => setValue("telefone", value)}
                    inputClass="!w-full !p-4 !pl-16 !text-lg !border !rounded-lg !border-gray-300 dark:!bg-gray-800 dark:!text-white"
                    buttonClass="!border-gray-300 dark:!border-gray-700"
                    inputStyle={{ width: "100%", height: "60px", paddingLeft: "64px" }}
                  />
                  {errors.telefone && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.telefone.message}
                    </p>
                  )}
                </div>
                <select
                  {...register("sexo")}
                  className="w-full p-4 text-lg border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="">Selecione o sexo</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
                {errors.sexo && (
                  <p className="text-red-500 text-sm">{errors.sexo.message}</p>
                )}
                <Button onClick={handleNext} text="Próximo" campaign={campaign} />
              </motion.div>
            )}

            {/* Etapa 2 */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex gap-2">
                  <select
                    {...register("estado")}
                    className="w-1/2 p-4 text-lg border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="">Estado</option>
                    {estados.map((e) => (
                      <option key={e.id} value={e.sigla}>
                        {e.nome}
                      </option>
                    ))}
                  </select>
                  <select
                    {...register("cidade")}
                    className="w-1/2 p-4 text-lg border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="">Cidade</option>
                    {cidades.map((c) => (
                      <option key={c.id} value={c.nome}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <InputLarge
                  icon={<MapPin />}
                  placeholder="Bairro"
                  {...register("bairro")}
                  error={errors.bairro?.message}
                  campaign={campaign}
                />
                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-white px-4 py-3 text-lg rounded-md hover:opacity-90 transition flex items-center justify-center gap-2 w-1/2"
                    style={{
                      backgroundColor: campaign?.campaign?.color_primary || '#2563eb'
                    }}
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="text-white px-4 py-3 text-lg rounded-md hover:opacity-90 transition flex items-center justify-center gap-2 w-1/2"
                    style={{
                      backgroundColor: campaign?.campaign?.color_primary || '#2563eb'
                    }}
                  >
                    Próximo <ChevronRight className="w-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Etapa 3 */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <InputLarge
                  icon={<Lock />}
                  type="password"
                  placeholder="Senha"
                  {...register("senha")}
                  error={errors.senha?.message}
                  campaign={campaign}
                />
                <InputLarge
                  icon={<Lock />}
                  type="password"
                  placeholder="Confirmar senha"
                  {...register("confirmarSenha")}
                  error={errors.confirmarSenha?.message}
                  campaign={campaign}
                />
                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-white p-4 text-lg rounded-md hover:opacity-90 transition flex items-center justify-center gap-2 w-1/2"
                    style={{
                      backgroundColor: campaign?.campaign?.color_primary || '#2563eb'
                    }}
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="text-white p-4 text-lg rounded-md hover:opacity-90 transition flex items-center justify-center gap-2 w-1/2"
                    style={{
                      backgroundColor: campaign?.campaign?.color_primary || '#2563eb'
                    }}
                  >
                    Finalizar Cadastro
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
};

// 🔧 Componentes auxiliares
const InputLarge = ({ icon, error, campaign, ...props }: any) => (
  <div>
    <div className="flex items-center gap-3 border rounded-lg p-4 text-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white">
      <span style={{ color: campaign?.campaign?.color_primary || '#2563eb' }}>{icon}</span>
      <input {...props} className="w-full bg-transparent outline-none focus:outline-none" 
        style={{
          caretColor: campaign?.campaign?.color_primary || '#2563eb'
        }}
      />
    </div>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const Button = ({ onClick, text, campaign }: any) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-white p-4 text-lg rounded-md hover:opacity-90 transition flex items-center justify-center gap-2"
    style={{
      backgroundColor: campaign?.campaign?.color_primary || '#2563eb',
    }}
  >
    {text} <ChevronRight className="w-5" />
  </button>
);

export default Invites;