import axios from 'axios';

const api = axios.create({
  baseURL: '/endless/api',
});

export interface ListResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface Race {
  _id: string;
  name: string;
  description?: string;
  parentRace?: string;
}

export interface Creature {
  _id: string;
  name: string;
  raceId: string;
  level: number;
  description?: string;
}

export interface MaterialType {
  _id: string;
  name: string;
  description?: string;
}

export interface Material {
  _id: string;
  name: string;
  typeId: string;
  level: number;
  description?: string;
}

export interface Potion {
  _id: string;
  name: string;
  effectType: string;
  description?: string;
}

export const raceApi = {
  list: (params: { name?: string; parentRace?: string; page?: number; limit?: number }) =>
    api.get<ListResponse<Race>>('/races', { params }),
  create: (data: Omit<Race, '_id'>) => api.post<Race>('/races', data),
  update: (id: string, data: Partial<Race>) => api.put<Race>(`/races/${id}`, data),
  delete: (id: string) => api.delete<Race>(`/races/${id}`),
};

export const creatureApi = {
  list: (params: { name?: string; raceId?: string; level?: number; page?: number; limit?: number }) =>
    api.get<ListResponse<Creature>>('/creatures', { params }),
  create: (data: Omit<Creature, '_id'>) => api.post<Creature>('/creatures', data),
  update: (id: string, data: Partial<Creature>) => api.put<Creature>(`/creatures/${id}`, data),
  delete: (id: string) => api.delete<Creature>(`/creatures/${id}`),
};

export const materialTypeApi = {
  list: (params: { name?: string; page?: number; limit?: number }) =>
    api.get<ListResponse<MaterialType>>('/material-types', { params }),
  create: (data: Omit<MaterialType, '_id'>) => api.post<MaterialType>('/material-types', data),
  update: (id: string, data: Partial<MaterialType>) => api.put<MaterialType>(`/material-types/${id}`, data),
  delete: (id: string) => api.delete<MaterialType>(`/material-types/${id}`),
};

export const materialApi = {
  list: (params: { name?: string; level?: number; page?: number; limit?: number }) =>
    api.get<ListResponse<Material>>('/materials', { params }),
  create: (data: Omit<Material, '_id'>) => api.post<Material>('/materials', data),
  update: (id: string, data: Partial<Material>) => api.put<Material>(`/materials/${id}`, data),
  delete: (id: string) => api.delete<Material>(`/materials/${id}`),
};

export const potionApi = {
  list: (params: { name?: string; effectType?: string; page?: number; limit?: number }) =>
    api.get<ListResponse<Potion>>('/potions', { params }),
  create: (data: Omit<Potion, '_id'>) => api.post<Potion>('/potions', data),
  update: (id: string, data: Partial<Potion>) => api.put<Potion>(`/potions/${id}`, data),
  delete: (id: string) => api.delete<Potion>(`/potions/${id}`),
}; 