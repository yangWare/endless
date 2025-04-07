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
  _id: string;
  username: string;
  password: string;
  nickname: string;
  currentMap: string;
  currentLocation: string;
  hp: number;
  coins: number;
  levelInfo: {
    level: number;
    exp: number;
  };
  inventory: {
    materials: string[];
    potions: string[];
    equipments: Equipment[];
  };
  equipped: {
    weapon: Equipment | null;
    armor: Equipment | null;
    accessory: Equipment | null;
    helmet: Equipment | null;
    boots: Equipment | null;
  };
  combat_stats?: CombatStats;
  createdAt?: string;
  updatedAt?: string;
}

// 敌人实例类型
export interface EnemyInstance {
  _id: string;
  creatureId: string;
  locationId: string;
  hp: number;
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
  _id: string;
  name: string;
  description: string;
  mapId: string;
  position: {
    x: number;
    y: number;
  };
  adjacentLocations: string[];
  npc: {
    forge: {
      level: number
    } | null
    shop: {
      items: []
    } | null
    _id: string
  }
  enemies: Array<{
    creatureId: {
      _id: string
      name: string
    },
    probability: number
  }>
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

// 装备类型
export interface Equipment {
  id: string;
  name: string;
  level: number;
  slot: 'weapon' | 'armor' | 'accessory' | 'helmet' | 'boots';
  combatStats: CombatStats;
}

// 掉落物品类型
export interface DroppedMaterial {
  materialId: {
    _id: string;
    name: string;
  };
  quantity: number;
}

// 攻击敌人的结果类型
export interface AttackEnemyResult {
  result: 'enemy_dead' | 'player_dead' | 'continue' | 'enemy_refresh';
  damage: number;
  isCritical: boolean;
  remainingHp: number;
  counterDamage?: number;
  isCounterCritical?: boolean;
  isPlayerDead?: boolean;
  droppedMaterials?: DroppedMaterial[];
}

// 材料类型
export interface Material {
  _id: string;
  name: string;
  description: string;
  typeId: {
    _id: string;
    name: string;
  };
  combat_multipliers: {
    max_hp: number;
    attack: number;
    defense: number;
    crit_rate: number;
    crit_resist: number;
    crit_damage: number;
    crit_damage_resist: number;
    hit_rate: number;
    dodge_rate: number;
  };
  level: number;
  createdAt?: string;
  updatedAt?: string;
}

// 材料数据接口
export interface MaterialData {
  name: string;
  description: string;
  typeId: string;
  combat_multipliers: {
    max_hp: number;
    attack: number;
    defense: number;
    crit_rate: number;
    crit_resist: number;
    crit_damage: number;
    crit_damage_resist: number;
    hit_rate: number;
    dodge_rate: number;
  };
  level: number;
}

const baseURL = '/endless/api';

const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 60 * 1000
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
    api.post('/players/combat-stats', data),

  // 穿戴装备
  equipItem: (data: { playerId: string; equipmentId: string }): Promise<BaseResponse<Player>> =>
    api.post('/players/equip', data),

  // 删除玩家
  delete: (data: { username: string; password: string }): Promise<BaseResponse<{ message: string }>> =>
    api.post('/players/delete', data),

  // 复活玩家
  revive: (data: { playerId: string }): Promise<BaseResponse<Player>> =>
    api.post('/players/revive', data)
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
  list: (params?: { mapId?: string; page?: number; limit?: number }): Promise<BaseResponse<{
    locations: Location[];
  }>> => 
    api.get('/locations', { params }),
  
  // 获取地点详情
  getById: (id: string): Promise<BaseResponse<Location>> => 
    api.get(`/locations/${id}`),

  /**
   * 生成指定地点的敌人
   * @param locationId 地点ID
   */
  generateEnemies: async (locationId: string) => {
    const response = await api.post<EnemyInstance[]>(`/locations/${locationId}/enemies`, {
      locationId
    });
    return response.data;
  },

  /**
   * 获取指定地点的敌人实例列表
   * @param locationId 地点ID
   * @returns 敌人实例列表
   */
  getLocationEnemies: (locationId: string): Promise<BaseResponse<EnemyInstance[]>> =>
    api.get(`/locations/${locationId}/enemies`),

  /**
   * 锻造装备
   * @param data 锻造参数
   * @returns 锻造结果
   */
  forge: (data: {
    locationId: string;
    playerId: string;
    materialIds: string[];
    equipmentType: string;
  }): Promise<BaseResponse<Equipment | null>> =>
    api.post(`/locations/${data.locationId}/forge`, data)
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
    return api.get(`/enemies/${creatureId}/combat-stats`);
  },
  
  /**
   * 攻击敌人
   * @param data 攻击参数，包含 playerId 和 enemyInstanceId
   */
  attack: async (data: { playerId: string; enemyInstanceId: string }): Promise<BaseResponse<AttackEnemyResult>> => {
    return api.post('/enemies/attack', data);
  }
};

export const materialApi = {
  /**
   * 根据ID列表批量获取材料
   * @param ids 材料ID列表
   */
  getByIds: (ids: string[]): Promise<BaseResponse<Material[]>> => 
    api.post('/materials/ids', { ids })
};

export default api; 