
import axios from 'axios';


const api = axios.create({
  baseURL: 'http://apiconecta.devotech.com.br/',
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Se a requisição que causou 401 for a de login, não faça redirecionamento
      // para evitar recarregar a página quando as credenciais estiverem incorretas.
      const requestUrl: string = error.config?.url || "";
      const isLoginRoute = /login$|\/auth\/login/i.test(requestUrl);

      if (!isLoginRoute) {
        // Remove token e redireciona apenas para 401s de outras rotas
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      // Caso seja 401 da rota de login, apenas continue e deixe o componente tratar o erro
    }
    return Promise.reject(error);
  }
);

export default api;

