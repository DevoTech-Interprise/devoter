// src/pages/News/NewsForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  Eye,
  EyeOff,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNews } from '../../pages/hooks/useNews';
import { useUser } from '../../context/UserContext';
import { TinyMCEEditor } from '../../components/TinyMCEEditor';
import { newsSchema, type NewsFormData } from '../../schemas/news';
import { campaignService, type Campaign } from '../../services/campaignService';
import Sidebar from '../../components/Sidebar';

export const NewsForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { darkMode, colors } = useTheme();
  const { user } = useUser();
  const { 
    createNews, 
    updateNews, 
    getNewsById, 
    loading, 
    error,
    clearError 
  } = useNews();

  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentNews, setCurrentNews] = useState<any>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  const isEditing = !!id;

  const getDefaultCampaignId = (): string | undefined => {
    return user?.campaign_id || undefined;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    formState
  } = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: '',
      preview: '',
      content: '',
      image: undefined,
      campaign_id: getDefaultCampaignId()
    }
  });

  const watchedTitle = watch('title');
  const watchedPreview = watch('preview');
  const watchedCampaignId = watch('campaign_id');

  // Carregar campanhas do usuário
  useEffect(() => {
    const loadUserCampaigns = async () => {
      if (!user) return;

      setIsLoadingCampaigns(true);
      try {
        const userCampaigns = await campaignService.getMyCampaigns(user.id, user.role);
        setCampaigns(userCampaigns);
        
        console.log(`Carregadas ${userCampaigns.length} campanhas para o usuário ${user.name} (${user.role})`);
        
        // Se for edição e ainda não carregou a notícia, mas temos campanhas,
        // podemos tentar pré-selecionar baseado no user.campaign_id
        if (!isEditing && user.campaign_id) {
          const userActiveCampaign = userCampaigns.find(camp => 
            String(camp.id) === String(user.campaign_id)
          );
          if (userActiveCampaign) {
            setValue('campaign_id', String(userActiveCampaign.id));
          }
        }
      } catch (err) {
        console.error('Erro ao carregar campanhas:', err);
        toast.error('Erro ao carregar lista de campanhas');
      } finally {
        setIsLoadingCampaigns(false);
      }
    };

    loadUserCampaigns();
  }, [user, isEditing, setValue]);

  // Carregar notícia se estiver editando
  useEffect(() => {
    if (id && !currentNews) {
      const loadNews = async () => {
        try {
          const newsItem = await getNewsById(id);
          if (newsItem) {
            setCurrentNews(newsItem);
            setEditorContent(newsItem.content || '');
            
            // Apenas set valores básicos, sem usar reset completo
            setValue('title', newsItem.title);
            setValue('preview', newsItem.preview);
            setValue('content', newsItem.content);
            
            // Definir a campanha - se a notícia tiver campaign_id, usar ela,
            // senão usar a campanha ativa do usuário
            if (newsItem.campaign_id) {
              setValue('campaign_id', String(newsItem.campaign_id));
            } else if (user?.campaign_id) {
              setValue('campaign_id', user.campaign_id);
            } else {
              setValue('campaign_id', '');
            }
            
            if (newsItem.image) {
              setImagePreview(newsItem.image);
            }
          }
        } catch (err) {
          toast.error('Erro ao carregar notícia');
          navigate('/news');
        }
      };

      loadNews();
    }
  }, [id, getNewsById, navigate, currentNews, setValue, user]);

  // Limpar erro quando o componente desmontar
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Atualizar o valor do content no react-hook-form quando editorContent mudar
  useEffect(() => {
    setValue('content', editorContent, { shouldValidate: true });
  }, [editorContent, setValue]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.');
        return;
      }

      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB.');
        return;
      }

      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      setValue('image', file, { shouldValidate: true });
      
      // Limpar o input file para permitir selecionar o mesmo arquivo novamente
      event.target.value = '';
    }
  };

  const handleContentChange = (content: string) => {
    setEditorContent(content);
  };

  // Função para sanitizar e processar o conteúdo HTML (igual ao NewsDetail)
  const getSanitizedContent = (content: string) => {
    if (!content) return '';

    console.log('🔍 Conteúdo original no preview:', {
      content: content.substring(0, 200) + '...',
      hasHTML: content.includes('<'),
      hasPTags: content.includes('<p'),
      hasImgTags: content.includes('<img')
    });

    // Sanitiza o conteúdo HTML
    const sanitized = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'span', 'div',
        'img', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: [
        'class', 'style', 'src', 'alt', 'href', 'target', 'rel', 'width', 'height',
        'data-start', 'data-end', 'data-testid'
      ],
      ALLOW_DATA_ATTR: true
    });

    console.log('✅ Conteúdo sanitizado no preview:', {
      sanitized: sanitized.substring(0, 200) + '...',
      length: sanitized.length
    });

    return sanitized;
  };

  const onSubmit = async (data: NewsFormData) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    console.log('Dados do formulário:', data);
    console.log('Conteúdo do editor:', editorContent);

    // Verificar se o conteúdo está vazio
    if (!editorContent || editorContent.replace(/<[^>]*>/g, '').trim().length === 0) {
      toast.error('O conteúdo da notícia é obrigatório');
      return;
    }

    // Combinar dados do formulário com conteúdo do editor
    const finalData = {
      ...data,
      content: editorContent
    };

    console.log('Dados finais enviados:', finalData);

    setIsSubmitting(true);
    clearError();

    try {
      let success: boolean;

      if (isEditing) {
        console.log('Atualizando notícia:', id);
        success = await updateNews(id!, finalData);
        if (success) {
          toast.success('Notícia atualizada com sucesso!');
        } else {
          throw new Error('Falha ao atualizar notícia');
        }
      } else {
        console.log('Criando nova notícia');
        success = await createNews(finalData);
        if (success) {
          toast.success('Notícia criada com sucesso!');
        } else {
          throw new Error('Falha ao criar notícia');
        }
      }

      if (success) {
        navigate('/news');
      }
    } catch (err: any) {
      console.error('Erro ao salvar notícia:', err);
      toast.error(err.message || 'Erro ao salvar notícia');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Tem certeza que deseja cancelar? As alterações não salvas serão perdidas.')) {
      navigate('/news');
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setImageFile(null);
    setValue('image', undefined);
  };

  // Função para debug - verificar se o botão está funcionando
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Botão clicado!');
    console.log('FormState isValid:', formState.isValid);
    console.log('FormState errors:', formState.errors);
    console.log('Editor content:', editorContent);
    
    // Disparar validação manualmente
    trigger().then(isValid => {
      console.log('Validação result:', isValid);
      if (isValid) {
        handleSubmit(onSubmit)();
      } else {
        toast.error('Por favor, preencha todos os campos obrigatórios corretamente.');
      }
    });
  };

  // Obter campanha selecionada para mostrar informações
  const selectedCampaign = watchedCampaignId ? 
    campaigns.find(camp => String(camp.id) === String(watchedCampaignId)) : null;

  // Preview da notícia - CORRIGIDO para usar a mesma formatação do NewsDetail
  const renderPreview = () => (
    <div className={`rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} mb-6`}>
      {imagePreview && (
        <div className="relative">
          <img
            src={imagePreview}
            alt={watchedTitle || 'Preview da Notícia'}
            className="w-full h-64 lg:h-80 object-cover"
          />

          {selectedCampaign && (
            <div className="absolute top-4 left-4">
              <div className="flex items-center space-x-2 bg-black bg-opacity-70 rounded-full px-3 py-2 backdrop-blur-sm border border-white border-opacity-20">
                {selectedCampaign.logo && (
                  <img
                    src={selectedCampaign.logo}
                    alt={selectedCampaign.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                )}
                <span className="text-white text-sm font-medium">
                  {selectedCampaign.name}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-6 lg:p-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          {watchedTitle || 'Título da Notícia'}
        </h1>

        {watchedPreview && (
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {watchedPreview}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{new Date().toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>

          <div className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            <span>{user?.name || 'Autor'}</span>
          </div>
        </div>

        {/* Conteúdo com sanitização - IGUAL AO NEWSDETAIL */}
        <div className="news-content-container mb-6">
          {editorContent ? (
            <div
              className="news-content prose prose-lg max-w-none dark:prose-invert text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{
                __html: getSanitizedContent(editorContent)
              }}
            />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              Conteúdo não disponível.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-gray-200 dark:border-gray-700 gap-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <span className="font-medium">0</span>
              <span className="text-sm">Curtidas</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <span className="font-medium">0</span>
              <span className="text-sm">Comentários</span>
            </div>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-right">
            Preview • {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  );

  if (isEditing && !currentNews && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Notícia não encontrada</p>
          <button 
            onClick={() => navigate('/news')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm sm:text-base"
          >
            Voltar para Notícias
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar/>
      
      {/* Main Content */}
      <div className="flex-1"> 
        <div className="py-15 lg:py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            {/* Header */}
            <div className="mb-4 lg:mb-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate('/news')}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                      {isEditing ? 'Editar Notícia' : 'Nova Notícia'}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 truncate">
                      {isEditing ? 'Atualize os dados da notícia' : 'Crie uma nova notícia para compartilhar'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-start sm:justify-end space-x-2 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center px-3 sm:px-4 py-2 rounded-lg border transition-colors flex-shrink-0 text-sm sm:text-base ${
                      darkMode 
                        ? 'border-gray-600 hover:bg-gray-800 text-gray-300' 
                        : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {showPreview ? <EyeOff className="w-4 h-4 sm:mr-2" /> : <Eye className="w-4 h-4 sm:mr-2" />}
                    <span className="hidden sm:inline">
                      {showPreview ? 'Editar' : 'Visualizar'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className={`px-3 sm:px-4 py-2 rounded-lg border transition-colors flex-shrink-0 text-sm sm:text-base ${
                      darkMode 
                        ? 'border-gray-600 hover:bg-gray-800 text-gray-300' 
                        : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="hidden sm:inline">Cancelar</span>
                    <span className="sm:hidden">Cancelar</span>
                  </button>

                  <button
                    onClick={handleButtonClick}
                    disabled={isSubmitting || loading}
                    className="flex items-center px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 text-sm sm:text-base"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Save className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">
                      {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Publicar'}
                    </span>
                    <span className="sm:hidden">
                      {isSubmitting ? '...' : isEditing ? 'Atualizar' : 'Publicar'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 lg:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm sm:text-base">{error}</p>
              </div>
            )}

            {/* Layout para formulário e preview lado a lado */}
            {!showPreview ? (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* Formulário - Ocupa 2/3 da largura */}
                <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                  {/* Título */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                      Título da Notícia *
                    </label>
                    <input
                      id="title"
                      type="text"
                      {...register('title')}
                      placeholder="Digite o título da notícia..."
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent text-sm sm:text-base ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                      } ${errors.title ? 'border-red-500' : ''}`}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Preview */}
                  <div>
                    <label htmlFor="preview" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                      Preview/Resumo *
                    </label>
                    <textarea
                      id="preview"
                      {...register('preview')}
                      placeholder="Digite um resumo curto da notícia (aparece na lista)..."
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent text-sm sm:text-base ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                      } ${errors.preview ? 'border-red-500' : ''}`}
                    />
                    {errors.preview && (
                      <p className="mt-1 text-sm text-red-500">{errors.preview.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Este texto aparecerá como resumo na lista de notícias. Máximo 500 caracteres.
                    </p>
                  </div>

                  {/* Imagem */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                      Imagem de Capa
                    </label>
                    
                    {/* Upload de arquivo */}
                    <div className="mb-3">
                      <label className={`flex flex-col items-center justify-center w-full h-24 sm:h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        darkMode
                          ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                          : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                      }`}>
                        <div className="flex flex-col items-center justify-center pt-4 pb-5 sm:pt-5 sm:pb-6">
                          <Upload className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 text-gray-400" />
                          <p className="mb-1 sm:mb-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center px-2">
                            <span className="font-semibold">Clique para upload</span> ou arraste e solte
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">
                            PNG, JPG, WebP (MAX. 5MB)
                          </p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>

                    {errors.image && (
                      <p className="mt-1 text-sm text-red-500">{errors.image.message}</p>
                    )}

                    {/* Preview da imagem */}
                    {imagePreview && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                          Preview da Imagem:
                        </p>
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-32 sm:h-48 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 text-sm"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Campanha (apenas para super users) - AGORA É UM SELECT */}
                  {user?.role === 'super' && (
                    <div>
                      <label htmlFor="campaign_id" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                        Campanha
                      </label>
                      
                      {isLoadingCampaigns ? (
                        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span className="text-sm">Carregando campanhas...</span>
                        </div>
                      ) : (
                        <select
                          id="campaign_id"
                          {...register('campaign_id')}
                          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent text-sm sm:text-base ${
                            darkMode
                              ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500'
                              : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                          }`}
                        >
                          <option value="">Notícia Global (sem campanha específica)</option>
                          {campaigns.map((campaign) => (
                            <option 
                              key={campaign.id} 
                              value={campaign.id}
                              selected={user?.campaign_id === String(campaign.id)}
                            >
                              {campaign.name}
                              {user?.campaign_id === String(campaign.id) && ' (Minha Campanha)'}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {user?.role === 'super' 
                          ? 'Selecione uma campanha ou deixe em branco para notícia global' 
                          : 'Notícia vinculada à sua campanha atual'}
                      </p>

                      {/* Informações da campanha selecionada */}
                      {selectedCampaign && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-2">
                            {selectedCampaign.logo && (
                              <img 
                                src={selectedCampaign.logo} 
                                alt={selectedCampaign.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {selectedCampaign.name}
                              </p>
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                {selectedCampaign.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Para usuários não-super, mostrar campanha fixa */}
                  {user?.role !== 'super' && user?.campaign_id && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                        Campanha
                      </label>
                      <div className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {selectedCampaign?.name || 'Carregando...'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Notícia vinculada à sua campanha atual
                        </p>
                        <input 
                          type="hidden" 
                          {...register('campaign_id')} 
                          value={user.campaign_id}
                        />
                      </div>
                    </div>
                  )}

                  {/* Conteúdo - Editor em largura total */}
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                      Conteúdo da Notícia *
                    </label>
                    <div className="w-full border rounded-lg overflow-hidden">
                      <TinyMCEEditor
                        value={editorContent}
                        onChange={handleContentChange}
                        height={400}
                      />
                    </div>
                    {(!editorContent || editorContent.replace(/<[^>]*>/g, '').trim().length === 0) && (
                      <p className="mt-1 text-sm text-red-500">
                        O conteúdo da notícia é obrigatório
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Use o editor para formatar seu texto. Mínimo 1 caractere.
                    </p>
                  </div>
                </div>

                {/* Informações - Ocupa 1/3 da largura */}
                <div className="space-y-4 sm:space-y-6">
                  <div className={`rounded-lg border p-4 sm:p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">
                      📝 Dicas para uma boa notícia
                    </h3>
                    <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      <li>• Escreva um título claro e atraente</li>
                      <li>• Use imagens de alta qualidade</li>
                      <li>• Preview deve ser um resumo curto e impactante</li>
                      <li>• Estruture o conteúdo com parágrafos curtos</li>
                      <li>• Use negrito e itálico para ênfase</li>
                      <li>• Inclua chamadas para ação quando apropriado</li>
                      <li>• Revise o texto antes de publicar</li>
                    </ul>

                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="font-medium mb-2 text-gray-900 dark:text-white text-sm sm:text-base">
                        Informações do Autor
                      </h4>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs sm:text-sm font-semibold">
                            {user?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user?.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.role} • {selectedCampaign?.name || user?.campaign_id || 'Campanha não definida'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas Rápidas */}
                  <div className={`rounded-lg border p-4 sm:p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h4 className="font-medium mb-3 sm:mb-4 text-gray-900 dark:text-white text-sm sm:text-base">
                      📊 Estatísticas
                    </h4>
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Título:</span>
                        <span className="font-medium text-gray-600 dark:text-gray-400">{watchedTitle?.length || 0}/200</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Preview:</span>
                        <span className="font-medium text-gray-600 dark:text-gray-400">{watchedPreview?.length || 0}/500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Conteúdo:</span>
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          {editorContent?.replace(/<[^>]*>/g, '').length || 0} chars
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Imagem:</span>
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          {imageFile || imagePreview ? '✓ Adicionada' : '✗ Não adicionada'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Campanha:</span>
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          {selectedCampaign ? selectedCampaign.name : 'Global'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Preview em tela cheia - CORRIGIDO */
              <div className="w-full">
                <div className="max-w-4xl mx-auto">
                  {renderPreview()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};