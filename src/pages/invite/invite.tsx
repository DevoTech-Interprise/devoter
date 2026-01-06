import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, MapPin, ChevronRight, ArrowDown } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { inviteService } from "../../services/inviteService";
import "react-phone-input-2/lib/style.css";

const formSchema = z
  .object({
    nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("E-mail inválido"),
    telefone: z.string().min(8, "Telefone inválido"),
    sexo: z.string().min(1, "Selecione o sexo"),
    estado: z.string().min(1, "Selecione o estado"),
    cidade: z.string().min(1, "Selecione a cidade"),
    bairro: z.string().min(2, "Informe o bairro"),
    senha: z
      .string()
      .min(8, "Senha deve ter no mínimo 8 caracteres")
      .regex(/[A-Z]/, "Inclua pelo menos uma letra maiúscula")
      .regex(/[0-9]/, "Inclua pelo menos um número")
      .regex(/[!@#$%^&*]/, "Inclua pelo menos um símbolo especial"),
    confirmarSenha: z.string(),
    aceiteTermos: z.boolean().refine((val) => val === true, {
      message: "É necessário aceitar os Termos de Uso e a Política de Privacidade",
    }),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

type FormType = z.infer<typeof formSchema>;

// Componente de Input reutilizável - FORA do componente principal
const InputField = ({ icon, error, campaign, ...props }: any) => (
  <div>
    <div className="flex items-center gap-3 border rounded-lg p-4 text-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white">
      <span style={{ color: campaign?.campaign?.color_primary || '#2563eb' }}>{icon}</span>
      <input 
        {...props} 
        className="w-full bg-transparent outline-none focus:outline-none"
        style={{ caretColor: campaign?.campaign?.color_primary || '#2563eb' }}
      />
    </div>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

// Componente de Botão reutilizável - FORA do componente principal
const ActionButton = ({ onClick, text, type = "button", campaign }: any) => (
  <button
    type={type}
    onClick={onClick}
    className="w-full text-white p-4 text-lg rounded-md hover:opacity-90 transition flex items-center justify-center gap-2"
    style={{ backgroundColor: campaign?.campaign?.color_primary || '#2563eb' }}
  >
    {text} <ChevronRight className="w-5" />
  </button>
);

// Componente de Progresso - FORA do componente principal
const ProgressBar = ({ step, campaign, isMobile = false }: { step: number; campaign: any; isMobile?: boolean }) => {
  if (isMobile) {
    return (
      <div className="flex justify-center mb-12">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
                s <= step 
                  ? 'text-white' 
                  : 'text-gray-400 border-gray-300 dark:border-gray-600'
              }`}
              style={s <= step ? {
                backgroundColor: campaign?.campaign.color_primary || '#2563eb',
                borderColor: campaign?.campaign.color_primary || '#2563eb'
              } : {}}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-12 h-1 mx-2 transition-all ${
                  s < step ? '' : 'bg-gray-300 dark:bg-gray-700'
                }`}
                style={s < step ? {
                  backgroundColor: campaign?.campaign.color_primary || '#2563eb'
                } : {}}
              ></div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-6">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`h-2 w-14 mx-1 rounded-full transition-all ${s <= step ? "" : "bg-gray-300 dark:bg-gray-700"}`}
          style={s <= step ? {
            backgroundColor: campaign?.campaign.color_primary || '#2563eb'
          } : {}}
        ></div>
      ))}
    </div>
  );
};

const Invites = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [estados, setEstados] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const formSectionRef = useRef<HTMLDivElement>(null);

  const {
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormType>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      sexo: '',
      estado: '',
      cidade: '',
      bairro: '',
      senha: '',
      confirmarSenha: '',
      aceiteTermos: false,
    },
  });

  // Carregar dados da campanha
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true);
        const currentUrl = window.location.href;
        const token = currentUrl.split("/").pop();

        if (!token) {
          toast.error("Token de convite não encontrado na URL");
          return;
        }

        const campaignData = await inviteService.getCampaignByInviteToken(token);
        setCampaign(campaignData);
        setInviteLink(currentUrl);
      } catch (error) {
        toast.error("Erro ao carregar informações da campanha");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, []);

  // Controlar visibilidade do indicador de scroll
  useEffect(() => {
    const checkScrollPosition = () => {
      if (formSectionRef.current) {
        const formTop = formSectionRef.current.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (formTop < windowHeight * 0.8) {
          setShowScrollIndicator(false);
        } else {
          setShowScrollIndicator(true);
        }
      }
    };

    checkScrollPosition();

    window.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, []);

  const estadoSelecionado = watch("estado");

  // 📍 IBGE Estados e Cidades
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
        const data = await response.json();
        const sortedEstados = data.sort((a: any, b: any) => a.nome.localeCompare(b.nome));
        setEstados(sortedEstados);
      } catch (error) {
        console.error('Erro ao carregar estados:', error);
        toast.error('Erro ao carregar lista de estados');
      }
    };
    
    fetchEstados();
  }, []);

  useEffect(() => {
    const fetchCidades = async () => {
      if (estadoSelecionado) {
        try {
          const response = await fetch(
            `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSelecionado}/municipios`
          );
          const data = await response.json();
          const sortedCidades = data.sort((a: any, b: any) => a.nome.localeCompare(b.nome));
          setCidades(sortedCidades);
        } catch (error) {
          console.error('Erro ao carregar cidades:', error);
          toast.error('Erro ao carregar lista de cidades');
        }
      } else {
        setCidades([]);
      }
    };
    
    fetchCidades();
  }, [estadoSelecionado]);

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };
  
  const handleBack = () => setStep((prev) => prev - 1);

  const onSubmit = async (data: FormType) => {
    if (!data.aceiteTermos) {
      toast.warning("Você precisa aceitar os Termos de Uso e a Política de Privacidade!");
      return;
    }
    try {
      const inviteToken = inviteLink.split("/").pop();
      if (!inviteToken) {
        throw new Error("Token de convite não encontrado");
      }

      const formattedData = {
        name: data.nome,
        email: data.email,
        password: data.senha,
        phone: data.telefone.replace("+", ""),
        gender: data.sexo || "",
        country: "BR",
        state: data.estado || "",
        city: data.cidade || "",
        neighborhood: data.bairro || "",
        invite_token: inviteToken,
      };

      await inviteService.acceptInvite(formattedData);

      toast.success("✅ Cadastro concluído com sucesso!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      console.error("Erro ao finalizar cadastro:", error);

      const messages = error?.response?.data?.messages;
      let errorMessage = "Erro ao finalizar cadastro. Verifique os dados.";

      if (messages && typeof messages === "object") {
        const firstKey = Object.keys(messages)[0];
        const originalMessage = messages[firstKey];

        const translations: Record<string, string> = {
          "The phone field must contain a unique value.": "O número de telefone já está cadastrado.",
          "The email field must contain a unique value.": "O e-mail informado já está cadastrado.",
          "The password field is required.": "A senha é obrigatória.",
          "The name field is required.": "O nome é obrigatório.",
          "The invite token is invalid.": "O link de convite é inválido ou expirou.",
        };

        errorMessage = translations[originalMessage] || originalMessage;
      } else if (error?.response?.data?.message) {
        const originalMessage = error.response.data.message;

        const translations: Record<string, string> = {
          "Invalid invite token": "Convite inválido ou expirado.",
          "User already registered": "Usuário já cadastrado.",
        };

        errorMessage = translations[originalMessage] || originalMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-all">
      <ToastContainer position="top-right" autoClose={4000} />
      
      {/* Layout para telas grandes (md para cima) */}
      <div className="hidden md:flex flex-col md:flex-row min-h-screen">
        {/* Banner Lateral */}
        <div
          className="relative w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-10 md:rounded-r-3xl overflow-hidden text-center"
          style={{
            background: campaign
              ? `linear-gradient(to bottom right, ${campaign.campaign.color_primary}, ${campaign.campaign.color_primary}99)`
              : 'linear-gradient(to bottom right, #2563eb, #4f46e5)'
          }}
        >
          {campaign && (
            <img
              src={campaign.campaign.logo}
              alt={campaign.campaign.name}
              className="absolute inset-0 object-cover opacity-40"
            />
          )}
          <div className="relative z-10 text-white max-w-md mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{campaign?.campaign.name}</h1>
            <p className="text-base md:text-lg mb-6">
              Cadastre-se para se conectar com outros eleitores, acompanhar a candidatura e ajudar a fortalecer a rede de apoio ao seu candidato.
            </p>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-md inline-block">
              <p>
                <strong>Convidado por:</strong> {campaign?.inviter.name}
              </p>
            </div>
          </div>
        </div>

        {/* Formulário Desktop */}
        <div className="flex flex-col w-full md:w-1/2 justify-center px-8 py-10">
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
            Cadastro de Participante
          </h2>
          <ProgressBar step={step} campaign={campaign} />
          <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-lg mx-auto space-y-6">
            {/* Etapa 1 */}
            <div className={step === 1 ? 'block' : 'hidden'}>
              <div className="space-y-5">
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      icon={<User />}
                      placeholder="Nome completo"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.nome?.message}
                      campaign={campaign}
                    />
                  )}
                />
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      icon={<Mail />}
                      type="email"
                      placeholder="E-mail"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.email?.message}
                      campaign={campaign}
                    />
                  )}
                />
                <div>
                  <Controller
                    name="telefone"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        country={"br"}
                        value={field.value}
                        onChange={(value) => field.onChange(value)}
                        inputClass="!w-full !p-4 !pl-16 !text-lg !border !rounded-lg !border-gray-300 dark:!bg-gray-800 dark:!text-white"
                        buttonClass="!border-gray-300 dark:!border-gray-700"
                        inputStyle={{ width: "100%", height: "60px", paddingLeft: "64px" }}
                      />
                    )}
                  />
                  {errors.telefone && (
                    <p className="text-red-500 text-sm mt-1">{errors.telefone.message}</p>
                  )}
                </div>
                <Controller
                  name="sexo"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <select
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        className="w-full p-4 text-lg border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <option value="">Selecione o sexo</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="NI">Outro</option>
                      </select>
                      {errors.sexo && (
                        <p className="text-red-500 text-sm mt-1">{errors.sexo.message}</p>
                      )}
                    </div>
                  )}
                />
                <ActionButton onClick={handleNext} text="Próximo" campaign={campaign} />
              </div>
            </div>

            {/* Etapa 2 */}
            <div className={step === 2 ? 'block' : 'hidden'}>
              <div className="space-y-5">
                <div className="flex gap-2">
                  <Controller
                    name="estado"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          setValue('cidade', '');
                        }}
                        onBlur={field.onBlur}
                        className="w-1/2 p-4 text-lg border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <option value="">Estado</option>
                        {estados.map((e) => (
                          <option key={e.id} value={e.sigla}>
                            {e.nome}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <Controller
                    name="cidade"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        className="w-1/2 p-4 text-lg border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <option value="">Cidade</option>
                        {cidades.map((c) => (
                          <option key={c.id} value={c.nome}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                {(errors.estado || errors.cidade) && (
                  <p className="text-red-500 text-sm">
                    {errors.estado?.message || errors.cidade?.message}
                  </p>
                )}
                <Controller
                  name="bairro"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      icon={<MapPin />}
                      placeholder="Bairro"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.bairro?.message}
                      campaign={campaign}
                    />
                  )}
                />
                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-white px-4 py-3 text-lg rounded-md hover:opacity-90 transition flex items-center justify-center gap-2 w-1/2"
                    style={{ backgroundColor: campaign?.campaign?.color_primary || '#2563eb' }}
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="text-white px-4 py-3 text-lg rounded-md hover:opacity-90 transition flex items-center justify-center gap-2 w-1/2"
                    style={{ backgroundColor: campaign?.campaign?.color_primary || '#2563eb' }}
                  >
                    Próximo <ChevronRight className="w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Etapa 3 */}
            <div className={step === 3 ? 'block' : 'hidden'}>
              <div className="space-y-5">
                <Controller
                  name="senha"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      icon={<Lock />}
                      type="password"
                      placeholder="Senha"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.senha?.message}
                      campaign={campaign}
                    />
                  )}
                />
                <Controller
                  name="confirmarSenha"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      icon={<Lock />}
                      type="password"
                      placeholder="Confirmar senha"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.confirmarSenha?.message}
                      campaign={campaign}
                    />
                  )}
                />

                <Controller
                  name="aceiteTermos"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="aceiteTermos"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="mt-1 w-5 h-5 cursor-pointer accent-blue-600"
                        />
                        <label 
                          htmlFor="aceiteTermos" 
                          className="text-sm text-gray-700 dark:text-gray-300 leading-snug"
                        >
                          Aceito os{" "}
                          <a
                            href="/termos"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-blue-600 hover:text-blue-700"
                          >
                            Termos
                          </a>{" "}
                          e{" "}
                          <a
                            href="/privacidade"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-blue-600 hover:text-blue-700"
                          >
                            Política de Privacidade
                          </a>
                        </label>
                      </div>
                      {errors.aceiteTermos && (
                        <p className="text-red-500 text-sm mt-1">{errors.aceiteTermos.message}</p>
                      )}
                    </div>
                  )}
                />

                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-white p-4 text-lg rounded-md hover:opacity-90 transition flex items-center justify-center gap-2 w-1/2"
                    style={{ backgroundColor: campaign?.campaign?.color_primary || '#2563eb' }}
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="text-white p-4 text-lg rounded-md hover:opacity-90 transition flex items-center justify-center gap-2 w-1/2"
                    style={{ backgroundColor: campaign?.campaign?.color_primary || '#2563eb' }}
                  >
                    Finalizar
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Layout para telas pequenas (mobile) */}
      <div className="block md:hidden">
        {/* Banner Mobile */}
        <div
          className="relative w-full h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden"
          style={{
            background: campaign
              ? `linear-gradient(135deg, ${campaign.campaign.color_primary}, ${campaign.campaign.color_secondary || campaign.campaign.color_primary})`
              : 'linear-gradient(135deg, #2563eb, #4f46e5)'
          }}
        >
          {campaign?.campaign.logo && (
            <img
              src={campaign.campaign.logo}
              alt={campaign.campaign.name}
              className="absolute inset-0 w-full h-full object-cover opacity-10"
            />
          )}
          
          <div className="relative z-10 text-white max-w-2xl mx-auto flex flex-col items-center justify-center flex-1">
            {campaign?.campaign.logo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <img
                  src={campaign.campaign.logo}
                  alt={campaign.campaign.name}
                  className="h-20 mx-auto mb-6 object-contain"
                />
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-4 leading-tight text-center"
            >
              {campaign?.campaign.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg mb-8 opacity-90 text-center"
            >
              Junte-se à nossa campanha
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-base opacity-80 text-center"
            >
              Complete seu cadastro para fazer parte da mudança
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-24 left-0 right-0 px-6"
          >
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20 max-w-xs mx-auto">
              <p className="text-sm text-white/80 text-center">
                <span className="font-medium">Convidado por:</span><br />
                {campaign?.inviter.name}
              </p>
            </div>
          </motion.div>

          <AnimatePresence>
            {showScrollIndicator && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
              >
                <div className="flex flex-col items-center">
                  <span className="text-sm mb-2 opacity-70 text-white">Role para cadastrar</span>
                  <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowDown className="w-5 h-5 opacity-70 text-white" />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Formulário Mobile */}
        <div 
          ref={formSectionRef}
          className="flex flex-col justify-center px-6 py-16 min-h-screen bg-gray-50 dark:bg-gray-900"
        >
          <div className="max-w-2xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                Complete seu Cadastro
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Preencha seus dados para se juntar à campanha
              </p>
            </motion.div>

            <ProgressBar step={step} campaign={campaign} isMobile />
            <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-lg mx-auto space-y-6">
              {/* Etapa 1 */}
              <div className={step === 1 ? 'block' : 'hidden'}>
                <div className="space-y-5">
                  <Controller
                    name="nome"
                    control={control}
                    render={({ field }) => (
                      <InputField
                        icon={<User />}
                        placeholder="Nome completo"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.nome?.message}
                        campaign={campaign}
                      />
                    )}
                  />
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <InputField
                        icon={<Mail />}
                        type="email"
                        placeholder="E-mail"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.email?.message}
                        campaign={campaign}
                      />
                    )}
                  />
                  <div>
                    <Controller
                      name="telefone"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          country={"br"}
                          value={field.value}
                          onChange={(value) => field.onChange(value)}
                          inputClass="!w-full !p-4 !pl-16 !text-lg !border !rounded-lg !border-gray-300 dark:!bg-gray-800 dark:!text-white"
                          buttonClass="!border-gray-300 dark:!border-gray-700"
                          inputStyle={{ width: "100%", height: "60px", paddingLeft: "64px" }}
                        />
                      )}
                    />
                    {errors.telefone && (
                      <p className="text-red-500 text-sm mt-1">{errors.telefone.message}</p>
                    )}
                  </div>
                  <Controller
                    name="sexo"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <select
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          className="w-full p-4 text-lg border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                          <option value="">Selecione o sexo</option>
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                          <option value="NI">Outro</option>
                        </select>
                        {errors.sexo && (
                          <p className="text-red-500 text-sm mt-1">{errors.sexo.message}</p>
                        )}
                      </div>
                    )}
                  />
                  <ActionButton onClick={handleNext} text="Próximo" campaign={campaign} />
                </div>
              </div>

              {/* Etapa 2 */}
              <div className={step === 2 ? 'block' : 'hidden'}>
                <div className="space-y-5">
                  <div className="flex gap-2">
                    <Controller
                      name="estado"
                      control={control}
                      render={({ field }) => (
                        <select
                          value={field.value}
                          onChange={(e) => {
                            field.onChange(e);
                            setValue('cidade', '');
                          }}
                          onBlur={field.onBlur}
                          className="w-1/2 p-4 text-lg border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                          <option value="">Estado</option>
                          {estados.map((e) => (
                            <option key={e.id} value={e.sigla}>
                              {e.nome}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    <Controller
                      name="cidade"
                      control={control}
                      render={({ field }) => (
                        <select
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          className="w-1/2 p-4 text-lg border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                          <option value="">Cidade</option>
                          {cidades.map((c) => (
                            <option key={c.id} value={c.nome}>
                              {c.nome}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                  {(errors.estado || errors.cidade) && (
                    <p className="text-red-500 text-sm">
                      {errors.estado?.message || errors.cidade?.message}
                    </p>
                  )}
                  <Controller
                    name="bairro"
                    control={control}
                    render={({ field }) => (
                      <InputField
                        icon={<MapPin />}
                        placeholder="Bairro"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.bairro?.message}
                        campaign={campaign}
                      />
                    )}
                  />
                  <div className="flex justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-white px-4 py-3 text-lg rounded-md hover:opacity-90 transition flex items-center justify-center gap-2 w-1/2"
                      style={{ backgroundColor: campaign?.campaign?.color_primary || '#2563eb' }}
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="text-white px-4 py-3 text-lg rounded-md hover:opacity-90 transition flex items-center justify-center gap-2 w-1/2"
                      style={{ backgroundColor: campaign?.campaign?.color_primary || '#2563eb' }}
                    >
                      Próximo <ChevronRight className="w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Etapa 3 */}
              <div className={step === 3 ? 'block' : 'hidden'}>
                <div className="space-y-5">
                  <Controller
                    name="senha"
                    control={control}
                    render={({ field }) => (
                      <InputField
                        icon={<Lock />}
                        type="password"
                        placeholder="Senha"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.senha?.message}
                        campaign={campaign}
                      />
                    )}
                  />
                  <Controller
                    name="confirmarSenha"
                    control={control}
                    render={({ field }) => (
                      <InputField
                        icon={<Lock />}
                        type="password"
                        placeholder="Confirmar senha"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.confirmarSenha?.message}
                        campaign={campaign}
                      />
                    )}
                  />

                  <Controller
                    name="aceiteTermos"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="aceiteTermosMobile"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="mt-1 w-5 h-5 cursor-pointer accent-blue-600"
                          />
                          <label 
                            htmlFor="aceiteTermosMobile" 
                            className="text-sm text-gray-700 dark:text-gray-300 leading-snug"
                          >
                            Aceito os{" "}
                            <a
                              href="/termos"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-blue-600 hover:text-blue-700"
                            >
                              Termos
                            </a>{" "}
                            e{" "}
                            <a
                              href="/privacidade"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-blue-600 hover:text-blue-700"
                            >
                              Política de Privacidade
                            </a>
                          </label>
                        </div>
                        {errors.aceiteTermos && (
                          <p className="text-red-500 text-sm mt-1">{errors.aceiteTermos.message}</p>
                        )}
                      </div>
                    )}
                  />

                  <div className="flex justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-white p-4 text-lg rounded-md hover:opacity-90 transition flex items-center justify-center gap-2 w-1/2"
                      style={{ backgroundColor: campaign?.campaign?.color_primary || '#2563eb' }}
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      className="text-white p-4 text-lg rounded-md hover:opacity-90 transition flex items-center justify-center gap-2 w-1/2"
                      style={{ backgroundColor: campaign?.campaign?.color_primary || '#2563eb' }}
                    >
                      Finalizar
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invites;
