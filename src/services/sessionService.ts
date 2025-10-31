export const sessionService = {
  // Inicializa ou atualiza o timestamp da última atividade e tempo de expiração
  updateLastActivity: (expiresIn?: number) => {
    const now = Date.now();
    localStorage.setItem('lastActivity', now.toString());
    
    // Se fornecido, atualiza também o tempo de expiração
    if (expiresIn) {
      const expirationTime = now + (expiresIn * 1000); // Converte segundos para milissegundos
      localStorage.setItem('sessionExpiration', expirationTime.toString());
    }
  },

  // Verifica se a sessão expirou
  isSessionExpired: () => {
    const expirationTime = localStorage.getItem('sessionExpiration');
    if (!expirationTime) return true;

    const now = Date.now();
    return now > parseInt(expirationTime);
  },

  // Limpa os dados da sessão
  clearSession: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('sessionExpiration');
  }
};