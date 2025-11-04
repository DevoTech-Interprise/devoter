// src/pages/networks/alcance.tsx
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Layers, Filter, Users, Navigation, MapPin, ZoomIn, Search } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { campaignService, type Campaign } from '../../services/campaignService';
import { userService, type User } from '../../services/userService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';

// Fix para ícones do Leaflet em React
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Interface para coordenadas geográficas
interface LocationCoordinates {
    coordinates: [number, number];
    bounds?: [[number, number], [number, number]]; // Área do bairro
    displayName: string;
}

// Cache para coordenadas já buscadas
const coordinatesCache = new Map<string, LocationCoordinates>();

// Função para buscar coordenadas usando Nominatim (OpenStreetMap)
const geocodeLocation = async (location: string): Promise<LocationCoordinates | null> => {
    // Verifica no cache primeiro
    const cacheKey = location.toLowerCase().trim();
    if (coordinatesCache.has(cacheKey)) {
        return coordinatesCache.get(cacheKey)!;
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1&countrycodes=br&addressdetails=1`
        );
        
        if (!response.ok) {
            throw new Error('Erro na requisição de geocoding');
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
            const result = data[0];
            const coordinates: LocationCoordinates = {
                coordinates: [parseFloat(result.lat), parseFloat(result.lon)],
                displayName: result.display_name
            };

            // Se for um bairro, tenta obter bounds mais precisos
            if (result.address?.suburb || result.address?.neighbourhood) {
                // Para bairros, usa um raio maior
                coordinates.bounds = [
                    [parseFloat(result.lat) - 0.01, parseFloat(result.lon) - 0.01],
                    [parseFloat(result.lat) + 0.01, parseFloat(result.lon) + 0.01]
                ];
            }

            // Salva no cache
            coordinatesCache.set(cacheKey, coordinates);
            
            console.log(`Geocoding encontrado para: ${location}`, coordinates);
            return coordinates;
        }

        console.log(`Nenhum resultado de geocoding para: ${location}`);
        return null;
    } catch (error) {
        console.error(`Erro no geocoding para ${location}:`, error);
        return null;
    }
};

// Função para normalizar nomes de localização
const normalizeLocationName = (name: string): string => {
    if (!name) return '';
    
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, ' ') // Remove espaços extras
        .trim();
};

// Interface para agrupar usuários por localização
interface UserGroup {
    coordinates: [number, number];
    bounds?: [[number, number], [number, number]];
    users: User[];
    locationName: string;
    normalizedName: string;
    displayName?: string;
    type: 'neighborhood' | 'city' | 'unknown';
}

const AlcancePage = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<string>('');
    const [networkUsers, setNetworkUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [geocodingLoading, setGeocodingLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>([-15.7797, -47.9297]);
    const [mapZoom, setMapZoom] = useState(4);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
    
    const mapRef = useRef<L.Map | null>(null);

    // Buscar campanhas
    const fetchCampaigns = async () => {
        try {
            const response = await campaignService.getAll() as any;
            const campaignsData: Campaign[] = Array.isArray(response)
                ? response
                : (response?.campaigns || []);

            setCampaigns(campaignsData);

            if (campaignsData.length > 0 && !selectedCampaign) {
                setSelectedCampaign(campaignsData[0].id.toString());
            }
        } catch (error) {
            console.error('Erro ao carregar campanhas:', error);
            toast.error('Erro ao carregar campanhas');
        }
    };

    // Buscar rede de usuários quando campanha for selecionada
    const fetchNetworkUsers = async (campaignId: string) => {
        try {
            setLoading(true);
            const users = await userService.getNetworkUsersByCampaign(campaignId);
            setNetworkUsers(users);

            // Processar geocoding em lote
            await processUserGeocoding(users);

        } catch (error) {
            console.error('Erro ao carregar rede:', error);
            toast.error('Erro ao carregar rede de usuários');
        } finally {
            setLoading(false);
        }
    };

    // Processar geocoding para todos os usuários
    const processUserGeocoding = async (users: User[]) => {
        setGeocodingLoading(true);
        
        try {
            // Agrupar usuários por localização primeiro
            const locationGroups = groupUsersByLocation(users);
            
            // Buscar coordenadas para cada localização única
            const groupsWithCoordinates: UserGroup[] = [];
            
            for (const group of locationGroups) {
                const locationQuery = buildLocationQuery(group);
                const geocodingResult = await geocodeLocation(locationQuery);
                
                if (geocodingResult) {
                    groupsWithCoordinates.push({
                        ...group,
                        coordinates: geocodingResult.coordinates,
                        bounds: geocodingResult.bounds,
                        displayName: geocodingResult.displayName
                    });
                } else {
                    // Se não encontrou, usa fallback para cidade
                    const cityQuery = group.users[0].city;
                    if (cityQuery) {
                        const cityGeocoding = await geocodeLocation(cityQuery);
                        if (cityGeocoding) {
                            groupsWithCoordinates.push({
                                ...group,
                                coordinates: cityGeocoding.coordinates,
                                bounds: cityGeocoding.bounds,
                                displayName: cityGeocoding.displayName,
                                type: 'city'
                            });
                        }
                    }
                }
            }

            setUserGroups(groupsWithCoordinates);

            if (groupsWithCoordinates.length > 0) {
                updateMapCenter(groupsWithCoordinates);
            } else {
                setMapCenter([-15.7797, -47.9297]);
                setMapZoom(4);
            }
        } catch (error) {
            console.error('Erro no processamento de geocoding:', error);
            toast.error('Erro ao processar localizações');
        } finally {
            setGeocodingLoading(false);
        }
    };

    // Construir query de localização otimizada
    const buildLocationQuery = (group: UserGroup): string => {
        const user = group.users[0];
        
        // Prioridade: Bairro + Cidade + Estado
        if (user.neighborhood && user.city && user.state) {
            return `${user.neighborhood}, ${user.city}, ${user.state}, Brasil`;
        }
        
        // Fallback: Bairro + Cidade
        if (user.neighborhood && user.city) {
            return `${user.neighborhood}, ${user.city}, Brasil`;
        }
        
        // Fallback: Cidade + Estado
        if (user.city && user.state) {
            return `${user.city}, ${user.state}, Brasil`;
        }
        
        // Último fallback: Apenas cidade
        if (user.city) {
            return `${user.city}, Brasil`;
        }
        
        return group.locationName;
    };

    // Agrupar usuários por localização
    const groupUsersByLocation = (users: User[]): UserGroup[] => {
        const groups: { [key: string]: UserGroup } = {};

        users.forEach(user => {
            if (!user.neighborhood && !user.city) return;

            // Cria uma chave única baseada na localização
            const locationKey = normalizeLocationName(
                user.neighborhood ? `${user.neighborhood}, ${user.city}` : user.city || ''
            );

            if (!locationKey) return;

            if (!groups[locationKey]) {
                groups[locationKey] = {
                    coordinates: [0, 0], // Será preenchido pelo geocoding
                    users: [],
                    locationName: user.neighborhood ? `${user.neighborhood}, ${user.city}` : user.city || 'Localização desconhecida',
                    normalizedName: locationKey,
                    type: user.neighborhood ? 'neighborhood' : 'city'
                };
            }
            
            groups[locationKey].users.push(user);
        });

        return Object.values(groups);
    };

    // Atualizar centro do mapa baseado na localização dos usuários
    const updateMapCenter = (groups: UserGroup[]) => {
        const groupsWithCoordinates = groups.filter(group => 
            group.coordinates[0] !== 0 && group.coordinates[1] !== 0
        );

        if (groupsWithCoordinates.length > 0) {
            const coordinates = groupsWithCoordinates.map(group => group.coordinates);

            const avgLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
            const avgLng = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;

            setMapCenter([avgLat, avgLng]);
            setMapZoom(groupsWithCoordinates.length === 1 ? 12 : 10);
        }
    };

    // Navegar para um usuário específico no mapa
    const focusOnUser = (user: User) => {
        const userGroup = userGroups.find(group => 
            group.users.some(u => u.id === user.id)
        );

        if (!userGroup) {
            toast.info('Usuário não possui localização definida');
            return;
        }

        setSelectedUser(user);
        setMapCenter(userGroup.coordinates);
        setMapZoom(14);

        if (mapRef.current) {
            mapRef.current.setView(userGroup.coordinates, 14);
        }
    };

    // Navegar para um grupo de usuários
    const focusOnGroup = (group: UserGroup) => {
        setSelectedUser(null);
        setMapCenter(group.coordinates);
        setMapZoom(group.type === 'neighborhood' ? 14 : 12);

        if (mapRef.current) {
            mapRef.current.setView(group.coordinates, group.type === 'neighborhood' ? 14 : 12);
        }
    };

    // Calcular raio baseado no tipo de localização
    const getRadiusForGroup = (group: UserGroup): number => {
        if (group.type === 'neighborhood') {
            return 500; // 1km para bairros
        }
        return 2000; // 2km para cidades
    };

    // Estatísticas da rede
    const getNetworkStats = () => {
        const neighborhoods = new Set(
            networkUsers
                .filter(user => user.neighborhood)
                .map(user => normalizeLocationName(user.neighborhood!))
        );

        const cities = new Set(
            networkUsers
                .filter(user => user.city)
                .map(user => normalizeLocationName(user.city!))
        );

        const states = new Set(
            networkUsers
                .filter(user => user.state)
                .map(user => user.state)
        );

        const usersWithLocation = networkUsers.filter(user =>
            user.neighborhood || user.city
        );

        return {
            totalUsers: networkUsers.length,
            neighborhoods: neighborhoods.size,
            cities: cities.size,
            states: states.size,
            usersWithLocation: usersWithLocation.length,
            coveragePercentage: networkUsers.length > 0 ?
                Math.round((usersWithLocation.length / networkUsers.length) * 100) : 0,
            userGroups: userGroups.length,
            geocodedGroups: userGroups.filter(group => group.coordinates[0] !== 0).length
        };
    };

    // Obter a campanha selecionada
    const getSelectedCampaign = (): Campaign | undefined => {
        return campaigns.find(campaign => campaign.id.toString() === selectedCampaign);
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    useEffect(() => {
        if (selectedCampaign) {
            fetchNetworkUsers(selectedCampaign);
        }
    }, [selectedCampaign]);

    const stats = getNetworkStats();
    const selectedCampaignData = getSelectedCampaign();

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="p-6">
                    <ToastContainer position="top-right" />

                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <header className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                                    <Navigation className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                                        Mapa de Alcance
                                    </h1>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                                        Visualize a influência geográfica da sua rede por campanha
                                    </p>
                                </div>
                            </div>

                            {/* Filtros */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-6">
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Campanha:
                                        </span>
                                    </div>

                                    <select
                                        value={selectedCampaign}
                                        onChange={(e) => setSelectedCampaign(e.target.value)}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="">Selecione uma campanha</option>
                                        {campaigns.map(campaign => (
                                            <option key={campaign.id} value={campaign.id}>
                                                {campaign.name}
                                            </option>
                                        ))}
                                    </select>

                                    {selectedCampaignData && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <MapPin className="w-4 h-4" />
                                            <span>{selectedCampaignData.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Estatísticas */}
                            {selectedCampaign && (
                                <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-6">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Total de Membros</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                {stats.totalUsers}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Bairros</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                {stats.neighborhoods}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Cidades</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                {stats.cities}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Estados</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                {stats.states}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Mapeados</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                {stats.usersWithLocation}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Cobertura</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                {stats.coveragePercentage}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Grupos</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                {stats.userGroups}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Geocodificados</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                {stats.geocodedGroups}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </header>

                        {/* Mapa */}
                        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                            {(loading || geocodingLoading) ? (
                                <div className="h-96 flex items-center justify-center">
                                    <div className="text-center">
                                        <Layers className="w-12 h-12 animate-pulse text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {geocodingLoading ? 'Buscando localizações...' : 'Carregando mapa...'}
                                        </p>
                                        {geocodingLoading && (
                                            <p className="text-sm text-gray-400 mt-2">
                                                Processando {userGroups.length} localizações
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : selectedCampaign ? (
                                <div className="h-96 relative">
                                    <MapContainer
                                        center={mapCenter}
                                        zoom={mapZoom}
                                        style={{ height: '100%', width: '100%' }}
                                        ref={mapRef}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        
                                        {userGroups.map((group, index) => (
                                            <div key={index}>
                                                {/* Área de influência baseada no tipo de localização */}
                                                <Circle
                                                    center={group.coordinates}
                                                    radius={getRadiusForGroup(group)}
                                                    pathOptions={{
                                                        fillColor: group.type === 'neighborhood' ? '#f59e0b' : '#10b981',
                                                        fillOpacity: 0.3,
                                                        color: group.type === 'neighborhood' ? '#d97706' : '#059669',
                                                        weight: 2,
                                                        opacity: 0.8
                                                    }}
                                                />
                                                
                                                {/* Marcador do grupo */}
                                                <Marker position={group.coordinates}>
                                                    <Popup>
                                                        <div className="p-2 min-w-[250px]">
                                                            <h3 className="font-semibold text-gray-900 mb-2">
                                                                {group.locationName}
                                                            </h3>
                                                            {group.displayName && (
                                                                <p className="text-xs text-gray-500 mb-2">
                                                                    {group.displayName}
                                                                </p>
                                                            )}
                                                            <p className="text-sm text-gray-600 mb-3">
                                                                <strong>{group.users.length}</strong> usuário(s) nesta {group.type === 'neighborhood' ? 'bairro' : 'cidade'}
                                                            </p>
                                                            <div className="max-h-40 overflow-y-auto">
                                                                {group.users.map(user => (
                                                                    <div key={user.id} className="py-2 border-b border-gray-200 last:border-b-0">
                                                                        <p className="font-medium text-gray-900">{user.name}</p>
                                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                                        <p className="text-xs text-gray-500">{user.phone}</p>
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                                                                user.role === 'admin' 
                                                                                    ? 'bg-yellow-100 text-yellow-800' 
                                                                                    : 'bg-blue-100 text-blue-800'
                                                                            }`}>
                                                                                {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <button
                                                                onClick={() => focusOnGroup(group)}
                                                                className="w-full mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                                            >
                                                                Focar no {group.type === 'neighborhood' ? 'Bairro' : 'Cidade'}
                                                            </button>
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            </div>
                                        ))}

                                        {/* Marcador especial para usuário selecionado */}
                                        {selectedUser && (
                                            <Circle
                                                center={userGroups.find(g => g.users.some(u => u.id === selectedUser.id))?.coordinates || mapCenter}
                                                radius={100}
                                                pathOptions={{
                                                    fillColor: '#ef4444',
                                                    fillOpacity: 0.3,
                                                    color: '#dc2626',
                                                    weight: 3,
                                                    opacity: 0.8
                                                }}
                                            />
                                        )}
                                    </MapContainer>
                                    
                                    {/* Indicador de usuário selecionado */}
                                    {selectedUser && (
                                        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-600 z-[1000]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Visualizando: <strong>{selectedUser.name}</strong>
                                                </span>
                                                <button
                                                    onClick={() => setSelectedUser(null)}
                                                    className="ml-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-96 flex items-center justify-center">
                                    <div className="text-center">
                                        <Navigation className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Selecione uma campanha para visualizar o mapa de alcance
                                        </p>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Lista de Usuários */}
                        {selectedCampaign && networkUsers.length > 0 && (
                            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Membros da Rede ({networkUsers.length})
                                    </h3>
                                </div>

                                <div className="max-h-96 overflow-y-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Usuário
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Localização
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Ação
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                            {networkUsers.map((user) => {
                                                const userGroup = userGroups.find(group => 
                                                    group.users.some(u => u.id === user.id)
                                                );
                                                const hasLocation = !!userGroup;
                                                const usersInSameLocation = userGroup ? userGroup.users.length : 0;

                                                return (
                                                    <tr 
                                                        key={user.id} 
                                                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                                            selectedUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {user.neighborhood || user.city ? (
                                                                <div>
                                                                    <p className="text-gray-900 dark:text-white">
                                                                        {user.neighborhood || user.city}
                                                                        {hasLocation && (
                                                                            <span className="ml-2 text-green-500">●</span>
                                                                        )}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                        {user.city && user.neighborhood && user.city !== user.neighborhood && `${user.city}`}
                                                                        {user.state && ` - ${user.state}`}
                                                                        {usersInSameLocation > 1 && (
                                                                            <span className="ml-2 text-orange-500">
                                                                                (+{usersInSameLocation - 1} outros)
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 dark:text-gray-500 text-sm">
                                                                    Localização não informada
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                hasLocation 
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                            }`}>
                                                                {hasLocation ? 'Mapeado' : 'Sem coordenadas'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {hasLocation && (
                                                                <button
                                                                    onClick={() => focusOnUser(user)}
                                                                    className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                                >
                                                                    <ZoomIn className="w-3 h-3" />
                                                                    Ver no mapa
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlcancePage;