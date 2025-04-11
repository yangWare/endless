import { Location } from '../models/Location';
import { Types } from 'mongoose';
import { IEquipment } from '../models/Player';
import { MaterialService } from './MaterialService';
import { Material } from '../models/Material';
import { MaterialType } from '../models/MaterialType';
import { Player, PlayerDocument } from '../models/Player';

export interface ShopPotionItem {
  potionId: Types.ObjectId;
  price: number;
}

// 战斗属性类型接口
type CombatStats = IEquipment['combatStats']

// 战斗属性价格映射配置
const combatStatPriceMap: Record<keyof CombatStats, number> = {
  max_hp: 0.1,
  attack: 2,
  defense: 1,
  crit_rate: 300,  
  crit_resist: 150,
  crit_damage: 300,
  crit_damage_resist: 150,
  hit_rate: 200,
  dodge_rate: 200
};

export class ShopService {
  /**
   * 获取商店的药水列表
   */
  static async getShopPotions(locationId: string) {
    try {
      const location = await Location.findById(locationId)
        .populate({
          path: 'npc.shop.potionItems.potionId',
          model: 'Potion'
        });

      if (!location) {
        throw new Error('地点不存在');
      }

      return location.npc?.shop?.potionItems || [];
    } catch (error: any) {
      throw new Error(`获取商店药水列表失败: ${error.message}`);
    }
  }

  /**
   * 计算装备价格
   * @param equipment 装备对象
   * @returns 计算出的价格
   */
  static calculateEquipmentPrice(equipment: IEquipment): number {
    let totalPrice = 0;
    const combatStats = equipment.combatStats;

    // 根据战斗属性计算价格
    (Object.keys(combatStats) as Array<keyof CombatStats>).forEach(stat => {
      if (combatStatPriceMap[stat] && combatStats[stat] > 0) {
        totalPrice += combatStats[stat] * combatStatPriceMap[stat];
      }
    });

    return Math.floor(totalPrice);
  }

  /**
   * 计算材料价格
   * @param materialId 材料ID
   * @returns 计算出的价格
   */
  static async calculateMaterialPrice(materialId: string): Promise<number> {
    try {
      const material = await Material.findById(materialId);
      if (!material) {
        throw new Error('材料不存在');
      }

      const combatStats = await MaterialService.calculateMaterialCombatStats(materialId) as CombatStats;
      let totalPrice = 0;

      // 根据战斗属性计算价格
      (Object.keys(combatStats) as Array<keyof CombatStats>).forEach(stat => {
        if (combatStatPriceMap[stat] && combatStats[stat] > 0) {
          totalPrice += combatStats[stat] * combatStatPriceMap[stat];
        }
      });

      // 考虑材料等级的抑制作用 - 等级越高,锻造难度越大,价格越低
      const levelPenalty = Math.max(0.5, 0.8 - (material.level - 1) * 0.05); // 最低降低到原价的50%
      totalPrice *= levelPenalty;

      return Math.floor(totalPrice);
    } catch (error: any) {
      throw new Error(`计算材料价格失败: ${error.message}`);
    }
  }

  /**
   * 出售物品给商店
   * @param playerId 玩家ID
   * @param locationId 地点ID
   * @param item 出售的物品（装备或材料ID）
   * @param count 出售的数量
   * @returns 出售价格
   */
  static async sellItem(playerId: string, locationId: string, item: IEquipment | string, count: number = 1): Promise<number> {
    try {
      const location = await Location.findById(locationId);
      if (!location) {
        throw new Error('地点不存在');
      }

      if (!location.npc?.shop) {
        throw new Error('该地点没有商店');
      }

      const player = await Player.findById(playerId) as PlayerDocument;
      if (!player) {
        throw new Error('玩家不存在');
      }

      // 确保inventory存在
      if (!player.inventory) {
        player.inventory = {
          materials: [] as Types.ObjectId[],
          potions: [] as Types.ObjectId[],
          equipments: [] as IEquipment[]
        };
      }

      let price: number;

      // 判断物品类型并计算价格
      if (typeof item === 'string') {
        // 材料
        // 检查玩家是否拥有足够数量的材料
        const materialCount = player.inventory.materials.filter(id => id.toString() === item).length;
        if (materialCount < count) {
          throw new Error(`玩家背包中只有${materialCount}个该材料，不足以出售${count}个`);
        }
        price = await this.calculateMaterialPrice(item) * count;
        
        // 从玩家背包中移除指定数量的材料
        let remainingCount = count;
        player.inventory.materials = player.inventory.materials.filter(id => {
          if (remainingCount > 0 && id.toString() === item) {
            remainingCount--;
            return false;
          }
          return true;
        });
      } else {
        // 装备
        // 检查玩家是否拥有该装备
        if (!player.inventory.equipments.some(equip => equip.id === item.id)) {
          throw new Error('玩家背包中没有该装备');
        }
        price = this.calculateEquipmentPrice(item);

        // 从玩家背包中移除装备
        const equipmentIndex = player.inventory.equipments.findIndex(equip => equip.id === item.id);
        if (equipmentIndex !== -1) {
          player.inventory.equipments.splice(equipmentIndex, 1);
        }
      }

      // 更新玩家金币
      player.coins += price;
      await player.save();

      return price;
    } catch (error: any) {
      throw new Error(`出售物品失败: ${error.message}`);
    }
  }

  /**
   * 购买药品
   * @param playerId 玩家ID
   * @param locationId 地点ID
   * @param potionId 药品ID
   * @returns 购买花费的金币数
   */
  static async buyPotion(playerId: string, locationId: string, potionId: string): Promise<number> {
    try {
      // 验证地点和商店
      const location = await Location.findById(locationId)
        .populate({
          path: 'npc.shop.potionItems.potionId',
          model: 'Potion'
        });

      if (!location) {
        throw new Error('地点不存在');
      }

      if (!location.npc?.shop) {
        throw new Error('该地点没有商店');
      }

      // 查找商店中的药品
      const potionItem = location.npc.shop.potionItems.find(
        item => item.potionId._id.toString() === potionId
      );

      if (!potionItem) {
        throw new Error('商店中没有该药品');
      }

      // 验证玩家
      const player = await Player.findById(playerId) as PlayerDocument;
      if (!player) {
        throw new Error('玩家不存在');
      }

      // 验证玩家金币是否足够
      if (player.coins < potionItem.price) {
        throw new Error('金币不足');
      }

      // 确保inventory存在
      if (!player.inventory) {
        player.inventory = {
          materials: [] as Types.ObjectId[],
          potions: [] as Types.ObjectId[],
          equipments: [] as IEquipment[]
        };
      }

      // 扣除金币并添加药品到背包
      player.coins -= potionItem.price;
      player.inventory.potions.push(new Types.ObjectId(potionId));
      await player.save();

      return potionItem.price;
    } catch (error: any) {
      throw new Error(`购买药品失败: ${error.message}`);
    }
  }
} 