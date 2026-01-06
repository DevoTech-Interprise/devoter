import { useState, useEffect } from "react";
import { Share, Copy, CheckCheck, Loader2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { useCampaignColor } from "../../components/CampaignThemed";
import { inviteService } from "../../services/inviteService";
import { campaignService } from "../../services/campaignService";
import { userService } from "../../services/userService";
import { toast, ToastContainer } from "react-toastify";
import Sidebar from "../../components/Sidebar";
import QRCode from "react-qr-code";
import "react-toastify/dist/ReactToastify.css";

const Invites = () => {
  const { darkMode } = useTheme();
  const { user, refreshUser } = useUser();
  useCampaignColor();
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [copiedMap, setCopiedMap] = useState<{ [key: string]: boolean }>({});

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const userId = user?.id;
      const campaignId = user?.campaign_id;

      if (!userId) {
        toast.error("Usuário não encontrado");
        return;
      }

      // Busca todas as campanhas
      const allCampaigns = await campaignService.getAll();

      // Filtra apenas a campanha ativa do usuário
      const myCampaign = allCampaigns.find((c: any) => c.id === campaignId);

      if (!myCampaign) {
        setCampaigns([]);
        return;
      }

      // 🔧 CORREÇÃO: Busca o usuário com o invite_token atual
      try {
        const userWithToken = await userService.getWithInviteToken(userId);
        const currentInviteToken = userWithToken.invite_token;

        console.log('🔍 Token atual do usuário:', currentInviteToken);

        setCampaigns([{
          ...myCampaign,
          inviteToken: currentInviteToken, // ✅ Usa o token atual
          inviter: user
        }]);
      } catch (err) {
        console.error("Erro ao buscar token do usuário:", err);
        setCampaigns([{ ...myCampaign, inviteToken: null, inviter: user }]);
      }
    } catch (error) {
      toast.error("Erro ao carregar campanha vinculada");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user?.campaign_id, user]);

  // Escutar mudanças de campanha
  useEffect(() => {
    const handleCampaignChange = async () => {
      await refreshUser();
      await fetchCampaigns();
    };

    window.addEventListener('campaignChanged', handleCampaignChange as EventListener);

    return () => {
      window.removeEventListener('campaignChanged', handleCampaignChange as EventListener);
    };
  }, []);

  // 🔧 CORREÇÃO: Só gera novo token quando clicado
  const handleGenerateInvite = async (campaignId: string) => {
    try {
      setLoading(true);
      const userId = user?.id;
      if (!userId) {
        toast.error("Usuário não encontrado");
        return;
      }

      // 🔍 DEBUG: Verifique a resposta completa
      console.log('🔍 Chamando generateInvite para userId:', userId);
      const response = await inviteService.generateInvite(userId);
      console.log('📥 Resposta completa:', response);
      console.log('🔑 invite_token recebido:', response.invite_token);

      // Usa a URL completa retornada pela API sem filtrar
      const inviteToken = response.invite_token;

      // Atualiza a lista com o NOVO token
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, inviteToken: inviteToken, inviter: user } : c
      ));

      toast.success("Novo link gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar link de convite");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Retorna a URL completa - se já vier completa da API, usa diretamente
  const getFullInviteUrl = (inviteToken: string) => {
    // Se já for uma URL completa, retorna diretamente
    if (inviteToken.startsWith('http://') || inviteToken.startsWith('https://')) {
      return inviteToken;
    }
    
    // Se for apenas o token, constrói a URL com o domínio correto
    return `https://soudabase.com.br/invite/${inviteToken}`;
  };

  // Mapeamento de siglas para nomes completos dos estados
  const stateNames: { [key: string]: string } = {
    'AC': 'ACRE', 'AL': 'ALAGOAS', 'AP': 'AMAPÁ', 'AM': 'AMAZONAS',
    'BA': 'BAHIA', 'CE': 'CEARÁ', 'DF': 'DISTRITO FEDERAL', 'ES': 'ESPÍRITO SANTO',
    'GO': 'GOIÁS', 'MA': 'MARANHÃO', 'MT': 'MATO GROSSO', 'MS': 'MATO GROSSO DO SUL',
    'MG': 'MINAS GERAIS', 'PA': 'PARÁ', 'PB': 'PARAÍBA', 'PR': 'PARANÁ',
    'PE': 'PERNAMBUCO', 'PI': 'PIAUÍ', 'RJ': 'RIO DE JANEIRO', 'RN': 'RIO GRANDE DO NORTE',
    'RS': 'RIO GRANDE DO SUL', 'RO': 'RONDÔNIA', 'RR': 'RORAIMA', 'SC': 'SANTA CATARINA',
    'SP': 'SÃO PAULO', 'SE': 'SERGIPE', 'TO': 'TOCANTINS'
  };

  // Função auxiliar para gerar a mensagem completa do convite
  const generateInviteMessage = (campaign: any) => {
    const fullUrl = getFullInviteUrl(campaign.inviteToken);
    
    // Pega o estado do usuário que criou a campanha e converte para nome completo
    const userStateCode = campaign.inviter?.state || '';
    const userState = stateNames[userStateCode.toUpperCase()] || userStateCode.toUpperCase() || 'SEU ESTADO';
    
    // Monta a mensagem no formato solicitado
    let inviteText = `Olá, aqui é ${campaign.inviter?.name || ''}. Faça parte do grupo de amigos da ${campaign.name}. A sua participação é muito importante para ${userState} melhor.`;
    
    // Adiciona o link do YouTube entre parênteses se existir
    if (campaign.link_youtube) {
      inviteText += ` ( ${campaign.link_youtube} )`;
    }
    
    inviteText += ` Clique no link abaixo, faça seu cadastro e convide mais amigos. ${fullUrl}`;
    
    return inviteText;
  };

  // Copiar mensagem completa para área de transferência
  const handleCopyLink = (campaignId: string, inviteToken?: string) => {
    if (!inviteToken) return toast.error("Nenhum link disponível. Gere o convite primeiro.");

    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const inviteMessage = generateInviteMessage(campaign);
    navigator.clipboard.writeText(inviteMessage);
    setCopiedMap(prev => ({ ...prev, [campaignId]: true }));
    setTimeout(() => setCopiedMap(prev => ({ ...prev, [campaignId]: false })), 2000);
    toast.success("Mensagem completa copiada para a área de transferência!");
  };

  // Compartilhar no WhatsApp
  const handleShareWhatsApp = (campaign: any) => {
    if (!campaign.inviteToken) return toast.error("Nenhum link disponível. Gere o convite primeiro.");

    const inviteText = generateInviteMessage(campaign);
    const encodedText = encodeURIComponent(inviteText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="flex bg-white dark:bg-gray-900 h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 pt-6 md:pt-15">
          <ToastContainer position="top-right" autoClose={4000} />

          <div className="max-w-4xl mx-auto">
            <header className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                Gerenciar Convites
              </h1>
              <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
                Gere e compartilhe convites para suas campanhas
              </p>
            </header>

            <div className="space-y-6">
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <div key={campaign.id} className={`w-full rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {/* Cabeçalho do Card */}
                    <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                        <div className="relative group w-full md:w-auto flex justify-center md:justify-start">
                          <img src={campaign.logo} alt={campaign.name} className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg shadow-md transition-transform group-hover:scale-105" />
                        </div>
                        <div className="flex-1 w-full">
                          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white text-center md:text-left">{campaign.name}</h2>
                          <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400 text-center md:text-left">{campaign.description}</p>

                          {/* 🔧 ADICIONA: Status do link */}
                          {campaign.inviteToken && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                ✅ Link ativo
                              </span>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Este link é permanente até você gerar um novo
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Corpo do Card */}
                    <div className="p-4 md:p-6 space-y-4">
                      {/* Input do link */}
                      {/* Input do link */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Link do Convite {campaign.inviteToken && "🔗"}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={campaign.inviteToken ? getFullInviteUrl(campaign.inviteToken) : 'Clique em "Gerar Link" para criar um convite'}
                            readOnly
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                          />
                          <button
                            onClick={() => handleCopyLink(campaign.id, campaign.inviteToken)}
                            disabled={!campaign.inviteToken}
                            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Copiar link"
                          >
                            {copiedMap[campaign.id] ? <CheckCheck className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                          </button>
                        </div>
                      </div>

                      {/* QR Code */}
                      {campaign.inviteToken && (
                        <div className="flex flex-col justify-center items-center mt-4">
                          <label className="block text-center text-base md:text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Escaneie o QRCode para o seu link de convite
                          </label>
                          <QRCode
                            value={getFullInviteUrl(campaign.inviteToken)}
                            size={200}
                            bgColor={darkMode ? "#1F2937" : "#ffffff"}
                            fgColor={darkMode ? "#ffffff" : "#000000"}
                          />
                        </div>
                      )}

                      {/* Botões */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={() => handleShareWhatsApp(campaign)}
                          disabled={!campaign.inviteToken}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Share className="w-5 h-5" /> Compartilhar no WhatsApp
                        </button>

                        <button
                          onClick={() => handleGenerateInvite(campaign.id)}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : campaign.inviteToken ? (
                            '🔄 Regenerar Link'
                          ) : (
                            '✨ Gerar Link'
                          )}
                        </button>
                      </div>

                      {/* 🔧 ADICIONA: Aviso sobre regeneração */}
                      {campaign.inviteToken && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                            ⚠️ <strong>Atenção:</strong> Ao regenerar o link, o link atual será invalidado e não funcionará mais.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                  {user?.role != "admin" && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Você ainda não está vinculado a nenhuma campanha. Entre em contato com o administrador para obter um convite.
                    </p>
                  )
                  }
                  {user?.role == "admin" && (
                    <button
                      onClick={() => (window.location.href = "/campanhas")}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Criar Campanha
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invites;