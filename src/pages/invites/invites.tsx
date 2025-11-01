import { useState, useEffect } from "react";
import { Share, Copy, CheckCheck, Loader2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { inviteService } from "../../services/inviteService";
import { campaignService } from "../../services/campaignService";
import { toast, ToastContainer } from "react-toastify";
import Sidebar from "../../components/Sidebar";
import QRCode from "react-qr-code"; // 🚀 Import QR Code
import "react-toastify/dist/ReactToastify.css";

const Invites = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [copiedMap, setCopiedMap] = useState<{ [key: string]: boolean }>({});

  // Busca campanha do usuário e gera convite inicial
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user?.id ?? user?.ID;

      if (!userId) {
        toast.error("Usuário não encontrado");
        return;
      }

      const myCampaign = await campaignService.getById(userId);
      if (!myCampaign) {
        toast.error("Nenhuma campanha vinculada encontrada");
        setCampaigns([]);
        return;
      }

      try {
        const resp = await inviteService.generateInvite(userId);
        setCampaigns([{ ...myCampaign, inviteToken: resp.invite_token, inviter: user }]);
      } catch (err) {
        console.error("Erro ao gerar token:", err);
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
    fetchCampaigns();
  }, []);

  // Regenera convite
  const handleGenerateInvite = async (campaignId: string) => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user?.id ?? user?.ID ?? undefined;
      if (!userId) {
        toast.error("Usuário não encontrado");
        return;
      }

      const response = await inviteService.generateInvite(userId);
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, inviteToken: response.invite_token, inviter: user } : c
      ));
      toast.success("Link gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar link de convite");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Copiar link para área de transferência
  const handleCopyLink = (campaignId: string, inviteToken?: string) => {
    if (!inviteToken) return toast.error("Nenhum link disponível. Gere o convite primeiro.");
    navigator.clipboard.writeText(inviteToken);
    setCopiedMap(prev => ({ ...prev, [campaignId]: true }));
    setTimeout(() => setCopiedMap(prev => ({ ...prev, [campaignId]: false })), 2000);
    toast.success("Link copiado para a área de transferência!");
  };

  // Compartilhar no WhatsApp
  const handleShareWhatsApp = (campaign: any) => {
    if (!campaign.inviteToken) return toast.error("Nenhum link disponível. Gere o convite primeiro.");
    const inviteText = `Olá! ${campaign.inviter?.name || ''} está te convidando para participar da campanha ${campaign.name}. Clique no link para participar!`;
    const encodedText = encodeURIComponent(`${inviteText}\n\n${campaign.inviteToken}`);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="flex h-screen">
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
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-8 pt-15">
          <ToastContainer position="top-right" autoClose={4000} />

          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Gerenciar Convites
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Gere e compartilhe convites para suas campanhas
              </p>
            </header>

            <div className="space-y-6">
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <div key={campaign.id} className={`w-full md:w-lg rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {/* Cabeçalho do Card */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-6">
                        <div className="relative group">
                          <img src={campaign.logo} alt={campaign.name} className="w-32 h-32 object-cover rounded-lg shadow-md transition-transform group-hover:scale-105" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">{campaign.name}</h2>
                          <p className="mt-2 text-gray-600 dark:text-gray-400">{campaign.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Corpo do Card */}
                    <div className="p-6 space-y-4">
                      {/* Input do link */}
                      {/* <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Link do Convite</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={campaign.inviteToken || ''}
                            readOnly
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                          />
                          <button
                            onClick={() => handleCopyLink(campaign.id, campaign.inviteToken)}
                            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Copiar link"
                          >
                            {copiedMap[campaign.id] ? <CheckCheck className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                          </button>
                        </div>
                      </div> */}

                      {/* QR Code */}
                      {campaign.inviteToken && (
                        <div className="flex flex-col justify-center items-center mt-4">
                          <label className="block text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Escaneie o QRCode para o seu link de convite</label>
                          <QRCode
                            value={campaign.inviteToken}
                            size={250}
                            bgColor={darkMode ? "#1F2937" : "#ffffff"}
                            fgColor={darkMode ? "#ffffff" : "#000000"}
                          />
                        </div>
                      )}

                      {/* Botões */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={() => handleShareWhatsApp(campaign)}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white bg-green-500"
                        >
                          <Share className="w-5 h-5" /> Compartilhar no WhatsApp
                        </button>

                        <button
                          onClick={() => handleGenerateInvite(campaign.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                        >
                          {campaign.inviteToken ? 'Regenerar Link' : 'Gerar Link'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                  <p className="text-gray-600 dark:text-gray-400">Você ainda não criou nenhuma campanha.</p>
                  <button onClick={() => window.location.href = '/campaign'} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Criar Campanha</button>
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
