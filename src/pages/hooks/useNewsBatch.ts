// src/hooks/useNewsBatch.ts
import { useState } from 'react';
import { useNews } from './useNews';

export const useNewsBatch = () => {
  const { news, deleteNews, loading } = useNews();
  const [batchOperation, setBatchOperation] = useState({
    loading: false,
    error: null as string | null
  });

  const deleteMultipleNews = async (newsIds: string[]): Promise<{ success: string[], failed: string[] }> => {
    setBatchOperation({ loading: true, error: null });
    
    const results = {
      success: [] as string[],
      failed: [] as string[]
    };

    try {
      for (const newsId of newsIds) {
        try {
          const success = await deleteNews(newsId);
          if (success) {
            results.success.push(newsId);
          } else {
            results.failed.push(newsId);
          }
        } catch (error) {
          results.failed.push(newsId);
        }
      }
    } finally {
      setBatchOperation({ loading: false, error: null });
    }

    return results;
  };

  const toggleNewsVisibility = async (newsIds: string[], visible: boolean) => {
    // Implementar se necessário no futuro
    console.log('Toggle visibility:', newsIds, visible);
  };

  return {
    news,
    deleteMultipleNews,
    toggleNewsVisibility,
    loading: loading || batchOperation.loading,
    error: batchOperation.error
  };
};