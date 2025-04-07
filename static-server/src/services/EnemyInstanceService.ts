import { EnemyInstance } from '../models/EnemyInstance';
import { Types } from 'mongoose';
import { Creature } from '../models/Creature';
import { Race } from '../models/Race';
import { PlayerService } from './PlayerService';
import { CreatureService } from './CreatureService';

export interface EnemyInstanceData {
  creatureId: Types.ObjectId;
  creatureName: string;
  hp: number;
  locationId: Types.ObjectId;
}

export interface EnemyInstanceQueryParams {
  creatureId?: Types.ObjectId;
  locationId?: Types.ObjectId;
  page?: number;
  limit?: number;
}

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

// 添加伤害计算结果接口
export interface DamageResult {
  damage: number;
  isCritical: boolean;
}

export class EnemyInstanceService {
  /**
   * 批量创建敌人实例
   */
  static async createEnemyInstances(instancesData: EnemyInstanceData[]) {
    try {
      // 验证所有creatureId是否存在
      const creatureIds = instancesData.map(data => data.creatureId);
      const creatures = await Creature.find({ _id: { $in: creatureIds } });
      
      if (creatures.length !== creatureIds.length) {
        throw new Error('部分生物ID不存在');
      }

      // 确保每个实例都有对应的生物名称
      const creatureMap = new Map(creatures.map(c => [c._id.toString(), c.name]));
      const enrichedInstancesData = instancesData.map(data => ({
        ...data,
        creatureName: data.creatureName || creatureMap.get(data.creatureId.toString()) || '未知生物'
      }));

      const instances = await EnemyInstance.insertMany(enrichedInstancesData);
      return instances;
    } catch (error: any) {
      throw new Error(`批量创建敌人实例失败: ${error.message}`);
    }
  }

  /**
   * 更新敌人实例
   */
  static async updateEnemyInstance(id: string, updateData: Partial<EnemyInstanceData>) {
    try {
      const instance = await EnemyInstance.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      ).populate('creatureId').populate('locationId');
      
      if (!instance) {
        throw new Error('敌人实例不存在');
      }
      return instance;
    } catch (error: any) {
      throw new Error(`更新敌人实例失败: ${error.message}`);
    }
  }

  /**
   * 批量删除敌人实例
   */
  static async deleteEnemyInstances(ids: string[]) {
    try {
      const result = await EnemyInstance.deleteMany({ _id: { $in: ids } });
      return result;
    } catch (error: any) {
      throw new Error(`批量删除敌人实例失败: ${error.message}`);
    }
  }

  /**
   * 获取指定敌人实例详情
   */
  static async getEnemyInstanceById(id: string) {
    try {
      const instance = await EnemyInstance.findById(id)
        .populate('creatureId')
        .populate('locationId');
      
      if (!instance) {
        throw new Error('敌人实例不存在');
      }
      return instance;
    } catch (error: any) {
      throw new Error(`获取敌人实例详情失败: ${error.message}`);
    }
  }

  /**
   * 获取敌人实例列表（支持分页和查询）
   */
  static async getEnemyInstances(params: EnemyInstanceQueryParams) {
    try {
      const { creatureId, locationId, page = 1, limit = 50 } = params;
      
      const query: any = {};
      if (creatureId) {
        query.creatureId = new Types.ObjectId(creatureId);
      }
      if (locationId) {
        query.locationId = new Types.ObjectId(locationId);
      }

      const skip = (page - 1) * limit;
      
      const [instances, total] = await Promise.all([
        EnemyInstance.find(query)
          .populate('creatureId')
          .populate('locationId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        EnemyInstance.countDocuments(query)
      ]);

      return {
        instances,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`获取敌人实例列表失败: ${error.message}`);
    }
  }

  /**
   * 计算敌人的战斗属性
   * @param enemyInstanceId 敌人实例ID
   * @returns 计算后的战斗属性
   */
  static async calculateCombatStats(enemyInstanceId: string): Promise<CombatStats> {
    try {
      const enemyInstance = await EnemyInstance.findById(enemyInstanceId)
        .populate({
          path: 'creatureId',
          populate: {
            path: 'raceId'
          }
        });

      if (!enemyInstance) {
        throw new Error('敌人实例不存在');
      }

      const creature = enemyInstance.creatureId as any;
      const race = creature.raceId;
      const level = creature.level;

      // 计算每个战斗属性
      const stats: CombatStats = {
        max_hp: race.combatStats.max_hp * creature.combat_multipliers.max_hp * level,
        attack: race.combatStats.attack * creature.combat_multipliers.attack * level,
        defense: race.combatStats.defense * creature.combat_multipliers.defense * level,
        crit_rate: race.combatStats.crit_rate * creature.combat_multipliers.crit_rate * level,
        crit_resist: race.combatStats.crit_resist * creature.combat_multipliers.crit_resist * level,
        crit_damage: race.combatStats.crit_damage * creature.combat_multipliers.crit_damage * level,
        crit_damage_resist: race.combatStats.crit_damage_resist * creature.combat_multipliers.crit_damage_resist * level,
        hit_rate: race.combatStats.hit_rate * creature.combat_multipliers.hit_rate * level,
        dodge_rate: race.combatStats.dodge_rate * creature.combat_multipliers.dodge_rate * level
      };

      return stats;
    } catch (error: any) {
      throw new Error(`计算战斗属性失败: ${error.message}`);
    }
  }

  /**
   * 攻击敌人
   * @param playerId 玩家ID
   * @param enemyInstanceId 敌人实例ID
   * @returns 战斗结果
   */
  static async attackEnemy(playerId: string, enemyInstanceId: string) {
    try {
      // 获取玩家和敌人的战斗属性
      const [playerStats, enemyStats] = await Promise.all([
        PlayerService.calculateCombatStats(playerId),
        this.calculateCombatStats(enemyInstanceId)
      ]);

      // 获取敌人实例
      const enemyInstance = await EnemyInstance.findById(enemyInstanceId);
      if (!enemyInstance) {
        throw new Error('敌人实例不存在');
      }

      // 计算伤害
      const { damage, isCritical } = this.calculateDamage(playerStats, enemyStats);
      enemyInstance.hp = Math.max(0, enemyInstance.hp - damage);
      await enemyInstance.save();

      // 如果敌人死亡
      if (enemyInstance.hp === 0) {
        const { droppedMaterials } = await this.handleEnemyDeath(enemyInstanceId);
        // 添加掉落物到玩家背包
        await PlayerService.addMaterialsToInventory(playerId, droppedMaterials);
        return {
          result: 'enemy_dead',
          damage,
          isCritical,
          remainingHp: 0,
          droppedMaterials
        };
      }

      // 敌人反击
      const { damage: counterDamage, isCritical: isCounterCritical } = this.calculateDamage(enemyStats, playerStats);
      // 处理玩家受伤
      const isPlayerDead = await PlayerService.handlePlayerDamage(playerId, counterDamage);

      return {
        result: isPlayerDead ? 'player_dead' : 'continue',
        damage,
        isCritical,
        remainingHp: enemyInstance.hp,
        counterDamage,
        isCounterCritical,
        isPlayerDead
      };
    } catch (error: any) {
      throw new Error(`攻击敌人失败: ${error.message}`);
    }
  }

  /**
   * 计算伤害
   * @param attackerStats 攻击者属性
   * @param defenderStats 防御者属性
   * @returns 伤害计算结果，包含伤害值和是否暴击
   */
  private static calculateDamage(attackerStats: CombatStats, defenderStats: CombatStats): DamageResult {
    // 基础伤害 = 攻击力 - 防御力
    let damage = Math.max(1, attackerStats.attack - defenderStats.defense);
    let isCritical = false;

    // 计算暴击
    const critRoll = Math.random();
    if (critRoll < attackerStats.crit_rate - defenderStats.crit_resist) {
      // 计算暴击伤害，考虑防御者的暴击伤害抵抗
      const critDamageMultiplier = Math.max(1, attackerStats.crit_damage - defenderStats.crit_damage_resist);
      damage *= critDamageMultiplier;
      isCritical = true;
    }

    // 计算闪避
    const dodgeRoll = Math.random();
    if (dodgeRoll < defenderStats.dodge_rate - attackerStats.hit_rate) {
      return { damage: 0, isCritical: false };
    }

    return { damage: Math.floor(damage), isCritical };
  }

  /**
   * 处理敌人死亡
   * @param enemyInstanceId 敌人实例ID
   */
  private static async handleEnemyDeath(enemyInstanceId: string) {
    try {
      const enemyInstance = await EnemyInstance.findById(enemyInstanceId)
        .populate({
          path: 'creatureId',
          populate: {
            path: 'raceId'
          }
        });
      
      if (!enemyInstance) {
        throw new Error('敌人实例不存在');
      }

      // 使用CreatureService计算掉落物品
      const droppedMaterials = await CreatureService.calculateDrops(enemyInstance.creatureId.toString());

      // 删除敌人实例
      await EnemyInstance.findByIdAndDelete(enemyInstanceId);

      return {
        droppedMaterials
      };
    } catch (error: any) {
      throw new Error(`处理敌人死亡失败: ${error.message}`);
    }
  }
} 