import { Player, IEquipment, PlayerDocument } from '../models/Player';
import { Types } from 'mongoose';
import { Material } from '../models/Material';
import { MapService } from './MapService';
import { LocationService } from './LocationService';
import { PotionService } from './PotionService';
import { DroppedMaterial } from './CreatureService';
import { EnemyInstance } from '../models/EnemyInstance';
import { EnemyInstanceService } from './EnemyInstanceService';

// 心法配置
export const HEART_SKILL_CONFIG = {
  ['燧石锻造传承']: {
    base: {
      max_hp: 100,
      attack: 4,
      defense: 1,
      crit_rate: 0,
      crit_resist: 0,
      crit_damage: 0,
      crit_damage_resist: 0,
      hit_rate: 0,
      dodge_rate: 0,
      perception: 0,
      stealth: 0,
      escape: 0
    },
    multiplier: {
      max_hp: 1,
      attack: 1,
      defense: 1,
      crit_rate: 0,
      crit_resist: 0,
      crit_damage: 0,
      crit_damage_resist: 0,
      hit_rate: 0,
      dodge_rate: 0,
      perception: 0,
      stealth: 0,
      escape: 0
    },
    // 升级方法
    upgrade: (exp: number, curLevel: number) => {
      // 100 * 2的等级次方
      const needExp = 100 * Math.pow(2, curLevel);
      if (exp >= needExp) {
        return {
          level: curLevel + 1,  
          exp: exp - needExp
        }
      }
      return {
        level: curLevel,
        exp: exp
      }
    }
  }
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
}

export class PlayerService {
  /**
   * 获取玩家的初始状态
   * @param firstMap 第一张地图
   * @returns 玩家的初始状态
   */
  private static getInitialPlayerState(firstMap: any) {
    return {
      hp: 200,
      coins: 0,
      levelInfo: {
        level: 1,
        exp: 0
      },
      inventory: {
        materials: [] as Types.ObjectId[],
        potions: [] as Types.ObjectId[],
        equipments: [] as any
      },
      currentMap: firstMap._id,
      currentLocation: firstMap.startLocationId,
      currentLocationIndex: 0,
      equipped: {
        weapon: {
          id: `default_weapon_${Date.now()}`,
          name: `木剑`,
          slot: 'weapon',
          level: 1,
          combatStats: {
            max_hp: 0,
            attack: 2,
            defense: 0,
            crit_rate: 1,
            crit_resist: 0,
            crit_damage: 1,
            crit_damage_resist: 0,
            hit_rate: 0,
            dodge_rate: 0
          }
        },
        armor: {
          id: `default_armor_${Date.now()}`,
          name: `兽皮短衣`,
          slot: 'armor',
          level: 1,
          combatStats: {
            max_hp: 30,
            attack: 0,
            defense: 1,
            crit_rate: 0,
            crit_resist: 0,
            crit_damage: 0,
            crit_damage_resist: 0,
            hit_rate: 0,
            dodge_rate: 0
          }
        },
        wrist: {
          id: `default_wrist_${Date.now()}`,
          name: `藤蔓手镯`,
          slot: 'wrist',
          level: 1,
          combatStats: {
            max_hp: 10,
            attack: 0,
            defense: 1,
            crit_rate: 0,
            crit_resist: 0,
            crit_damage: 0,
            crit_damage_resist: 0,
            hit_rate: 0,
            dodge_rate: 1
          }
        },
        accessory: {
          id: `default_accessory_${Date.now()}`,
          name: `羽毛挂坠`,
          slot: 'accessory',
          level: 1,
          combatStats: {
            max_hp: 10,
            attack: 1,
            defense: 0,
            crit_rate: 1,
            crit_resist: 0,
            crit_damage: 1,
            crit_damage_resist: 0,
            hit_rate: 1,
            dodge_rate: 0
          }
        },
        helmet: {
          id: `default_helmet_${Date.now()}`,
          name: `藤帽`,
          slot: 'helmet',
          level: 1,
          combatStats: {
            max_hp: 50,
            attack: 0,
            defense: 1,
            crit_rate: 0,
            crit_resist: 0,
            crit_damage: 0,
            crit_damage_resist: 0,
            hit_rate: 0,
            dodge_rate: 0
          }
        },
        boots: {
          id: `default_boots_${Date.now()}`,
          name: `藤鞋`,
          slot: 'boots',
          level: 1,
          combatStats: {
            max_hp: 0,
            attack: 0,
            defense: 0,
            crit_rate: 0,
            crit_resist: 0,
            crit_damage: 0,
            crit_damage_resist: 0,
            hit_rate: 1,
            dodge_rate: 1
          }
        }
      },
      heartSkills: [{
        name: '燧石锻造传承',
        level: 1,
        exp: 0
      }],
      fightingEnemies: []
    };
  }

  /**
   * 创建新玩家
   * @param username 账号
   * @param password 密码
   * @param nickname 昵称
   * @returns 新创建的玩家
   */
  static async createPlayer(username: string, password: string, nickname: string) {
    try {
      // 检查用户名是否已存在
      const existingPlayer = await Player.findOne({ username });
      if (existingPlayer) {
        throw new Error('用户名已存在');
      }

      // 检查昵称是否已存在
      const existingNickname = await Player.findOne({ nickname });
      if (existingNickname) {
        throw new Error('昵称已存在');
      }

      // 获取第一张地图
      const firstMap = await MapService.getFirstMap();
      if (!firstMap) {
        throw new Error('没有可用的地图');
      }

      if (!firstMap.startLocationId) {
        throw new Error('地图没有设置起始点');
      }

      // 创建新玩家
      const newPlayer = new Player({
        username,
        password,
        nickname,
        ...this.getInitialPlayerState(firstMap)
      });

      await newPlayer.save();
      return newPlayer;
    } catch (error: any) {
      throw new Error(`创建玩家失败: ${error.message}`);
    }
  }

  /**
   * 通过账号密码获取玩家信息
   * @param username 账号
   * @param password 密码
   * @returns 玩家信息，如果验证失败则返回 null
   */
  static async getPlayerByCredentials(username: string, password: string) {
    try {
      const player = await Player.findOne({ username, password });
      return player;
    } catch (error: any) {
      throw new Error(`获取玩家信息失败: ${error.message}`);
    }
  }

  /**
   * 计算玩家的战斗属性
   * @param playerId 玩家ID
   * @returns 计算后的战斗属性
   */
  static async calculateCombatStats(playerId: string): Promise<CombatStats> {
    try {
      const player = await Player.findById(playerId);
      
      if (!player) {
        throw new Error('玩家不存在');
      }

      if (!player.levelInfo) {
        throw new Error('玩家等级信息不存在');
      }

      const playerLevel = player.levelInfo.level;
      
      // 基础属性
      const baseStats: CombatStats = {
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
        escape: 0
      };

      // 遍历心法，计算战斗属性
      player.heartSkills.forEach(heartSkill => {
        const heartSkillName = heartSkill.name;
        const heartSkillCombatStats = HEART_SKILL_CONFIG[heartSkillName as keyof typeof HEART_SKILL_CONFIG];
        if (heartSkillCombatStats) {
          baseStats.max_hp += heartSkillCombatStats.base.max_hp * playerLevel * heartSkillCombatStats.multiplier.max_hp;
          baseStats.attack += heartSkillCombatStats.base.attack * playerLevel * heartSkillCombatStats.multiplier.attack;
          baseStats.defense += heartSkillCombatStats.base.defense * playerLevel * heartSkillCombatStats.multiplier.defense;
          baseStats.crit_rate += heartSkillCombatStats.base.crit_rate * playerLevel * heartSkillCombatStats.multiplier.crit_rate;
          baseStats.crit_resist += heartSkillCombatStats.base.crit_resist * playerLevel * heartSkillCombatStats.multiplier.crit_resist;
          baseStats.crit_damage += heartSkillCombatStats.base.crit_damage * playerLevel * heartSkillCombatStats.multiplier.crit_damage;
          baseStats.crit_damage_resist += heartSkillCombatStats.base.crit_damage_resist * playerLevel * heartSkillCombatStats.multiplier.crit_damage_resist;
          baseStats.hit_rate += heartSkillCombatStats.base.hit_rate * playerLevel * heartSkillCombatStats.multiplier.hit_rate;
          baseStats.dodge_rate += heartSkillCombatStats.base.dodge_rate * playerLevel * heartSkillCombatStats.multiplier.dodge_rate;
          baseStats.perception += heartSkillCombatStats.base.perception * playerLevel * heartSkillCombatStats.multiplier.perception;
          baseStats.stealth += heartSkillCombatStats.base.stealth * playerLevel * heartSkillCombatStats.multiplier.stealth;
          baseStats.escape += heartSkillCombatStats.base.escape * playerLevel * heartSkillCombatStats.multiplier.escape;
        }
      });

      // 计算装备加成
      const equipmentStats: CombatStats = {
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
        escape: 0
      };

      // 累加所有装备的属性
      const equippedItems = Object.values(player.equipped || {});
      equippedItems.forEach(equipment => {
        if (equipment && equipment.combatStats) {
          equipmentStats.max_hp += equipment.combatStats.max_hp;
          equipmentStats.attack += equipment.combatStats.attack;
          equipmentStats.defense += equipment.combatStats.defense;
          equipmentStats.crit_rate += equipment.combatStats.crit_rate;
          equipmentStats.crit_resist += equipment.combatStats.crit_resist;
          equipmentStats.crit_damage += equipment.combatStats.crit_damage;
          equipmentStats.crit_damage_resist += equipment.combatStats.crit_damage_resist;
          equipmentStats.hit_rate += equipment.combatStats.hit_rate;
          equipmentStats.dodge_rate += equipment.combatStats.dodge_rate;
          equipmentStats.perception += equipment.combatStats.perception;
          equipmentStats.stealth += equipment.combatStats.stealth;
          equipmentStats.escape += equipment.combatStats.escape;
        }
      });

      // 合并基础属性和装备加成
      const finalStats: CombatStats = {
        max_hp: baseStats.max_hp + equipmentStats.max_hp,
        attack: baseStats.attack + equipmentStats.attack,
        defense: baseStats.defense + equipmentStats.defense,
        crit_rate: baseStats.crit_rate + equipmentStats.crit_rate,
        crit_resist: baseStats.crit_resist + equipmentStats.crit_resist,
        crit_damage: baseStats.crit_damage + equipmentStats.crit_damage,
        crit_damage_resist: baseStats.crit_damage_resist + equipmentStats.crit_damage_resist,
        hit_rate: baseStats.hit_rate + equipmentStats.hit_rate,
        dodge_rate: baseStats.dodge_rate + equipmentStats.dodge_rate,
        perception: baseStats.perception + equipmentStats.perception,
        stealth: baseStats.stealth + equipmentStats.stealth,
        escape: baseStats.escape + equipmentStats.escape
      };

      return finalStats;
    } catch (error: any) {
      throw new Error(`计算玩家战斗属性失败: ${error.message}`);
    }
  }

  /**
   * 处理攻击后玩家状态：包括受伤状态、材料情况、敌人战斗列表
   */
  static async handlePlayerStatusAfterAttack(playerId: string, attackRes: Record<string, {
    // 结果字符串
    result: 'enemy_dead' | 'continue' | 'enemy_flee' | 'enemy_lock_by_other' | 'active_attack' | 'deactive_attack';
    // 怪物攻击伤害
    counterDamage: number;
    // 怪物掉落物品
    droppedMaterials: DroppedMaterial[];
  }>) {
    try {
      const player = await Player.findById(playerId) as PlayerDocument;
      if (!player) {
        throw new Error('玩家不存在');
      }

      // 上一次战斗敌人列表
      const prevEnemyIds = player.fightingEnemies
      const newEnemyIds: typeof player.fightingEnemies = []

      // 计算结算结果：血量、背包掉落物、战斗中敌人列表
      let totalCounterDamage = 0
      const totalDroppedMaterials: DroppedMaterial[] = []
      for (const instanceId in attackRes) {
        const resItem = attackRes[instanceId]
        totalCounterDamage += resItem.counterDamage
        totalDroppedMaterials.push(...resItem.droppedMaterials)
        // 被锁定，则取上一次战斗结果
        if (resItem.result === 'enemy_lock_by_other') {
          const prevEnemyId = prevEnemyIds.find(id => id.toString() === instanceId)
          if (prevEnemyId) {
            newEnemyIds.push(prevEnemyId)
          }
        } else if (['continue', 'active_attack'].includes(resItem.result)) {
          newEnemyIds.push(new Types.ObjectId(instanceId))
        }
      }

      // 更新敌人列表
      player.fightingEnemies = newEnemyIds

      // 计算玩家当前HP
      const currentHp = Math.max(0, player.hp - totalCounterDamage);
      player.hp = currentHp;
      // 玩家死亡不再处理材料
      if (player.hp <= 0) {
        await player.save();
        return
      }

      // 批量添加材料到背包
      // 确保inventory存在
      if (!player.inventory) {
        player.inventory = {
          materials: [] as Types.ObjectId[],
          potions: [] as Types.ObjectId[],
          equipments: [] as IEquipment[]
        };
      }
      player.inventory.materials = [...player.inventory.materials, ...totalDroppedMaterials.map(item => item.materialId)];
      await player.save();
    } catch (error: any) {
      throw new Error(`处理玩家攻击结算失败: ${error.message}`);
    }
  }

  /**
   * 处理玩家受伤
   * @param playerId 玩家ID
   * @param damage 伤害值
   * @returns 玩家是否死亡
   */
  static async handlePlayerDamage(playerId: string, damage: number): Promise<boolean> {
    try {
      const player = await Player.findById(playerId);
      if (!player) {
        throw new Error('玩家不存在');
      }

      // 计算玩家当前HP
      const currentHp = player.hp - damage;
      player.hp = currentHp;

      await player.save();

      // 如果玩家死亡
      if (currentHp <= 0) {
        return true;
      }

      return false;
    } catch (error: any) {
      throw new Error(`处理玩家受伤失败: ${error.message}`);
    }
  }

  /**
   * 添加材料到玩家背包
   * @param playerId 玩家ID
   * @param materialId 材料ID
   * @param quantity 数量
   */
  static async addMaterialToInventory(playerId: string, materialId: string, quantity: number) {
    try {
      const player = await Player.findById(playerId) as PlayerDocument;
      if (!player) {
        throw new Error('玩家不存在');
      }

      // 检查材料是否存在
      const material = await Material.findById(materialId);
      if (!material) {
        throw new Error('材料不存在');
      }

      // 确保inventory存在
      if (!player.inventory) {
        player.inventory = {
          materials: [] as Types.ObjectId[],
          potions: [] as Types.ObjectId[],
          equipments: [] as IEquipment[]
        };
      }

      player.inventory.materials = [...player.inventory.materials, new Types.ObjectId(materialId)];
      await player.save();
    } catch (error: any) {
      throw new Error(`添加材料到背包失败: ${error.message}`);
    }
  }

  /**
   * 批量添加材料到玩家背包
   * @param playerId 玩家ID
   * @param materials 材料列表
   */
  static async addMaterialsToInventory(playerId: string, materials: { materialId: Types.ObjectId; quantity: number }[]) {
    try {
      for (const material of materials) {
        await this.addMaterialToInventory(playerId, material.materialId._id.toString(), material.quantity);
      }
    } catch (error: any) {
      console.log(error)
      throw new Error(`批量添加材料到背包失败: ${error.message}`);
    }
  }

  /**
   * 更新玩家位置
   * @param playerId 玩家ID
   * @param mapId 地图ID
   * @param locationId 地点ID
   */
  static async updatePlayerLocation(playerId: string, mapId: string, locationId: string) {
    try {
      // 验证地图是否存在
      const map = await MapService.getMapById(mapId);
      if (!map) {
        throw new Error('地图不存在');
      }

      // 验证地点是否存在
      const location = await LocationService.getLocationById(locationId);
      if (!location) {
        throw new Error('地点不存在');
      }

      // 验证地点是否属于该地图
      if (location.mapId.toString() !== mapId) {
        throw new Error('该地点不属于指定地图');
      }

      const player = await Player.findById(playerId)
      if (!player) {
        throw new Error('玩家不存在');
      }

      if (player.currentMap.toString() === mapId && player.currentLocation.toString() === locationId) {
        throw new Error('玩家已处于目标位置');
      }

      const newLocationIndex = Math.floor(Math.random() * location.size)
      player.currentMap = new Types.ObjectId(mapId)
      player.currentLocation = new Types.ObjectId(locationId)
      player.currentLocationIndex = newLocationIndex

      await player.save()

      return player;
    } catch (error: any) {
      throw new Error(`更新玩家位置失败: ${error.message}`);
    }
  }

  /**
   * 获取玩家当前位置信息
   * @param playerId 玩家ID
   */
  static async getPlayerLocation(playerId: string) {
    try {
      const player = await Player.findById(playerId)
        .populate('currentMap')
        .populate('currentLocation');

      if (!player) {
        throw new Error('玩家不存在');
      }

      return {
        map: player.currentMap,
        location: player.currentLocation
      };
    } catch (error: any) {
      throw new Error(`获取玩家位置失败: ${error.message}`);
    }
  }

  /**
   * 穿戴装备
   * @param playerId 玩家ID
   * @param equipmentId 要穿戴的装备ID
   * @returns 更新后的玩家信息
   */
  static async equipItem(playerId: string, equipmentId: string) {
    try {
      const player = await Player.findById(playerId) as PlayerDocument;
      if (!player) {
        throw new Error('玩家不存在');
      }

      // 确保inventory存在
      if (!player.inventory) {
        throw new Error('玩家背包不存在');
      }

      // 在背包中查找装备
      const equipmentIndex = player.inventory.equipments.findIndex(
        (equip) => equip.id === equipmentId
      );

      if (equipmentIndex === -1) {
        throw new Error('装备不存在于玩家背包中');
      }

      const equipment = player.inventory.equipments[equipmentIndex];
      
      // 处理不同的装备槽位
      if (equipment.slot === 'weapon') {
        if (player.equipped && player.equipped.weapon) {
          player.inventory.equipments.push(player.equipped.weapon);
        }
        if (!player.equipped) {
          player.equipped = {
            weapon: null,
            armor: null,
            wrist: null,
            accessory: null,
            helmet: null,
            boots: null
          };
        }
        player.equipped.weapon = equipment;
      } else if (equipment.slot === 'armor') {
        if (player.equipped && player.equipped.armor) {
          player.inventory.equipments.push(player.equipped.armor);
        }
        if (!player.equipped) {
          player.equipped = {
            weapon: null,
            armor: null,
            wrist: null,
            accessory: null,
            helmet: null,
            boots: null
          };
        }
        player.equipped.armor = equipment;
      } else if (equipment.slot === 'wrist') {
        if (player.equipped && player.equipped.wrist) {
          player.inventory.equipments.push(player.equipped.wrist);
        }
        if (!player.equipped) {
          player.equipped = {
            weapon: null,
            armor: null,
            wrist: null,
            accessory: null,
            helmet: null,
            boots: null
          };
        }
        player.equipped.wrist = equipment;
      } else if (equipment.slot === 'accessory') {
        if (player.equipped && player.equipped.accessory) {
          player.inventory.equipments.push(player.equipped.accessory);
        }
        if (!player.equipped) {
          player.equipped = {
            weapon: null,
            armor: null,
            wrist: null,
            accessory: null,
            helmet: null,
            boots: null
          };
        }
        player.equipped.accessory = equipment;
      } else if (equipment.slot === 'helmet') {
        if (player.equipped && player.equipped.helmet) {
          player.inventory.equipments.push(player.equipped.helmet);
        }
        if (!player.equipped) {
          player.equipped = {
            weapon: null,
            armor: null,
            wrist: null,
            accessory: null,
            helmet: null,
            boots: null
          };
        }
        player.equipped.helmet = equipment;
      } else if (equipment.slot === 'boots') {
        if (player.equipped && player.equipped.boots) {
          player.inventory.equipments.push(player.equipped.boots);
        }
        if (!player.equipped) {
          player.equipped = {
            weapon: null,
            armor: null,
            wrist: null,
            accessory: null,
            helmet: null,
            boots: null
          };
        }
        player.equipped.boots = equipment;
      } else {
        throw new Error(`无效的装备槽位: ${equipment.slot}`);
      }

      // 从背包中移除该装备
      player.inventory.equipments.splice(equipmentIndex, 1);

      await player.save();
      return player;
    } catch (error: any) {
      throw new Error(`穿戴装备失败: ${error.message}`);
    }
  }

  /**
   * 删除玩家
   * @param username 用户名
   * @param password 密码
   * @returns 删除是否成功
   */
  static async deletePlayer(username: string, password: string): Promise<boolean> {
    try {
      // 先验证用户名和密码
      const player = await Player.findOne({ username, password });
      if (!player) {
        throw new Error('用户名或密码错误');
      }

      // 删除玩家
      const result = await Player.findByIdAndDelete(player._id);
      return result !== null;
    } catch (error: any) {
      throw new Error(`删除玩家失败: ${error.message}`);
    }
  }

  /**
   * 复活玩家
   * @param playerId 玩家ID
   * @returns 复活后的玩家信息
   */
  static async revivePlayer(playerId: string) {
    try {
      const player = await Player.findById(playerId);
      if (!player) {
        throw new Error('玩家不存在');
      }

      // 获取第一张地图
      const firstMap = await MapService.getFirstMap();
      if (!firstMap) {
        throw new Error('没有可用的地图');
      }

      if (!firstMap.startLocationId) {
        throw new Error('地图没有设置起始点');
      }

      // 重置玩家状态为初始状态
      Object.assign(player, this.getInitialPlayerState(firstMap));

      await player.save();
      return player;
    } catch (error: any) {
      throw new Error(`复活玩家失败: ${error.message}`);
    }
  }

  /**
   * 使用药水
   * @param playerId 玩家ID
   * @param potionId 药水ID
   * @returns 使用药水后的玩家信息
   */
  static async usePotion(playerId: string, potionId: string) {
    try {
      // 获取药水信息
      const potion = await PotionService.getPotionById(potionId);
      if (!potion) {
        throw new Error('药水不存在');
      }

      // 获取玩家信息
      const player = await Player.findById(playerId)
      if (!player) {
        throw new Error('玩家不存在');
      }

      // 检查玩家是否拥有该药水
      const potionIndex = player.inventory?.potions.findIndex(
        (id: Types.ObjectId) => id.toString() === potionId
      );
      if (potionIndex === undefined || potionIndex === -1) {
        throw new Error('玩家没有该药水');
      }

      let newHp = 0
      // 应用药水效果
      if (potion.effect?.type === 'hp') {
        // 恢复生命值
        const maxHp = await PlayerService.calculateCombatStats(playerId);
        newHp = Math.min(player.hp + potion.effect.value, maxHp.max_hp);
        player.hp = newHp;
      } else {
        // 其他效果暂时不支持
        throw new Error('不支持该类型的药水效果');
      }

      // 从背包中移除药水
      player.inventory!.potions.splice(potionIndex, 1);
      await player.save();
      return newHp;
    } catch (error: any) {
      throw new Error(`使用药水失败: ${error.message}`);
    }
  }

  static async escapeFromBattle(playerId: string): Promise<boolean> {
    const player = await Player.findById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    if (!player.fightingEnemies || player.fightingEnemies.length === 0) {
      return true; // 如果玩家没有在战斗中，直接返回true
    }

    const getAllEnemiesCombatStats = async () => {
      const enemiesCombatStats: Array<{
        escape: number
      }> = []
      for (const enemyId of player.fightingEnemies) {
        try {
          const enemyCombatStats = await EnemyInstanceService.calculateCombatStats(enemyId.toString())
          enemiesCombatStats.push(enemyCombatStats)
        } catch (error) {
          console.warn(`获取${enemyId.toString()}异常，已过滤`)
        }
      }
      return enemiesCombatStats
    }

    // 获取所有战斗中的敌人战斗属性
    const allEnemiesCombatStats = await getAllEnemiesCombatStats()

    if (!allEnemiesCombatStats || allEnemiesCombatStats.length === 0) {
      // 如果找不到敌人战斗属性，清理战斗状态并返回true
      player.fightingEnemies = [];
      await player.save();
      return true;
    }

    const playerCombatStats = await this.calculateCombatStats(playerId)
    const playerEscape = playerCombatStats.escape

    // 检查是否所有敌人的escape值都小于玩家的escape值
    const canEscape = allEnemiesCombatStats.every(enemyCombatStats => {
      return playerCombatStats.escape > enemyCombatStats.escape
    });

    if (canEscape) {
      // 如果可以脱战，清理战斗状态
      player.fightingEnemies = [];
      await player.save();
    }

    return canEscape;
  }
} 