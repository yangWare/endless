import { Material } from '../models/Material';
import { Types } from 'mongoose';

export interface MaterialData {
  name: string;
  description: string;
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
      const { name, level, page = 1, limit = 50 } = params;
      
      const query: any = {};
      if (name) {
        query.name = { $regex: name, $options: 'i' };
      }
      if (level) {
        query.level = level;
      }

      const skip = (page - 1) * limit;
      
      const [materials, total] = await Promise.all([
        Material.find(query)
          .sort({ createdAt: -1 })
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
} 