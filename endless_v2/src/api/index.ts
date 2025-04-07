import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// 基础响应类型
export interface BaseResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

// 玩家相关类型
export interface Player {
  id: string;
  username: string;
  password: string;
  currentMap: string;
  currentLocation: string;
  // 其他玩家属性...
}

// 敌人实例类型
export interface EnemyInstance {
  id: string;
  enemyId: string;
  locationId: string;
  hp: number;
  createdAt: string;
  updatedAt: string;
}

// 地点状态类型
export interface LocationState {
  id: string;
  locationId: string;
  enemyInstances: EnemyInstance[];
  lastUpdateTime: string;
  createdAt: string;
  updatedAt: string;
}

interface PlayerInfoRequest {
  username: string;
  password: string;
}

// 地图相关类型
export interface Map {
  id: string;
  name: string;
  description: string;
  startLocationId: string;
  width: number;
  height: number;
  bgImage: string;
}

// 地点相关类型
export interface Location {
  id: string;
  name: string;
  description: string;
  mapId: string;
  position: {
    x: number;
    y: number;
  };
  adjacentLocations: string[];
  enemies: string[];
}

// 战斗属性类型
export interface CombatStats {
  max_hp: number;
  attack: number;
  defense: number;
  crit_rate: number;
  crit_resist: number;
  crit_damage: number;
  crit_damage_resist: number;
  hit_rate: number;
  dodge_rate: number;
}

// 掉落物品类型
export interface DroppedMaterial {
  materialId: string;
  quantity: number;
}

// 攻击敌人的结果类型
export interface AttackEnemyResult {
  result: 'enemy_dead' | 'player_dead' | 'continue';
  damage: number;
  isCritical: boolean;
  remainingHp: number;
  counterDamage?: number;
  isCounterCritical?: boolean;
  isPlayerDead?: boolean;
  droppedMaterials?: DroppedMaterial[];
}

const baseURL = '/endless/api';

const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 5000
});

// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 可以在这里添加 token 等认证信息
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // 统一处理响应数据
    return response.data;
  },
  (error: AxiosError) => {
    // 统一处理错误
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

export const playerApi = {
  // 创建玩家
  create: (data: Partial<Player>): Promise<BaseResponse<Player>> => 
    api.post('/players', data),
  
  // 获取玩家信息
  getInfo: (data: PlayerInfoRequest): Promise<BaseResponse<Player>> => 
    api.post('/players/info', data),
  
  // 更新玩家位置
  updateLocation: (data: { playerId: string; locationId: string; mapId: string }): Promise<BaseResponse<Player>> => 
    api.post('/players/location/update', data),
  
  // 获取玩家位置
  getLocation: (data: { playerId: string }): Promise<BaseResponse<{ locationId: string }>> => 
    api.post('/players/location', data),
    
  // 获取玩家战斗属性
  getCombatStats: (data: { playerId: string }): Promise<BaseResponse<CombatStats>> => 
    api.post('/players/combat-stats', data)
};

export const mapApi = {
  // 获取地图列表
  list: (params?: { page?: number; limit?: number }): Promise<BaseResponse<Map[]>> => 
    api.get('/maps', { params }),
  
  // 获取地图详情
  getById: (id: string): Promise<BaseResponse<Map>> => 
    api.get(`/maps/${id}`)
};

export const locationApi = {
  // 获取地点列表
  list: (params?: { mapId?: string; page?: number; limit?: number }): Promise<BaseResponse<Location[]>> => 
    api.get('/locations', { params }),
  
  // 获取地点详情
  getById: (id: string): Promise<BaseResponse<Location>> => 
    api.get(`/locations/${id}`),

  /**
   * 生成指定地点的敌人
   * @param locationId 地点ID
   */
  generateEnemies: async (locationId: string) => {
    const response = await axios.post(`/api/locations/${locationId}/enemies`);
    return response.data;
  }
};

export const locationStateApi = {
  // 获取地点状态
  getByLocationId: (locationId: string): Promise<BaseResponse<LocationState>> => 
    api.get(`/location-states/${locationId}`),
  
  // 更新地点状态
  update: (data: Partial<LocationState>): Promise<BaseResponse<LocationState>> => 
    api.post('/location-states/update', data)
};

export const enemyInstanceApi = {
  // 获取敌人实例
  getById: (id: string): Promise<BaseResponse<EnemyInstance>> => 
    api.get(`/enemy-instances/${id}`),
  
  // 更新敌人实例
  update: (data: Partial<EnemyInstance>): Promise<BaseResponse<EnemyInstance>> => 
    api.post('/enemy-instances/update', data)
};

export const enemyApi = {
  /**
   * 计算生物的战斗属性
   * @param creatureId 生物ID
   */
  calculateCombatStats: async (creatureId: string): Promise<BaseResponse<CombatStats>> => {
    return api.get(`/enemies/combat-stats/${creatureId}`);
  },
  
  /**
   * 攻击敌人
   * @param data 攻击参数，包含 playerId 和 enemyInstanceId
   */
  attack: async (data: { playerId: string; enemyInstanceId: string }): Promise<BaseResponse<AttackEnemyResult>> => {
    return api.post('/enemies/attack', data);
  }
};

export default api; 