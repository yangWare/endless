import { EnemyInstance } from '../models/EnemyInstance';
import { Types } from 'mongoose';
import { Creature } from '../models/Creature';
import { PlayerService } from './PlayerService';
import { CreatureService } from './CreatureService';
import { LocationService } from './LocationService';

export interface EnemyInstanceData {
  creatureId: Types.ObjectId;
  hp: number;
  level: number;
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
  private static combatLocks = new Map<string, boolean>();

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

      const instances = await EnemyInstance.insertMany(instancesData);
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
        .populate('creatureId');

      if (!enemyInstance) {
        throw new Error('敌人实例不存在');
      }

      // 复用calculateCreatureCombatStats的逻辑
      return await this.calculateCreatureCombatStats(enemyInstance.creatureId._id.toString());
    } catch (error: any) {
      throw new Error(`计算战斗属性失败: ${error.message}`);
    }
  }

  /**
   * 根据生物ID计算战斗属性
   * @param creatureId 生物ID
   * @returns 计算后的战斗属性
   */
  static async calculateCreatureCombatStats(creatureId: string): Promise<CombatStats> {
    try {
      const creature = await Creature.findById(creatureId)
        .populate({
          path: 'raceId'
        });

      if (!creature) {
        throw new Error('生物不存在');
      }

      const combatMultipliers = creature.combat_multipliers || {
        max_hp: 0,
        attack: 0,
        defense: 0,
        crit_rate: 0,
        crit_resist: 0,
        crit_damage: 0,
        crit_damage_resist: 0,
        hit_rate: 0,
        dodge_rate: 0
      };
      const race = creature.raceId as any;
      const level = creature.level;

      // 计算每个战斗属性
      const stats: CombatStats = {
        max_hp: race.combatStats.max_hp * combatMultipliers.max_hp * level,
        attack: race.combatStats.attack * combatMultipliers.attack * level,
        defense: race.combatStats.defense * combatMultipliers.defense * level,
        crit_rate: race.combatStats.crit_rate * combatMultipliers.crit_rate * level,
        crit_resist: race.combatStats.crit_resist * combatMultipliers.crit_resist * level,
        crit_damage: race.combatStats.crit_damage * combatMultipliers.crit_damage * level,
        crit_damage_resist: race.combatStats.crit_damage_resist * combatMultipliers.crit_damage_resist * level,
        hit_rate: race.combatStats.hit_rate * combatMultipliers.hit_rate * level,
        dodge_rate: race.combatStats.dodge_rate * combatMultipliers.dodge_rate * level
      };

      return stats;
    } catch (error: any) {
      throw new Error(`计算生物战斗属性失败: ${error.message}`);
    }
  }

  /**
   * 攻击敌人
   * @param playerId 玩家ID
   * @param enemyInstanceId 敌人实例ID
   * @returns 战斗结果
   */
  static async attackEnemy(playerId: string, enemyInstanceId: string) {
    const lockKey = `${enemyInstanceId}`;
    
    // 检查是否已经有战斗在进行
    if (this.combatLocks.get(lockKey)) {
      throw new Error('该战斗正在进行中，请稍后再试');
    }

    try {
      // 设置战斗锁
      this.combatLocks.set(lockKey, true);

      // 获取敌人实例
      const enemyInstance = await EnemyInstance.findById(enemyInstanceId);
      if (!enemyInstance) {
        return {
          result: 'enemy_refresh',
          damage: 0,
          isCritical: false,
          remainingHp: 0,
          counterDamage: 0,
          isCounterCritical: false,
          isPlayerDead: false
        }
      }

      // 检查当前地图是否需要刷新敌人
      const isNeedRefresh = await LocationService.checkEnemyRefreshNeeded(enemyInstance.locationId.toString(), enemyInstanceId);
      if (isNeedRefresh) {
        return {
          result: 'enemy_refresh',
          damage: 0,
          isCritical: false,
          remainingHp: 0,
          counterDamage: 0,
          isCounterCritical: false,
          isPlayerDead: false
        }
      }

      // 获取玩家和敌人的战斗属性
      const [playerStats, enemyStats] = await Promise.all([
        PlayerService.calculateCombatStats(playerId),
        this.calculateCombatStats(enemyInstanceId)
      ]);

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
    } finally {
      // 释放战斗锁
      this.combatLocks.delete(lockKey);
    }
  }

  /**
   * 计算伤害
   * @param attackerStats 攻击者属性
   * @param defenderStats 防御者属性
   * @returns 伤害计算结果，包含伤害值和是否暴击
   */
  private static calculateDamage(attackerStats: CombatStats, defenderStats: CombatStats): DamageResult {
    // 计算闪避
    const hitRoll = Math.random();
    // 命中率 = 攻击方命中值 除以 防御方闪避值
    const hitRate = attackerStats.hit_rate / defenderStats.dodge_rate;
    // 实际命中率 = 命中率基础上设置最小40%
    const realHitRate = Math.max(0.4, hitRate);
    if (hitRoll > realHitRate) {
      return { damage: 0, isCritical: false };
    }

    // 基础伤害 = 攻击力 - 防御力
    let damage = Math.max(1, attackerStats.attack - defenderStats.defense);
    let isCritical = false;

    // 计算暴击
    const critRoll = Math.random();
    // 暴击率 = 攻击方暴击值 除以 防御方暴击抵抗
    const critRate = attackerStats.crit_rate / defenderStats.crit_resist;
    // 真实暴击率，暴击率基础上设置最大60%
    const realCritRate = Math.min(0.6, critRate);
    if (critRoll < realCritRate) {
      // 溢出的暴击率，每多2%暴击率，暴击伤害增加1%，最大100%
      const overflowCritRate = Math.min(1, (critRate - realCritRate) / 2);
      // 计算暴击伤害，考虑防御者的暴击伤害抵抗，最大5倍
      const critDamage = Math.min(5, attackerStats.crit_damage / defenderStats.crit_damage_resist);
      // 真实暴击伤害 = 暴击伤害 + 溢出的暴击率 * 暴击伤害
      const critDamageMultiplier = Math.max(1, critDamage + overflowCritRate * critDamage);
      damage *= critDamageMultiplier;
      isCritical = true;
    }

    // 计算命中率&闪避率增伤逻辑
    let damageMultiplier = 1;
    if (attackerStats.hit_rate > defenderStats.dodge_rate) {
      // 当攻击方命中 > 防御方闪避时，每多2%命中，伤害增加1%，最大200%
      const hitRateDiff = (attackerStats.hit_rate - defenderStats.dodge_rate) / defenderStats.dodge_rate;
      const maxDamageMultiplier = Math.min(hitRateDiff / 2, 2);
      // 真实加成在1~max之间随机
      damageMultiplier = 1 + Math.random() * (maxDamageMultiplier - 1);
    } else if (attackerStats.hit_rate < defenderStats.dodge_rate) {
      // 当攻击方命中 < 防御方闪避时，每多2%闪避率，伤害减少1%，最大减少100%
      const dodgeRateDiff = (defenderStats.dodge_rate - attackerStats.hit_rate) / attackerStats.hit_rate;
      // 最小伤害加成
      const minDamageMultiplier = Math.max(1 - dodgeRateDiff / 2, 0); 
      // 真实加成在min~1之间随机
      damageMultiplier = minDamageMultiplier + Math.random() * (1 - minDamageMultiplier);
    }
    // 计算命中&闪避伤害增幅(降幅)
    damage *= damageMultiplier;
    // 强制扣1点血
    damage = Math.max(1, damage);
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
      const droppedMaterials = await CreatureService.calculateDrops(enemyInstance.creatureId._id);

      // 删除敌人实例，敌人刷新后会重新生成
      // await EnemyInstance.findByIdAndDelete(enemyInstanceId);

      return {
        droppedMaterials
      };
    } catch (error: any) {
      throw new Error(`处理敌人死亡失败: ${error.message}`);
    }
  }
} 