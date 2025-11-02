import api from './api';

export const userService = {
    // 🔹 Busca todos os usuários (opcional, se já existir)
    getAll: async () => {
        const { data } = await api.get('api/auth');
        return data;
    },

    // 🔹 Busca um usuário específico pelo ID
    getById: async (id: number | string) => {
        const { data } = await api.get(`api/auth/${id}`);
        return data;
    },

    // 🔹 Atualiza dados de um usuário (ex: campaign_id)
    update: async (id: number | string, payload: Record<string, any>) => {
        const { data } = await api.put(`api/auth/${id}`, payload);
        return data;
    },

    // 🔹 Cria novo usuário (caso precise)
    create: async (payload: Record<string, any>) => {
        const { data } = await api.post('api/auth', payload);
        return data;
    },

    // 🔹 Remove um usuário (opcional)
    delete: async (id: number | string) => {
        const { data } = await api.delete(`api/auth/${id}`);
        return data;
    },
};
