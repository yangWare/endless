import { Player } from '../models/Player';
import { Types, Document, Schema } from 'mongoose';
import { Material } from '../models/Material';
import { MaterialService } from './MaterialService';

interface Equipment {
  name: string;
  level: number;
  slot: 'weapon' | 'armor' | 'accessory' | 'helmet' | 'boots';
  combatStats: {
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
}

type PlayerDocument = Document & {
  inventory?: {
    materials: Types.ObjectId[];
    potions: Types.ObjectId[];
    equipments: Equipment[];
  };
};

// 玩家初始战斗属性
const INITIAL_COMBAT_STATS = {
  max_hp: 100,
  attack: 10,
  defense: 5,
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
          equipments: [] as Equipment[]
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
} 