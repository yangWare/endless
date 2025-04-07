import { Player, IEquipment, PlayerDocument } from '../models/Player';
import { Types } from 'mongoose';
import { Material } from '../models/Material';
import { MapService } from './MapService';
import { LocationService } from './LocationService';

// 玩家初始战斗属性
const INITIAL_COMBAT_STATS = {
  max_hp: 10,
  attack: 2,
  defense: 1,
  crit_rate: 0.05,
  crit_resist: 0.05,
  crit_damage: 1.5,
  crit_damage_resist: 0.1,
  hit_rate: 0.9,
  dodge_rate: 0.1
};

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

export class PlayerService {
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
        currentMap: firstMap._id,
        currentLocation: firstMap.startLocationId,
        levelInfo: {
          level: 1,
          exp: 0
        },
        inventory: {
          materials: [],
          potions: [],
          equipments: []
        },
        equipped: {
          weapon: null,
          armor: null,
          accessory: null,
          helmet: null,
          boots: null
        }
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
      
      // 计算基础属性（初始属性 * 等级）
      const baseStats: CombatStats = {
        max_hp: INITIAL_COMBAT_STATS.max_hp * playerLevel,
        attack: INITIAL_COMBAT_STATS.attack * playerLevel,
        defense: INITIAL_COMBAT_STATS.defense * playerLevel,
        crit_rate: INITIAL_COMBAT_STATS.crit_rate * playerLevel,
        crit_resist: INITIAL_COMBAT_STATS.crit_resist * playerLevel,
        crit_damage: INITIAL_COMBAT_STATS.crit_damage * playerLevel,
        crit_damage_resist: INITIAL_COMBAT_STATS.crit_damage_resist * playerLevel,
        hit_rate: INITIAL_COMBAT_STATS.hit_rate * playerLevel,
        dodge_rate: INITIAL_COMBAT_STATS.dodge_rate * playerLevel
      };

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
        dodge_rate: 0
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
        dodge_rate: baseStats.dodge_rate + equipmentStats.dodge_rate
      };

      return finalStats;
    } catch (error: any) {
      throw new Error(`计算玩家战斗属性失败: ${error.message}`);
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
      const playerStats = await this.calculateCombatStats(playerId);
      const currentHp = playerStats.max_hp - damage;

      // 如果玩家死亡
      if (currentHp <= 0) {
        // TODO: 处理玩家死亡逻辑
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

      // 更新玩家材料列表
      const materials = player.inventory?.materials || [];
      const existingMaterialIndex = materials.findIndex(
        (m: Types.ObjectId) => m.toString() === materialId
      );

      if (existingMaterialIndex >= 0) {
        // 如果材料已存在，更新数量
        materials[existingMaterialIndex] = new Types.ObjectId(materialId);
      } else {
        // 如果材料不存在，添加到列表
        materials.push(new Types.ObjectId(materialId));
      }

      if (player.inventory) {
        player.inventory.materials = materials;
        await player.save();
      }
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
        await this.addMaterialToInventory(playerId, material.materialId.toString(), material.quantity);
      }
    } catch (error: any) {
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

      // 更新玩家位置
      const player = await Player.findByIdAndUpdate(
        playerId,
        {
          currentMap: mapId,
          currentLocation: locationId
        },
        { new: true }
      );

      if (!player) {
        throw new Error('玩家不存在');
      }

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
            accessory: null,
            helmet: null,
            boots: null
          };
        }
        player.equipped.armor = equipment;
      } else if (equipment.slot === 'accessory') {
        if (player.equipped && player.equipped.accessory) {
          player.inventory.equipments.push(player.equipped.accessory);
        }
        if (!player.equipped) {
          player.equipped = {
            weapon: null,
            armor: null,
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
} 