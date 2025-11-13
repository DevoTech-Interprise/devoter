// src/pages/News/NewsForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  Image as ImageIcon,
  Eye,
  EyeOff,
  Calendar,
  User
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNews } from '../../pages/hooks/useNews';
import { useUser } from '../../context/UserContext';
import { TinyMCEEditor } from '../../components/TinyMCEEditor';
import { newsSchema, type NewsFormData } from '../../schemas/news';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentNews, setCurrentNews] = useState<any>(null);

  const isEditing = !!id;

  // Corrigir o campaign_id para string | undefined
  const getDefaultCampaignId = (): string | undefined => {
    return user?.campaign_id || undefined;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: '',
      body: '',
      image: '',
      campaign_id: getDefaultCampaignId()
    }
  });

  const watchedImage = watch('image');
  const watchedBody = watch('body');
  const watchedTitle = watch('title');

  // Carregar notícia se estiver editando
  useEffect(() => {
    if (id) {
      const loadNews = async () => {
        try {
          const newsItem = await getNewsById(id);
          if (newsItem) {
            setCurrentNews(newsItem);
            reset({
              title: newsItem.title,
              body: newsItem.body,
              image: newsItem.image,
              // Corrigir o campaign_id para string | undefined
              campaign_id: newsItem.campaign_id ? String(newsItem.campaign_id) : undefined
            });
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
  }, [id, getNewsById, reset, navigate]);

  // Atualizar image preview quando a URL da imagem mudar
  useEffect(() => {
    if (watchedImage) {
      setImagePreview(watchedImage);
    }
  }, [watchedImage]);

  // Limpar erro quando o componente desmontar ou quando navegar
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Em uma implementação real, você faria upload para um servidor
      // Aqui estamos apenas criando uma URL local para preview
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      setValue('image', imageUrl);
    }
  };

  const handleBodyChange = (content: string) => {
    setValue('body', content, { shouldValidate: true });
  };

  const onSubmit = async (data: NewsFormData) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      let success: boolean;

      if (isEditing) {
        success = await updateNews(id!, data);
        if (success) {
          toast.success('Notícia atualizada com sucesso!');
        } else {
          throw new Error('Falha ao atualizar notícia');
        }
      } else {
        success = await createNews(data);
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

  // Preview da notícia
  const renderPreview = () => (
    <div className={`rounded-lg border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        {watchedTitle || 'Título da Notícia'}
      </h2>
      
      {imagePreview && (
        <div className="mb-4">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}

      <div 
        className="prose prose-lg max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: watchedBody || '<p>Conteúdo da notícia...</p>' }}
      />

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              <span>{user?.name || 'Autor'}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isEditing && !currentNews && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg">Notícia não encontrada</p>
          <button 
            onClick={() => navigate('/news')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Voltar para Notícias
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 ">
      {/* Sidebar */}
      <Sidebar/>
      
      {/* Main Content */}
      <div className="flex-1 "> 
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                            
                  <button
                    onClick={() => navigate('/news')}
                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {isEditing ? 'Editar Notícia' : 'Nova Notícia'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {isEditing ? 'Atualize os dados da notícia' : 'Crie uma nova notícia para compartilhar'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'border-gray-600 hover:bg-gray-800 text-gray-300' 
                        : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showPreview ? 'Editar' : 'Visualizar'}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'border-gray-600 hover:bg-gray-800 text-gray-300' 
                        : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting || loading}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Publicar'}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Layout para formulário e preview lado a lado */}
            {!showPreview ? (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Formulário - Ocupa 2/3 da largura */}
                <div className="xl:col-span-2 space-y-6">
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
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                      } ${errors.title ? 'border-red-500' : ''}`}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Imagem */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                      Imagem de Capa
                    </label>
                    
                    {/* Upload de arquivo */}
                    <div className="mb-3">
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        darkMode
                          ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                          : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                      }`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Clique para upload</span> ou arraste e solte
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG, GIF (MAX. 5MB)
                          </p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>

                    {/* URL da imagem */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ImageIcon className="text-gray-400 w-5 h-5" />
                      </div>
                      <input
                        type="url"
                        {...register('image')}
                        placeholder="Ou cole a URL da imagem..."
                        className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${
                          darkMode
                            ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                        } ${errors.image ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.image && (
                      <p className="mt-1 text-sm text-red-500">{errors.image.message}</p>
                    )}

                    {/* Preview da imagem */}
                    {imagePreview && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                          Preview:
                        </p>
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview('');
                              setValue('image', '');
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Campanha (apenas para super users) */}
                  {user?.role === 'super' && (
                    <div>
                      <label htmlFor="campaign_id" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                        Campanha
                      </label>
                      <input
                        id="campaign_id"
                        type="text"
                        {...register('campaign_id')}
                        placeholder="ID da campanha (opcional)"
                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent ${
                          darkMode
                            ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                        }`}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Deixe em branco para notícia global
                      </p>
                    </div>
                  )}

                  {/* Conteúdo - Editor em largura total */}
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                      Conteúdo da Notícia *
                    </label>
                    <div className="w-full border rounded-lg overflow-hidden">
                      <TinyMCEEditor
                        value={watchedBody}
                        onChange={handleBodyChange}
                        height={500}
                      />
                    </div>
                    {errors.body && (
                      <p className="mt-1 text-sm text-red-500">{errors.body.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Use o editor para formatar seu texto. Mínimo 1 caractere.
                    </p>
                  </div>
                </div>

                {/* Informações - Ocupa 1/3 da largura */}
                <div className="space-y-6">
                  <div className={`rounded-lg border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                      📝 Dicas para uma boa notícia
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <li>• Escreva um título claro e atraente</li>
                      <li>• Use imagens de alta qualidade</li>
                      <li>• Estruture o conteúdo com parágrafos curtos</li>
                      <li>• Use negrito e itálico para ênfase</li>
                      <li>• Inclua chamadas para ação quando apropriado</li>
                      <li>• Revise o texto antes de publicar</li>
                    </ul>

                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
                        Informações do Autor
                      </h4>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {user?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user?.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.role} • {user?.campaign_id || 'Campanha não definida'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas Rápidas */}
                  <div className={`rounded-lg border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h4 className="font-medium mb-4 text-gray-900 dark:text-white">
                      📊 Estatísticas
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Título:</span>
                        <span className="font-medium text-gray600 dark:text-gray-400">{watchedTitle?.length || 0}/200</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Conteúdo:</span>
                        <span className="font-medium text-gray600 dark:text-gray-400">
                          {watchedBody?.replace(/<[^>]*>/g, '').length || 0} caracteres
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Imagem:</span>
                        <span className="font-medium text-gray600 dark:text-gray-400">
                          {watchedImage ? '✓ Adicionada' : '✗ Não adicionada'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Preview em tela cheia */
              <div className="w-full">
                {renderPreview()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};