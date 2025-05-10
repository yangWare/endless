import { Location } from '../models/Location';
import { Types } from 'mongoose';
import { EnemyInstanceService } from './EnemyInstanceService';
import { EnemyInstance } from '../models/EnemyInstance';
import { ShopPotionItem } from './ShopService';
import { LocationState } from '../models/LocationState';
import { Player } from '../models/Player';

export interface LocationNPC {
  forge?: {
    level: number;
  };
  shop?: {
    potionItems: ShopPotionItem[];
  };
}

export interface LocationEnemy {
  creatureId: Types.ObjectId;
  probability: number;
  maxCount: number;
  updateDuration: number;
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
   * 删除地点及其相关数据
   */
  static async delete(id: string) {
    try {
      // 删除相关的 LocationState
      await LocationState.deleteMany({ locationId: id });

      // 删除相关的 EnemyInstance
      await EnemyInstance.deleteMany({ locationId: id });

      await Location.findByIdAndDelete(id);

      return true;
    } catch (error) {
      throw error;
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
   * 获取指定地点详情 - 面向管理后台
   */
  static async getLocationByIdForAdmin(id: string) {
    try {
      const location = await Location.findById(id)
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
   * 检查是否需要刷新敌人
   * @param locationId 地点ID
   * @param enemyInstanceId 敌人实例ID
   * @returns 如果需要刷新返回 true，否则返回 false
   */
  static async checkEnemyRefreshNeeded(locationId: string, enemyInstanceId: string): Promise<boolean> {
    try {
      const location = await Location.findById(locationId);
      if (!location) {
        throw new Error('地点不存在');
      }

      const enemyInstance = await EnemyInstance.findById(enemyInstanceId);
      if (!enemyInstance) {
        throw new Error('敌人实例不存在');
      }

      if (enemyInstance.hp <= 0) {
        throw new Error('敌人实例已死亡');
      }

      const enemy = location.enemies.find(e => e.creatureId.toString() === enemyInstance.creatureId.toString());
      if (!enemy) {
        throw new Error('该地点不存在此生物');
      }

      const currentTime = Date.now();
      const createTime = enemyInstance.createdAt.getTime();
      const updateDuration = enemy.updateDuration;

      return currentTime - createTime >= updateDuration;
    } catch (error: any) {
      console.log(`检查敌人刷新状态失败: ${error.message}`)
      return true
    }
  }

  /**
   * 生成指定玩家的敌人
   * @param playerId 玩家id
   * @param isCotinue 是否是继续向前探索
   */
  static async generateEnemies(playerId: string, isCotinue: 0 | 1) {
    try {
      const player = await Player.findById(playerId)

      if (!player) {
        throw new Error('玩家不存在')
      }

      const location = await Location.findById(player.currentLocation.toString())
        .populate('enemies.creatureId');
      
      if (!location) {
        throw new Error('地点不存在');
      }
      const locationId = location._id.toString()

      const prevIndex = player.currentLocationIndex
      let currentIndex = prevIndex
      if (isCotinue) {
        // 每次探索固定向前移动7格
        currentIndex += 7
        await Player.findByIdAndUpdate(
          playerId,
          {
            currentLocationIndex: currentIndex
          }
        );
      }

      // 1. 获取当前地点的所有敌人实例
      const enemyInstances = await EnemyInstance.find({ locationId: locationId }).populate('creatureId', 'name');
      
      // 2. 删除过期项
      const validEnemyIds = location.enemies.map(e => e.creatureId._id.toString());
      const instancesToDelete: typeof enemyInstances = []
      const remainingInstances: typeof enemyInstances  = []
      enemyInstances.forEach(instance => {
        if (instance.locationIndex === -1 || !validEnemyIds.includes(instance.creatureId._id.toString())) {
          instancesToDelete.push(instance)
        } else {
          remainingInstances.push(instance)
        }
      });

      if (instancesToDelete.length > 0) {
        await EnemyInstance.deleteMany({ 
          _id: { $in: instancesToDelete.map(i => i._id) } 
        });
      }

      // 2.5 检查并补足敌人数量
      for (const enemy of location.enemies) {
        const creature = enemy.creatureId as any;
        const maxCount = enemy.maxCount;
        
        // 计算当前已有的该类型敌人数量
        const existingCount = remainingInstances.filter(instance => 
          instance.creatureId._id.toString() === creature._id.toString()
        ).length;

        // 生成新的敌人实例直到达到最大数量
        for (let i = existingCount; i < maxCount; i++) {
          const newInstance = new EnemyInstance({
            creatureId: creature,
            locationId: locationId,
            hp: 100, // 临时值，后面会更新
            level: creature.level,
            locationIndex: Math.floor(Math.random() * 100) // 0-99之间的随机数
          });
          // 保存一下，计算战斗属性方法依赖数据库数据
          await newInstance.save();

          // 使用 EnemyInstanceService 计算战斗属性
          const combatStats = await EnemyInstanceService.calculateCombatStats(newInstance._id.toString());
          // 更新敌人实例的 HP
          newInstance.hp = combatStats.max_hp;
          await newInstance.save();
          remainingInstances.push(newInstance)
        }
      }

      // 3. 获取当前index前后各3格的敌人实例
      const nearbyInstances = remainingInstances.filter(instance => {
        const index = instance.locationIndex;
        const left = currentIndex - 3 < 0 ? 0 : currentIndex - 3
        const right = currentIndex + 3 > 99 ? 99 : currentIndex + 3
        return index >= left && index <= right;
      });

      // 4. 检查并刷新死亡的敌人实例
      const res: typeof nearbyInstances = []
      const currentTime = Date.now();
      for (const instance of nearbyInstances) {
        const enemy = location.enemies.find(e => 
          e.creatureId._id.toString() === instance.creatureId._id.toString()
        );

        if (!enemy) continue;

        if (instance.hp <= 0 && (currentTime - instance.createdAt.getTime() >= enemy.updateDuration)) {
          // 删除死亡实例
          await EnemyInstance.findByIdAndDelete(instance._id);

          // 生成新实例
          const newInstance = new EnemyInstance({
            creatureId: instance.creatureId,
            locationId: locationId,
            hp: 100, // 临时值，后面会更新
            level: (enemy.creatureId as any).level,
            locationIndex: Math.floor(Math.random() * 100) // 0-99之间的随机数
          });

          await newInstance.save();
          
          // 使用 EnemyInstanceService 计算战斗属性
          const combatStats = await EnemyInstanceService.calculateCombatStats(newInstance._id.toString());
          // 更新敌人实例的 HP
          newInstance.hp = combatStats.max_hp;
          await newInstance.save();
          res.push(newInstance)
        } else {
          res.push(instance)
        }
      }

      // 返回更新后的敌人实例列表
      return res.filter(item => item.hp > 0)
    } catch (error: any) {
      throw new Error(`生成敌人失败: ${error.message}`);
    }
  }

  /**
   * 获取指定地点的敌人实例列表
   * @param locationId 地点ID
   * @returns 敌人实例列表
   */
  static async getLocationEnemyInstances(locationId: string) {
    try {
      // 验证地点是否存在
      const location = await Location.findById(locationId);
      if (!location) {
        throw new Error('地点不存在');
      }

      // 获取该地点的所有敌人实例
      const enemyInstances = await EnemyInstance.find({ 
        locationId: locationId 
      }).populate('creatureId', 'name');

      return enemyInstances;
    } catch (error: any) {
      throw new Error(`获取地点敌人列表失败: ${error.message}`);
    }
  }
} 