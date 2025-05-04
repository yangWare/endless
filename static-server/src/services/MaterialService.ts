import { Material } from '../models/Material';
import { Types } from 'mongoose';
import { IMaterial } from '../models/Material';

export interface MaterialData {
  id?: number;  // 创建时可选，更新时必需
  name: string;
  description: string;
  typeId: string;  // 添加 typeId 字段
  combat_multipliers: {
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
  level: number;
}

export interface MaterialQueryParams {
  name?: string;
  level?: number;
  typeId?: string;  // 添加 typeId 查询参数
  page?: number;
  limit?: number;
}

export class MaterialService {
  /**
   * 创建新材料
   */
  static async createMaterial(materialData: MaterialData) {
    try {
      const material = new Material(materialData);
      return await material.save();
    } catch (error: any) {
      throw new Error(`创建材料失败: ${error.message}`);
    }
  }

  /**
   * 更新材料信息
   */
  static async updateMaterial(id: string, updateData: Partial<MaterialData>) {
    try {
      const material = await Material.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
      if (!material) {
        throw new Error('材料不存在');
      }
      return material;
    } catch (error: any) {
      throw new Error(`更新材料失败: ${error.message}`);
    }
  }

  /**
   * 删除材料
   */
  static async deleteMaterial(id: string) {
    try {
      const material = await Material.findByIdAndDelete(id);
      if (!material) {
        throw new Error('材料不存在');
      }
      return material;
    } catch (error: any) {
      throw new Error(`删除材料失败: ${error.message}`);
    }
  }

  /**
   * 获取指定材料详情
   */
  static async getMaterialById(id: string) {
    try {
      const material = await Material.findById(id).populate('typeId', 'name');
      if (!material) {
        throw new Error('材料不存在');
      }
      return material;
    } catch (error: any) {
      throw new Error(`获取材料详情失败: ${error.message}`);
    }
  }

  /** 
   * 获取指定材料详情 -- 面向管理后台提供，typeId不进行关联
   */
  static async getMaterialByIdForAdmin(id: string) {
    try {
      const material = await Material.findById(id);
      if (!material) {
        throw new Error('材料不存在');
      }
      return material;
    } catch (error: any) {
      throw new Error(`获取材料详情失败: ${error.message}`);
    }
  }

  /**
   * 获取材料列表（支持分页和查询）
   */
  static async getMaterials(params: MaterialQueryParams) {
    try {
      const { name, level, typeId, page = 1, limit = 50 } = params;
      
      const query: any = {};
      if (name) {
        query.name = { $regex: name, $options: 'i' };
      }
      if (level) {
        query.level = level;
      }
      if (typeId) {
        query.typeId = typeId;
      }

      const skip = (page - 1) * limit;
      
      const [materials, total] = await Promise.all([
        Material.find(query)
          .sort({ createdAt: -1 })
          .populate('typeId', 'name')  // 添加 populate
          .skip(skip)
          .limit(limit),
        Material.countDocuments(query)
      ]);

      return {
        materials,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`获取材料列表失败: ${error.message}`);
    }
  }

  /**
   * 根据ID列表批量获取材料信息
   * @param ids 材料ID数组
   * @returns 材料列表
   */
  static async getMaterialsByIds(ids: string[]) {
    try {
      if (!ids || ids.length === 0) {
        return [];
      }
      
      const materials = await Material.find({
        _id: { $in: ids }
      }).populate('typeId', 'name');
      
      return materials;
    } catch (error: any) {
      throw new Error(`批量获取材料信息失败: ${error.message}`);
    }
  }

  /**
   * 计算材料的战斗属性
   * @param materialId 材料ID
   * @returns 计算后的战斗属性
   */
  static async calculateMaterialCombatStats(materialId: string) {
    try {
      const material = await Material.findById(materialId).populate('typeId');
      if (!material) {
        throw new Error('材料不存在');
      }

      type CombatStat = keyof typeof material.combat_multipliers;
      const combatStats: Partial<typeof material.combat_multipliers> = {};
      const combatBonus = (material.typeId as any).combat_bonus;
      const multipliers = material.combat_multipliers;

      // 遍历所有战斗属性
      (Object.keys(combatBonus) as CombatStat[]).forEach(stat => {
        if (combatBonus[stat] !== null && multipliers[stat] !== undefined) {
          combatStats[stat] = combatBonus[stat] * multipliers[stat];
        }
      });

      return combatStats;
    } catch (error: any) {
      throw new Error(`计算材料战斗属性失败: ${error.message}`);
    }
  }

  /**
   * 计算材料的概率加成
   * @param materialId 材料ID
   * @returns 计算后的概率加成
   */
  static async calculateMaterialProbabilityBonus(materialId: string) {
    try {
      const material = await Material.findById(materialId).populate('typeId');
      if (!material) {
        throw new Error('材料不存在');
      }

      const materialType = material.typeId as unknown as {
        probability_bonus: {
          epic_forge: number | null;
          legendary_forge: number | null;
          mythic_forge: number | null;
        };
      };

      // 计算最终的概率加成
      const probabilityBonus = {
        epic_forge: materialType.probability_bonus.epic_forge ? 
          materialType.probability_bonus.epic_forge * (material.probability_bonus?.epic_forge || 0) : null,
        legendary_forge: materialType.probability_bonus.legendary_forge ? 
          materialType.probability_bonus.legendary_forge * (material.probability_bonus?.legendary_forge || 0) : null,
        mythic_forge: materialType.probability_bonus.mythic_forge ? 
          materialType.probability_bonus.mythic_forge * (material.probability_bonus?.mythic_forge || 0) : null
      };

      return probabilityBonus;
    } catch (error: any) {
      throw new Error(`计算材料概率加成失败: ${error.message}`);
    }
  }
} 