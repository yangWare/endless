import { EnemyInstance } from '../models/EnemyInstance';
import { Types } from 'mongoose';
import { Creature } from '../models/Creature';
import { PlayerService } from './PlayerService';
import { CreatureService, DroppedMaterial } from './CreatureService';
import { LocationService } from './LocationService';

export interface EnemyInstanceData {
  creatureId: Types.ObjectId;
  hp: number;
  level: number;
  locationId: Types.ObjectId;
  locationIndex: number;
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
  perception: number;
  stealth: number;
  escape: number;
  rage: number;
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
        dodge_rate: 0,
        perception: 0,
        stealth: 0,
        escape: 0,
        rage: 0
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
        dodge_rate: race.combatStats.dodge_rate * combatMultipliers.dodge_rate * level,
        perception: race.combatStats.perception * combatMultipliers.perception * level,
        stealth: race.combatStats.stealth * combatMultipliers.stealth * level,
        escape: race.combatStats.escape * combatMultipliers.escape * level,
        rage: race.combatStats.rage * combatMultipliers.rage
      };

      return stats;
    } catch (error: any) {
      throw new Error(`计算生物战斗属性失败: ${error.message}`);
    }
  }


  /**
   * 攻击敌人
   * @param playerId 玩家ID
   * @param mainEnemyInstanceIds 直接攻击的敌人实例ID列表
   * @returns 战斗结果
   */
  static async attackEnemy(playerId: string, mainEnemyInstanceIds: string[], isCotinue: 0 | 1) {
    const currentEnemyInstances = await LocationService.generateEnemies(playerId, isCotinue)

    const res: Record<string, {
      // 结果字符串
      result: 'enemy_dead' | 'continue' | 'enemy_flee' | 'enemy_lock_by_other' | 'active_attack' | 'deactive_attack';
      // 玩家造成的伤害
      damage: number;
      // 玩家是否暴击
      isCritical: boolean;
      // 怪物还剩多少hp
      remainingHp: number;
      // 怪物攻击伤害
      counterDamage: number;
      // 怪物是否暴击
      isCounterCritical: boolean;
      // 怪物掉落物品
      droppedMaterials: DroppedMaterial[];
      // 敌人实例
      enemyInstance: typeof currentEnemyInstances[number]
    }> = {}
    const mainEnemyInstances: typeof currentEnemyInstances = []
    const otherEnemyInstances: typeof currentEnemyInstances = []
    // 战斗锁判定
    currentEnemyInstances.forEach(instance => {
      const lockKey = `${instance._id.toString()}`
      // 检查是否已经有战斗在进行，过滤掉这个怪
      if (this.combatLocks.get(lockKey)) {
        res[instance._id.toString()] = {
          result: 'enemy_lock_by_other',
          damage: 0,
          isCritical: false,
          remainingHp: instance.hp,
          counterDamage: 0,
          isCounterCritical: false,
          droppedMaterials: [],
          enemyInstance: instance
        }
        return
      }
      // 设置战斗锁
      this.combatLocks.set(lockKey, true);
      if (mainEnemyInstanceIds.includes(instance._id.toString())) {
        mainEnemyInstances.push(instance)
      } else {
        otherEnemyInstances.push(instance)
      }
    })

    try {
      const playerStats = await PlayerService.calculateCombatStats(playerId)
      // 处理主动攻击
      await Promise.all([...mainEnemyInstances.map(async instance => {
        const attackRes = await this.attackSingleEnemy(playerStats, instance)
        res[instance._id.toString()] = {
          ...attackRes,
          enemyInstance: instance
        }
      }), ...otherEnemyInstances.map(async instance => {
        const attackRes = await this.onlySingleEnemyAttackPlayer(playerStats, instance)
        res[instance._id.toString()] = {
          ...attackRes,
          enemyInstance: instance
        }
      })])
      // 处理玩家血量、背包掉落物、战斗中敌人列表
      await PlayerService.handlePlayerStatusAfterAttack(playerId, res)
      return res
    } catch (error: any) {
      throw new Error(`攻击敌人失败: ${error.message}`);
    } finally {
      [...mainEnemyInstances, ...otherEnemyInstances].forEach(instance => {
        const lockKey = `${instance._id.toString()}`
        // 释放战斗锁
        this.combatLocks.delete(lockKey);
      })
    }
  }

  private static async attackSingleEnemy(playerStats: Omit<CombatStats, 'rage'>, enemyInstance: Awaited<ReturnType<typeof LocationService.generateEnemies>>[number]) {
    const enemyStats = await this.calculateCombatStats(enemyInstance._id.toString())
    // 计算伤害
    const { damage, isCritical } = this.calculateDamage(playerStats, enemyStats);
    enemyInstance.hp = Math.max(0, enemyInstance.hp - damage);
    await enemyInstance.save();
    // 如果敌人死亡
    if (enemyInstance.hp === 0) {
      const { droppedMaterials } = await this.handleEnemyDeath(enemyInstance._id.toString());
      return {
        result: 'enemy_dead' as const,
        damage,
        isCritical,
        remainingHp: 0,
        droppedMaterials,
        counterDamage: 0,
        isCounterCritical: false
      };
    }
    // 敌人逃跑：敌人血量降低至50%以下，且根据暴躁值计算概率，以确定是否逃跑
    const isHpOk = enemyInstance.hp / enemyStats.max_hp < 0.5
    const isRageOk = Math.random() < (1 - enemyStats.rage / 10)
    const isEscapeOk = enemyStats.escape > playerStats.escape
    if (isHpOk && isRageOk && isEscapeOk) {
      // 逃跑的敌人位置重新随机
      enemyInstance.locationIndex = Math.floor(Math.random() * 100);
      await enemyInstance.save();
      return {
        result: 'enemy_flee' as const,
        damage,
        isCritical,
        remainingHp: 0,
        droppedMaterials: [],
        counterDamage: 0,
        isCounterCritical: false
      }
    }
    // 敌人反击
    const { damage: counterDamage, isCritical: isCounterCritical } = this.calculateDamage(enemyStats, playerStats);
    return {
      result: 'continue' as const,
      damage,
      isCritical,
      remainingHp: enemyInstance.hp,
      droppedMaterials: [],
      counterDamage,
      isCounterCritical
    }
  }

  // 处理敌对生物主动攻击
  private static async onlySingleEnemyAttackPlayer(playerStats:  Omit<CombatStats, 'rage'>, enemyInstance: Awaited<ReturnType<typeof LocationService.generateEnemies>>[number]) {
    const enemyStats = await this.calculateCombatStats(enemyInstance._id.toString())

    // 生物感知能力是否比玩家低，不主动攻击
    if (enemyStats.perception - playerStats.stealth <= playerStats.perception - enemyStats.stealth) {
      return {
        result: 'deactive_attack' as const,
        damage: 0,
        isCritical: false,
        remainingHp: enemyInstance.hp,
        counterDamage: 0,
        isCounterCritical: false,
        droppedMaterials: []
      }
    }
    // 根据暴躁值计算主动攻击概率
    if (Math.random() >= enemyStats.rage / 10) {
      return {
        result: 'deactive_attack' as const,
        damage: 0,
        isCritical: false,
        remainingHp: enemyInstance.hp,
        counterDamage: 0,
        isCounterCritical: false,
        droppedMaterials: []
      }
    }
    const { damage: counterDamage, isCritical: isCounterCritical } = this.calculateDamage(enemyStats, playerStats);
    return {
      result: 'active_attack' as const,
      damage: 0,
      isCritical: false,
      remainingHp: enemyInstance.hp,
      counterDamage,
      isCounterCritical,
      droppedMaterials: []
    }
  }

  /**
   * 计算伤害
   * @param attackerStats 攻击者属性
   * @param defenderStats 防御者属性
   * @returns 伤害计算结果，包含伤害值和是否暴击
   */
  private static calculateDamage(attackerStats: Omit<CombatStats, 'rage'>, defenderStats: Omit<CombatStats, 'rage'>): DamageResult {
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
        return {
          droppedMaterials: []
        }
      }

      // 使用CreatureService计算掉落物品
      const droppedMaterials = await CreatureService.calculateDrops(enemyInstance.creatureId._id);

      return {
        droppedMaterials
      };
    } catch (error: any) {
      console.error(error)
      return {
        droppedMaterials: []
      }
    }
  }
} 