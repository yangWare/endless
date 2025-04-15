import { Player, IEquipment } from '../models/Player';
import { Material, MaterialDocument } from '../models/Material';
import { Location } from '../models/Location';
import mongoose from 'mongoose';

interface ForgeResult {
  success: boolean;
  message: string;
  equipment?: IEquipment;
  forgeCost: number;
}

interface ForgeParams {
  playerId: string;
  locationId: string;
  materialIds: string[];
  equipmentType: 'weapon' | 'armor' | 'accessory' | 'helmet' | 'boots';
}

const EQUIPMENT_LEVELS_CONFIG = {
  1: {
    "name": "普通的",
    "multiplier": 0.5,
    "chance": 0.4399
  },
  2: {
    "name": "优秀的",
    "multiplier": 1,
    "chance": 0.3
  },
  3: {
    "name": "精良的",
    "multiplier": 3,
    "chance": 0.159
  },
  4: {
    "name": "史诗的",
    "multiplier": 12,
    "chance": 0.1
  },
  5: {
    "name": "传说的",
    "multiplier": 60,
    "chance": 0.001
  },
  6: {
    "name": "神话的",
    "multiplier": 360,
    "chance": 0.0001
  }
}

const EQUIPMENT_POSITION_CONFIG = {
  "weapon": {
    "name": "武器",
    "stat_multipliers": {
      "max_hp": 0.5,
      "attack": 2,
      "defense": 0.5,
      "crit_rate": 2,
      "crit_resist": 0.5,
      "crit_damage": 2,
      "crit_damage_resist": 0.5,
      "hit_rate": 1.5,
      "dodge_rate": 1
    }
  },
  "armor": {
    "name": "护甲",
    "stat_multipliers": {
      "max_hp": 2,
      "attack": 0.5,
      "defense": 2,
      "crit_rate": 0.5,
      "crit_resist": 2,
      "crit_damage": 0.5,
      "crit_damage_resist": 2,
      "hit_rate": 0.5,
      "dodge_rate": 0.5
    }
  },
  "accessory": {
    "name": "饰品",
    "stat_multipliers": {
      "max_hp": 1.5,
      "attack": 1,
      "defense": 1,
      "crit_rate": 1.5,
      "crit_resist": 1.5,
      "crit_damage": 1.5,
      "crit_damage_resist": 1.5,
      "hit_rate": 1.5,
      "dodge_rate": 1.5
    }
  },
  "boots": {
    "name": "靴子",
    "stat_multipliers": {
      "max_hp": 1,
      "attack": 1,
      "defense": 1,
      "crit_rate": 0.5,
      "crit_resist": 0.5,
      "crit_damage": 0.5,
      "crit_damage_resist": 0.5,
      "hit_rate": 2,
      "dodge_rate": 2
    }
  },
  "helmet": {
    "name": "头盔",
    "stat_multipliers": {
      "max_hp": 1.5,
      "attack": 0.5,
      "defense": 1.5,
      "crit_rate": 0.5,
      "crit_resist": 2,
      "crit_damage": 0.5,
      "crit_damage_resist": 2,
      "hit_rate": 0.5,
      "dodge_rate": 0.5
    }
  }
}

export class ForgeService {
  /**
   * 计算锻造成功率
   * @param forgerLevel 锻造师等级
   * @param toolLevel 工具等级
   * @param materialLevel 材料等级
   * @returns 成功率
   */
  private calculateForgeSuccess(forgerLevel: number, toolLevel: number, materialLevel: number): number {
    // 计算锻造师等级与工具等级的差值
    const levelDiff = forgerLevel - toolLevel;

    // 计算锻造师成功率
    let forgerRate: number;
    if (levelDiff < -3) {
      forgerRate = 0;
    } else if (levelDiff > 3) {
      forgerRate = 2;
    } else {
      forgerRate = (levelDiff + 3) / 3;
    }

    // 计算工具等级与材料等级的差值
    const toolDiff = toolLevel - materialLevel;

    // 计算工具成功率
    let toolRate: number;
    if (toolDiff < -3) {
      toolRate = 0;
    } else if (toolDiff > 3) {
      toolRate = 1;
    } else {
      toolRate = (toolDiff + 3) / 6;
    }

    // 基础成功率为50%
    const baseRate = 0.5;

    // 计算最终成功率
    return Math.min(Math.max(baseRate * forgerRate * toolRate, 0), 1);
  }

  /**
   * 计算装备等级
   * @param forgerLevel 锻造师等级
   * @param toolLevel 工具等级
   * @param maxSuccessRate 最高材料成功率
   * @returns 装备等级
   */
  private calculateEquipmentLevel(forgerLevel: number, toolLevel: number, maxSuccessRate: number): number {
    // 计算随机数
    const random = Math.random();
    let cumulativeChance = 0;
    
    // 先根据概率确定基础等级
    let baseLevel = 1; // 默认普通
    for (const level in EQUIPMENT_LEVELS_CONFIG) {
      const levelConfig = EQUIPMENT_LEVELS_CONFIG[Number(level) as keyof typeof EQUIPMENT_LEVELS_CONFIG];
      cumulativeChance += levelConfig.chance;
      
      if (random <= cumulativeChance) {
        baseLevel = parseInt(level);
        break;
      }
    }
    
    // 根据成功率进行降级判定
    if (maxSuccessRate < 0.7) {
      // 成功率低于70%时，史诗及以上等级需要二次判定
      if (baseLevel >= 4) { // 史诗及以上
        if (Math.random() > 0.5) {
          return 3; // 降级为精良
        }
      }
    } else if (maxSuccessRate < 0.8) {
      // 成功率低于80%时，传说和神话需要二次判定
      if (baseLevel >= 5) { // 传说及以上
        if (Math.random() > 0.5) {
          return 4; // 降级为史诗
        }
      }
    } else if (maxSuccessRate < 0.9) {
      // 成功率低于90%时，神话需要二次判定
      if (baseLevel === 6) { // 神话
        if (Math.random() > 0.5) {
          return 5; // 降级为传说
        }
      }
    }
    
    return baseLevel;
  }

  /**
   * 生成装备名称
   * @param equipmentType 装备类型
   * @param materials 材料列表
   * @param level 装备等级
   * @returns 装备名称
   */
  private generateEquipmentName(
    equipmentType: string,
    materials: { name: string; level: number }[],
    level: number
  ): string {
    // 找出等级最高的材料
    const maxLevelMaterial = materials.reduce((max, current) => 
      current.level > max.level ? current : max
    );

    // 获取装备等级配置
    const levelConfig = EQUIPMENT_LEVELS_CONFIG[level as keyof typeof EQUIPMENT_LEVELS_CONFIG];
    // 获取装备位置配置
    const positionConfig = EQUIPMENT_POSITION_CONFIG[equipmentType as keyof typeof EQUIPMENT_POSITION_CONFIG];

    return `${levelConfig.name}${maxLevelMaterial.name}${positionConfig.name}`;
  }

  /**
   * 计算材料属性加成
   * @param material 材料
   * @param successRate 成功率
   * @param equipmentType 装备类型
   * @param equipmentLevel 装备等级
   * @returns 属性加成
   */
  private calculateMaterialBonus(
    material: MaterialDocument,
    successRate: number,
    equipmentType: string,
    equipmentLevel: number
  ): Record<string, number> {
    const bonus: Record<string, number> = {};
    const multipliers = material.combat_multipliers;

    // 获取材料类型的基础属性
    const materialType = material.typeId as unknown as {
      combat_bonus: {
        max_hp: number | null;
        attack: number | null;
        defense: number | null;
        crit_rate: number | null;
        crit_resist: number | null;
        crit_damage: number | null;
        crit_damage_resist: number | null;
        hit_rate: number | null;
        dodge_rate: number | null;
      };
    };
    const baseStats = materialType.combat_bonus;

    // 获取装备位置配置
    const positionConfig = EQUIPMENT_POSITION_CONFIG[equipmentType as keyof typeof EQUIPMENT_POSITION_CONFIG];
    const statMultipliers = positionConfig.stat_multipliers;

    // 获取装备等级配置
    const levelConfig = EQUIPMENT_LEVELS_CONFIG[equipmentLevel as keyof typeof EQUIPMENT_LEVELS_CONFIG];

    // 计算每个属性的加成
    for (const stat in baseStats) {
      if (baseStats[stat as keyof typeof baseStats] !== null) {
        const baseValue = baseStats[stat as keyof typeof baseStats] as number;
        const multiplier = multipliers[stat as keyof typeof multipliers];
        const positionMultiplier = statMultipliers[stat as keyof typeof statMultipliers];
        const levelMultiplier = levelConfig.multiplier;
        
        bonus[stat] = baseValue * multiplier * successRate * positionMultiplier * levelMultiplier
      }
    }

    return bonus;
  }

  /**
   * 执行锻造操作
   * @param params 锻造参数
   * @returns 锻造结果
   */
  async forge(params: ForgeParams): Promise<ForgeResult> {
    const { playerId, locationId, materialIds, equipmentType } = params;

    try {
      // 验证材料数量
      if (materialIds.length === 0 || materialIds.length > 5) {
        return {
          success: false,
          message: '材料数量必须在1-5之间',
          forgeCost: 0
        };
      }

      // 获取玩家信息
      const player = await Player.findById(playerId);
      if (!player) {
        return {
          success: false,
          message: '玩家不存在',
          forgeCost: 0
        };
      }

      // 获取位置信息（包含锻造师等级）
      const location = await Location.findById(locationId);
      if (!location || !location.npc.forge) {
        return {
          success: false,
          message: '当前位置没有锻造师',
          forgeCost: 0
        };
      }

      const forgerLevel = location.npc.forge.level;
      const toolLevel = forgerLevel; // 假设工具等级与锻造师等级相同

      // 获取材料信息
      const materialModels = await Material.find({ _id: { $in: materialIds } })
        .populate('typeId');
      const materials = materialIds.map(id => materialModels.find(model => model._id.toString() === id)).filter(Boolean) as MaterialDocument[];

      if (materials.length !== materialIds.length) {
        return {
          success: false,
          message: '部分材料不存在',
          forgeCost: 0
        };
      }

      // 验证玩家是否拥有这些材料
      const playerMaterialIds = (player.inventory?.materials || []).map(id => id.toString());
      const hasAllMaterials = materialIds.every(id => playerMaterialIds.includes(id));
      if (!hasAllMaterials) {
        return {
          success: false,
          message: '玩家不拥有所有指定的材料',
          forgeCost: 0
        };
      }

      // 扣除锻造费用：锻造费用 = 2 ^ (forgerLevel - 1) * 10
      const forgeCost = Math.pow(2, forgerLevel - 1) * 10;
      if (player.coins < forgeCost) {
        return {
          success: false,
          message: '金币不足',
          forgeCost: 0
        };
      }

      // 扣除金币
      player.coins -= forgeCost;
      await player.save();

      // 计算每个材料的锻造成功率和结果
      const materialResults = materials.map(material => {
        const successRate = this.calculateForgeSuccess(forgerLevel, toolLevel, material.level);
        return {
          material,
          success: Math.random() < successRate,
          successRate,
          forgeCost
        };
      });

      const successfulMaterials = materialResults.filter(result => result.success);

      if (successfulMaterials.length === 0) {
        // 移除已使用的材料
        // 为每个材料ID找到第一个匹配的索引并移除
        const updatedMaterials = [...(player.inventory?.materials || [])];
        for (const materialId of materialIds) {
          const index = updatedMaterials.findIndex(id => id.toString() === materialId);
          if (index !== -1) {
            updatedMaterials.splice(index, 1);
          }
        }

        // 更新玩家库存
        await Player.findByIdAndUpdate(playerId, {
          $set: { 'inventory.materials': updatedMaterials }
        })

        return {
          success: false,
          message: '锻造失败，所有材料都未能成功融合',
          forgeCost
        };
      }

      // 获取最高成功率的材料
      const maxSuccessRate = Math.max(...successfulMaterials.map(result => result.successRate));

      // 计算装备等级
      const equipmentLevel = this.calculateEquipmentLevel(forgerLevel, toolLevel, maxSuccessRate);

      // 初始化装备属性
      const equipment: IEquipment = {
        id: new mongoose.Types.ObjectId().toString(),
        name: '',
        level: equipmentLevel,
        slot: equipmentType,
        combatStats: {
          max_hp: 0,
          attack: 0,
          defense: 0,
          crit_rate: 0,
          crit_resist: 0,
          crit_damage: 0,
          crit_damage_resist: 0,
          hit_rate: 0,
          dodge_rate: 0
        }
      };

      // 计算材料属性加成
      successfulMaterials.forEach(result => {
        const bonus = this.calculateMaterialBonus(
          result.material,
          result.successRate,
          equipmentType,
          equipmentLevel
        );

        // 累加属性
        for (const stat in bonus) {
          equipment.combatStats[stat as keyof typeof equipment.combatStats] += bonus[stat];
        }
      });

      // 针对装备属性取整
      for (const stat in equipment.combatStats) {
        equipment.combatStats[stat as keyof typeof equipment.combatStats] = Math.floor(equipment.combatStats[stat as keyof typeof equipment.combatStats]);
      }

      // 生成装备名称
      equipment.name = this.generateEquipmentName(
        equipmentType,
        successfulMaterials.map(m => ({ name: m.material.name, level: m.material.level })),
        equipmentLevel
      );

      // 更新玩家信息，移除所有使用的材料
      if (!player || !player.inventory || !player.inventory.materials) {
        throw new Error('找不到玩家库存信息');
      }

      // 为每个材料ID找到第一个匹配的索引并移除
      const updatedMaterials = [...player.inventory.materials];
      for (const materialId of materialIds) {
        const index = updatedMaterials.findIndex(id => id.toString() === materialId);
        if (index !== -1) {
          updatedMaterials.splice(index, 1);
        }
      }

      // 更新玩家库存
      await Player.findByIdAndUpdate(playerId, {
        $set: { 'inventory.materials': updatedMaterials },
        $push: { 'inventory.equipments': equipment }
      });

      return {
        success: true,
        message: `锻造成功！${successfulMaterials.length}个材料成功融合`,
        equipment,
        forgeCost
      };

    } catch (error) {
      console.error('锻造失败:', error);
      return {
        success: false,
        message: '锻造过程中发生错误',
        forgeCost: 0
      };
    }
  }
} 