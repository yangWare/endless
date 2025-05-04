import { Player, IEquipment } from '../models/Player';
import { Material, MaterialDocument } from '../models/Material';
import { Location } from '../models/Location';
import mongoose from 'mongoose';
import { HEART_SKILL_CONFIG } from './PlayerService';

interface ForgeResult {
  success: boolean;
  message: string;
  equipment?: IEquipment;
  forgeCost: number;
  curForgeHeartSkill?: {
    level: number;
    exp: number;
  };
}

interface ForgeParams {
  playerId: string;
  locationId: string;
  materialIds: string[];
  assistMaterialIds: string[];
  equipmentType: 'weapon' | 'armor' | 'wrist' | 'accessory' | 'helmet' | 'boots';
  forgeToolLevel: number;
}

const EQUIPMENT_LEVELS_CONFIG = {
  1: {
    "name": "普通",
    "multiplier": 0.5,
    "chance": 0.5299
  },
  2: {
    "name": "优秀",
    "multiplier": 1,
    "chance": 0.3
  },
  3: {
    "name": "精良",
    "multiplier": 2,
    "chance": 0.159
  },
  4: {
    "name": "史诗",
    "multiplier": 12,
    "chance": 0.01
  },
  5: {
    "name": "传说",
    "multiplier": 60,
    "chance": 0.001
  },
  6: {
    "name": "神话",
    "multiplier": 360,
    "chance": 0.0001
  }
}

const EQUIPMENT_POSITION_CONFIG = {
  "weapon": {
    "name": "武器",
    "stat_multipliers": {
      "max_hp": 1,
      "attack": 4,
      "defense": 1,
      "crit_rate": 4,
      "crit_resist": 1,
      "crit_damage": 4,
      "crit_damage_resist": 1,
      "hit_rate": 1,
      "dodge_rate": 1
    }
  },
  "armor": {
    "name": "护甲",
    "stat_multipliers": {
      "max_hp": 1,
      "attack": 1,
      "defense": 4,
      "crit_rate": 1,
      "crit_resist": 2,
      "crit_damage": 1,
      "crit_damage_resist": 2,
      "hit_rate": 1,
      "dodge_rate": 1
    }
  },
  "wrist": {
    "name": "手镯",
    "stat_multipliers": {
      "max_hp": 3,
      "attack": 2,
      "defense": 3,
      "crit_rate": 2,
      "crit_resist": 3,
      "crit_damage": 2,
      "crit_damage_resist": 3,
      "hit_rate": 2,
      "dodge_rate": 3
    }
  },
  "accessory": {
    "name": "项链",
    "stat_multipliers": {
      "max_hp": 2,
      "attack": 3,
      "defense": 2,
      "crit_rate": 3,
      "crit_resist": 2,
      "crit_damage": 3,
      "crit_damage_resist": 2,
      "hit_rate": 3,
      "dodge_rate": 2
    }
  },
  "boots": {
    "name": "靴子",
    "stat_multipliers": {
      "max_hp": 1,
      "attack": 1,
      "defense": 1,
      "crit_rate": 1,
      "crit_resist": 1,
      "crit_damage": 1,
      "crit_damage_resist": 1,
      "hit_rate": 4,
      "dodge_rate": 4
    }
  },
  "helmet": {
    "name": "头盔",
    "stat_multipliers": {
      "max_hp": 4,
      "attack": 1,
      "defense": 1,
      "crit_rate": 1,
      "crit_resist": 2,
      "crit_damage": 1,
      "crit_damage_resist": 2,
      "hit_rate": 1,
      "dodge_rate": 1
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
  private calculateEquipmentLevel(forgerLevel: number, toolLevel: number, maxSuccessRate: number, successfulAssistMaterials: MaterialDocument[]): number {
    // 计算随机数
    const random = Math.random();
    let cumulativeChance = 0;

    // 根据辅助材料计算各品阶装备的成功率
    const originalLevelConfig = JSON.parse(JSON.stringify(EQUIPMENT_LEVELS_CONFIG));
    successfulAssistMaterials.forEach(item => {
      const materialType = item.typeId as unknown as {
        probability_bonus: {
          epic_forge: number | null;
          legendary_forge: number | null;
          mythic_forge: number | null;
        };
      };
      if (item.probability_bonus.epic_forge && materialType.probability_bonus.epic_forge) {
        originalLevelConfig[4].chance += item.probability_bonus.epic_forge * materialType.probability_bonus.epic_forge;
      }
      if (item.probability_bonus.legendary_forge && materialType.probability_bonus.legendary_forge) {
        originalLevelConfig[5].chance += item.probability_bonus.legendary_forge * materialType.probability_bonus.legendary_forge;
      }
      if (item.probability_bonus.mythic_forge && materialType.probability_bonus.mythic_forge) {
        originalLevelConfig[6].chance += item.probability_bonus.mythic_forge * materialType.probability_bonus.mythic_forge;
      }
      // 所有其他品阶额外加成的概率均从普通概率上减除
      originalLevelConfig[1].chance = 1 - originalLevelConfig[2].chance - originalLevelConfig[3].chance - originalLevelConfig[4].chance - originalLevelConfig[5].chance - originalLevelConfig[6].chance;
    })

    console.log(originalLevelConfig)

    // 先根据概率确定基础等级
    let baseLevel = 1; // 默认普通
    for (const level in originalLevelConfig) {
      const levelConfig = originalLevelConfig[Number(level) as keyof typeof originalLevelConfig];
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

    // 前缀星数，材料数量为星级数，每多一级加一个⭐️
    const prefixStar = '☆'.repeat(materials.length);
    return `${prefixStar}${levelConfig.name}${maxLevelMaterial.name}${positionConfig.name}`;
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
   * 计算锻造功法等级经验值
   * @param successMaterialsLevel 成功材料的等级加和
   * @param equipmentLevel 装备等级
   * @param forgetHeartSkill 当前玩家锻造心法数据
   * @returns 锻造功法等级和经验值
   */
  private calculateForgeLevel(successMaterialsLevel: number, equipmentLevel: number, forgetHeartSkill: {
    level: number;
    exp: number;
  }) {
    const exp = Math.floor(successMaterialsLevel * EQUIPMENT_LEVELS_CONFIG[equipmentLevel as keyof typeof EQUIPMENT_LEVELS_CONFIG].multiplier);
    return HEART_SKILL_CONFIG['燧石锻造传承'].upgrade(exp + forgetHeartSkill.exp, forgetHeartSkill.level);
  }

  /**
   * 执行锻造操作
   * @param params 锻造参数
   * @returns 锻造结果
   */
  async forge(params: ForgeParams): Promise<ForgeResult> {
    const { playerId, locationId, materialIds, assistMaterialIds, equipmentType, forgeToolLevel } = params;

    try {
      // 验证材料数量
      if (materialIds.length === 0 || materialIds.length > 5) {
        return {
          success: false,
          message: '材料数量必须在1-5之间',
          forgeCost: 0
        };
      }

      // 验证辅助材料数量
      if (assistMaterialIds.length > 5) {
        return {
          success: false,
          message: '辅助材料数量不能超过5个',
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
      if (!location || !location.npc.forge || forgeToolLevel > location.npc.forge.level) {
        return {
          success: false,
          message: '当前位置没有该等级的锻造炉',
          forgeCost: 0
        };
      }

      // 计算锻造心法等级和经验值
      const curForgeHeartSkill = player.heartSkills.find(skill => skill.name === '燧石锻造传承');
      if (!curForgeHeartSkill) {
        throw new Error('找不到锻造心法信息');
      }

      const forgerLevel = curForgeHeartSkill.level;
      const toolLevel = forgeToolLevel;

      // 获取材料信息
      const materialModels = await Material.find({ _id: { $in: [...materialIds, ...assistMaterialIds] } })
        .populate('typeId');
      const materials = materialIds.map(id => materialModels.find(model => model._id.toString() === id)).filter(Boolean) as MaterialDocument[];
      const assistMaterials = assistMaterialIds.map(id => materialModels.find(model => model._id.toString() === id)).filter(Boolean) as MaterialDocument[];

      if (materials.length !== materialIds.length || assistMaterials.length !== assistMaterialIds.length) {
        return {
          success: false,
          message: '部分材料不存在',
          forgeCost: 0
        };
      }

      // 验证玩家是否拥有这些材料
      const playerMaterialIds = (player.inventory?.materials || []).map(id => id.toString());
      const hasAllMaterials = materialIds.every(id => playerMaterialIds.includes(id)) && assistMaterialIds.every(id => playerMaterialIds.includes(id));
      if (!hasAllMaterials) {
        return {
          success: false,
          message: '玩家不拥有所有指定的材料',
          forgeCost: 0
        };
      }

      // 扣除锻造费用：锻造费用 = 2 ^ (toolLevel - 1) * 10
      const forgeCost = Math.pow(2, toolLevel - 1) * 10;
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

      // 获取材料等级最高的材料的成功率
      const maxLevelMaterial = successfulMaterials.reduce((max, current) => {
        return current.material.level > max.material.level ? current : max;
      });
      const maxSuccessRate = maxLevelMaterial.successRate;

      // 计算辅助材料成功率
      const assistMaterialResults = assistMaterials.map(material => {
        const successRate = this.calculateForgeSuccess(forgerLevel, toolLevel, material.level);
        return {
          material,
          success: Math.random() < successRate,
          successRate,
          forgeCost: 0
        };
      });

      const successfulAssistMaterials = assistMaterialResults.filter(result => result.success);

      // 计算装备等级
      const equipmentLevel = this.calculateEquipmentLevel(forgerLevel, toolLevel, maxSuccessRate, successfulAssistMaterials.map(result => result.material));

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

      // 为每个辅助材料ID找到第一个匹配的索引并移除
      for (const materialId of assistMaterialIds) {
        const index = updatedMaterials.findIndex(id => id.toString() === materialId);
        if (index !== -1) {
          updatedMaterials.splice(index, 1);
        }
      }
      const forgeLevel = this.calculateForgeLevel(
        successfulMaterials.reduce((sum, material) => sum + material.material.level, 0) + successfulAssistMaterials.reduce((sum, material) => sum + material.material.level, 0),
        equipmentLevel,
        curForgeHeartSkill
      );
      // 更新锻造心法信息
      curForgeHeartSkill.level = forgeLevel.level;
      curForgeHeartSkill.exp = forgeLevel.exp;

      // 更新玩家库存
      await Player.findByIdAndUpdate(playerId, {
        $set: { 'inventory.materials': updatedMaterials, 'heartSkills': player.heartSkills },
        $push: { 'inventory.equipments': equipment }
      });

      return {
        success: true,
        message: `锻造成功！${successfulMaterials.length}个材料成功融合! ${successfulAssistMaterials.length}个辅助材料成功融合!`,
        equipment,
        forgeCost,
        curForgeHeartSkill
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
