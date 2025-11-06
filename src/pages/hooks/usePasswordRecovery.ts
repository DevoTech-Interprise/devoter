// src/hooks/usePasswordRecovery.ts
import { useState, useEffect } from 'react';
import { passwordRecoveryService } from '../../services/passwordRecoveryService';

export const usePasswordRecovery = () => {
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(true);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  useEffect(() => {
    const initializeRecovery = async () => {
      try {
        setRecoveryLoading(true);
        
        // Pré-carrega o token para recovery
        await passwordRecoveryService.getRecoveryToken();
        
        setRecoveryReady(true);
        setRecoveryError(null);
      } catch (err: any) {
        setRecoveryError(err.message);
        setRecoveryReady(false);
      } finally {
        setRecoveryLoading(false);
      }
    };

    initializeRecovery();
  }, []);

  const refreshRecoveryToken = async () => {
    try {
      setRecoveryLoading(true);
      await passwordRecoveryService.getRecoveryToken();
      setRecoveryReady(true);
      setRecoveryError(null);
    } catch (err: any) {
      setRecoveryError(err.message);
      setRecoveryReady(false);
      throw err;
    } finally {
      setRecoveryLoading(false);
    }
  };

  return {
    recoveryReady,
    recoveryLoading,
    recoveryError,
    refreshRecoveryToken
  };
};