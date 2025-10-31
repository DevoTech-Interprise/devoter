import { Share, Loader2, Copy, CheckCheck } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { inviteService } from "../../services/inviteService";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Sidebar from "../../components/Sidebar";

const Invites = () => {
  const { darkMode } = useTheme();
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const generateInviteLink = async () => {
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
      toast.error("Erro ao gerar convite");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInviteLink();
  }, []);

  const handleShareWhatsApp = () => {
    if (!inviteLink || !campaign) return;

    const inviteText = `Olá! ${campaign.inviter.name} está te convidando para participar da campanha ${campaign.campaign.name}. Clique no link para participar!`;
    const encodedText = encodeURIComponent(`${inviteText}\n\n${inviteLink}`);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleRegenerateLink = () => {
    generateInviteLink();
    toast.info("Gerando novo link de convite...");
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Gerenciar Convites
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Compartilhe convites para sua campanha com novos membros
              </p>
            </header>

            <div className={`rounded-xl shadow-lg overflow-hidden ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}>
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                </div>
              ) : campaign ? (
                <div>
                  {/* Campaign Info Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-6">
                      <div className="relative group">
                        <img 
                          src={campaign.campaign.logo} 
                          alt={campaign.campaign.name}
                          className="w-32 h-32 object-cover rounded-lg shadow-md transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      <div className="flex-1">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                          {campaign.campaign.name}
                        </h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                          {campaign.campaign.description}
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                          <span className="px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            Criador: {campaign.inviter.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Share Actions */}
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Link Display */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Link do Convite
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={inviteLink}
                              readOnly
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <button
                            onClick={handleCopyLink}
                            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Copiar link"
                          >
                            {copied ? (
                              <CheckCheck className="w-5 h-5 text-green-500" />
                            ) : (
                              <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={handleShareWhatsApp}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white transition-colors"
                          style={{
                            backgroundColor: campaign.campaign.color_primary,
                          }}
                        >
                          <Share className="w-5 h-5" />
                          Compartilhar no WhatsApp
                        </button>
                        
                        <button
                          onClick={handleRegenerateLink}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                        >
                          Gerar Novo Link
                        </button>
                      </div>

                      {/* Help Text */}
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        O link do convite é válido por 24 horas. Após esse período, 
                        você precisará gerar um novo link.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Não foi possível carregar as informações da campanha.
                  </p>
                  <button
                    onClick={generateInviteLink}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Tentar Novamente
                  </button>
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