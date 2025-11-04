
export interface State {
  id: number;
  nome: string;
  sigla: string;
}

export interface City {
  id: number;
  nome: string;
}

export interface Neighborhood {
  id: number;
  nome: string;
}

export const locationService = {
  // Buscar todos os estados do Brasil
  async getStates(): Promise<State[]> {
    try {
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
      const data = await response.json();
      return data
        .map((state: any) => ({
          id: state.id,
          nome: state.nome,
          sigla: state.sigla
        }))
        .sort((a: State, b: State) => a.nome.localeCompare(b.nome));
    } catch (error) {
      console.error('Erro ao buscar estados:', error);
      return [];
    }
  },

  // Buscar cidades por estado
  async getCitiesByState(stateId: number): Promise<City[]> {
    try {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios`);
      const data = await response.json();
      return data
        .map((city: any) => ({
          id: city.id,
          nome: city.nome
        }))
        .sort((a: City, b: City) => a.nome.localeCompare(b.nome));
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
      return [];
    }
  },

  // Buscar bairros por cidade (usando uma API alternativa)
  async getNeighborhoodsByCity(cityName: string, state: string): Promise<Neighborhood[]> {
    try {
      // API alternativa para bairros - você pode substituir por sua própria API
      const response = await fetch(`https://viacep.com.br/ws/${state}/${cityName}/bairros/`);
      const data = await response.json();
      
      if (data.erro) {
        return [];
      }
      
      return data
        .map((neighborhood: any, index: number) => ({
          id: index,
          nome: neighborhood.nome
        }))
        .sort((a: Neighborhood, b: Neighborhood) => a.nome.localeCompare(b.nome));
    } catch (error) {
      console.error('Erro ao buscar bairros:', error);
      return [];
    }
  },

  // Buscar CEP (opcional - para preenchimento automático)
  async getAddressByCEP(cep: string) {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        return null;
      }
      
      return {
        cep: data.cep,
        logradouro: data.logradouro,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf
      };
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  }
};