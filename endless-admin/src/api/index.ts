import axios from 'axios';

const baseURL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL,
  timeout: 5000
});

export interface ListResponse<T> {
  success: boolean;
  data: {
    races?: T[];
    creatures?: T[];
    materialTypes?: T[];
    materials?: T[];
    potions?: T[];
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

export interface Location {
  _id: string;
  name: string;
  mapId: string;
  description?: string;
  position: {
    x: number;
    y: number;
  };
}

export const raceApi = {
  list: (params: any) => api.get('/races', { params }),
  create: (data: any) => api.post('/races', data),
  update: (id: string, data: any) => api.put(`/races/${id}`, data),
  delete: (id: string) => api.delete(`/races/${id}`),
  getById: (id: string) => api.get(`/races/${id}`)
};

export const creatureApi = {
  list: (params: any) => api.get('/creatures', { params }),
  create: (data: any) => api.post('/creatures', data),
  update: (id: string, data: any) => api.put(`/creatures/${id}`, data),
  delete: (id: string) => api.delete(`/creatures/${id}`),
  getById: (id: string) => api.get(`/creatures/${id}`)
};

export const materialTypeApi = {
  list: (params: any) => api.get('/material-types', { params }),
  create: (data: any) => api.post('/material-types', data),
  update: (id: string, data: any) => api.put(`/material-types/${id}`, data),
  delete: (id: string) => api.delete(`/material-types/${id}`),
  getById: (id: string) => api.get(`/material-types/${id}`)
};

export const materialApi = {
  list: (params: any) => api.get('/materials', { params }),
  create: (data: any) => api.post('/materials', data),
  update: (id: string, data: any) => api.put(`/materials/${id}`, data),
  delete: (id: string) => api.delete(`/materials/${id}`),
  getById: (id: string) => api.get(`/materials/${id}`)
};

export const potionApi = {
  list: (params: any) => api.get('/potions', { params }),
  create: (data: any) => api.post('/potions', data),
  update: (id: string, data: any) => api.put(`/potions/${id}`, data),
  delete: (id: string) => api.delete(`/potions/${id}`),
  getById: (id: string) => api.get(`/potions/${id}`)
};

export const locationApi = {
  list: (params: any) => api.get('/locations', { params }),
  create: (data: any) => api.post('/locations', data),
  update: (id: string, data: any) => api.put(`/locations/${id}`, data),
  delete: (id: string) => api.delete(`/locations/${id}`),
  getById: (id: string) => api.get(`/locations/${id}`)
};

export const mapApi = {
  list: (params: any) => api.get('/maps', { params }),
  create: (data: any) => api.post('/maps', data),
  update: (id: string, data: any) => api.put(`/maps/${id}`, data),
  delete: (id: string) => api.delete(`/maps/${id}`),
  getById: (id: string) => api.get(`/maps/${id}`)
}; 