import { Location } from '../models/Location';
import { Types } from 'mongoose';
import { Creature } from '../models/Creature';
import { EnemyInstanceService } from './EnemyInstanceService';
import { EnemyInstance } from '../models/EnemyInstance';

export interface LocationNPC {
  forge?: {
    level: number;
  };
  shop?: {
    items: Array<{
      id: string;
      price: number;
    }>;
  };
}

export interface LocationEnemy {
  creatureId: Types.ObjectId;
  probability: number;
  maxCount: number;
}

export interface LocationData {
  name: string;
  description: string;
  mapId: Types.ObjectId;
  position: {
    x: number;
    y: number;
  };
  adjacentLocations: Types.ObjectId[];
  npc?: LocationNPC;
  enemies?: LocationEnemy[];
  enemyUpdateDuration?: number;
}

export interface LocationQueryParams {
  name?: string;
  mapId?: Types.ObjectId;
  page?: number;
  limit?: number;
}

export class LocationService {
  /**
   * 创建新地点
   */
  static async createLocation(locationData: LocationData) {
    try {
      const location = new Location(locationData);
      return await location.save();
    } catch (error: any) {
      throw new Error(`创建地点失败: ${error.message}`);
    }
  }

  /**
   * 更新地点信息
   */
  static async updateLocation(id: string, updateData: Partial<LocationData>) {
    try {
      const location = await Location.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
      if (!location) {
        throw new Error('地点不存在');
      }
      return location;
    } catch (error: any) {
      throw new Error(`更新地点失败: ${error.message}`);
    }
  }

  /**
   * 删除地点
   */
  static async deleteLocation(id: string) {
    try {
      const location = await Location.findByIdAndDelete(id);
      if (!location) {
        throw new Error('地点不存在');
      }
      return location;
    } catch (error: any) {
      throw new Error(`删除地点失败: ${error.message}`);
    }
  }

  /**
   * 获取指定地点详情
   */
  static async getLocationById(id: string) {
    try {
      const location = await Location.findById(id)
        .populate('enemies.creatureId', 'name'); // 填充生物信息
      if (!location) {
        throw new Error('地点不存在');
      }
      return location;
    } catch (error: any) {
      throw new Error(`获取地点详情失败: ${error.message}`);
    }
  }

  /**
   * 获取地点列表（支持分页和查询）
   */
  static async getLocations(params: LocationQueryParams) {
    try {
      const { name, mapId, page = 1, limit = 50 } = params;
      
      const query: any = {};
      if (name) {
        query.name = { $regex: name, $options: 'i' };
      }
      if (mapId) {
        query.mapId = mapId;
      }

      const skip = (page - 1) * limit;
      
      const [locations, total] = await Promise.all([
        Location.find(query)
          .populate('enemies.creatureId', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Location.countDocuments(query)
      ]);

      return {
        locations,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`获取地点列表失败: ${error.message}`);
    }
  }

  /**
   * 生成指定地点的敌人
   */
  static async generateEnemies(locationId: string) {
    try {
      const location = await Location.findById(locationId)
        .populate('enemies.creatureId');
      
      if (!location) {
        throw new Error('地点不存在');
      }

      const currentTime = Date.now();
      const lastUpdateTime = location.enemyUpdateTime || 0;
      const updateDuration = location.enemyUpdateDuration || 3600000; // 默认1小时

      // 如果未超过刷新时间，返回空数组
      if (currentTime - lastUpdateTime < updateDuration) {
        return [];
      }

      const enemyInstances = [];

      // 生成新的敌人实例
      for (const enemyConfig of location.enemies || []) {
        const creature = enemyConfig.creatureId as any;
        const maxCount = enemyConfig.maxCount;

        for (let i = 0; i < maxCount; i++) {
          // 创建敌人实例
          const enemyInstance = new EnemyInstance({
            creatureId: creature._id,
            creatureName: creature.name,
            locationId: locationId,
            hp: 100 // 临时值，后面会更新
          });
          // 使用 EnemyInstanceService 计算战斗属性
          const combatStats = await EnemyInstanceService.calculateCombatStats(enemyInstance._id.toString());
          // 更新敌人实例的 HP
          enemyInstance.hp = combatStats.max_hp;
          await enemyInstance.save();

          enemyInstances.push({
            instanceId: enemyInstance._id.toString(),
            enemyId: creature._id.toString(),
            locationId: locationId,
            hp: combatStats.max_hp,
            combatStats
          });
        }
      }

      // 更新地点的敌人更新时间
      await Location.findByIdAndUpdate(locationId, {
        enemyUpdateTime: currentTime
      });

      return enemyInstances;
    } catch (error: any) {
      throw new Error(`生成敌人失败: ${error.message}`);
    }
  }
} 