import { MaterialType } from '../models/MaterialType';
import { Types } from 'mongoose';

export interface MaterialTypeData {
  name: string;
  description: string;
  combat_bonus: {
    max_hp?: number;
    attack?: number;
    defense?: number;
    crit_rate?: number;
    crit_resist?: number;
    crit_damage?: number;
    crit_damage_resist?: number;
    hit_rate?: number;
    dodge_rate?: number;
  };
}

export interface MaterialTypeQueryParams {
  name?: string;
  page?: number;
  limit?: number;
}

export class MaterialTypeService {
  /**
   * 创建新材料类型
   */
  static async createMaterialType(materialTypeData: MaterialTypeData) {
    try {
      const materialType = new MaterialType(materialTypeData);
      return await materialType.save();
    } catch (error: any) {
      throw new Error(`创建材料类型失败: ${error.message}`);
    }
  }

  /**
   * 更新材料类型信息
   */
  static async updateMaterialType(id: string, updateData: Partial<MaterialTypeData>) {
    try {
      const materialType = await MaterialType.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
      if (!materialType) {
        throw new Error('材料类型不存在');
      }
      return materialType;
    } catch (error: any) {
      throw new Error(`更新材料类型失败: ${error.message}`);
    }
  }

  /**
   * 删除材料类型
   */
  static async deleteMaterialType(id: string) {
    try {
      const materialType = await MaterialType.findByIdAndDelete(id);
      if (!materialType) {
        throw new Error('材料类型不存在');
      }
      return materialType;
    } catch (error: any) {
      throw new Error(`删除材料类型失败: ${error.message}`);
    }
  }

  /**
   * 获取指定材料类型详情
   */
  static async getMaterialTypeById(id: string) {
    try {
      const materialType = await MaterialType.findById(id);
      if (!materialType) {
        throw new Error('材料类型不存在');
      }
      return materialType;
    } catch (error: any) {
      throw new Error(`获取材料类型详情失败: ${error.message}`);
    }
  }

  /**
   * 获取材料类型列表（支持分页和查询）
   */
  static async getMaterialTypes(params: MaterialTypeQueryParams) {
    try {
      const { name, page = 1, limit = 50 } = params;
      
      const query: any = {};
      if (name) {
        query.name = { $regex: name, $options: 'i' };
      }

      const skip = (page - 1) * limit;
      
      const [materialTypes, total] = await Promise.all([
        MaterialType.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        MaterialType.countDocuments(query)
      ]);

      return {
        materialTypes,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`获取材料类型列表失败: ${error.message}`);
    }
  }
} 