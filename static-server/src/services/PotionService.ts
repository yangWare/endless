import { Potion } from '../models/Potion';
import { Types } from 'mongoose';

export interface PotionEffect {
  type: string;
  value: number;
}

export interface PotionData {
  id?: number;  // 创建时可选，更新时必需
  name: string;
  description: string;
  effect: PotionEffect;
}

export interface PotionQueryParams {
  name?: string;
  effectType?: string;
  page?: number;
  limit?: number;
}

export class PotionService {
  /**
   * 创建新药品
   */
  static async createPotion(potionData: PotionData) {
    try {
      const potion = new Potion(potionData);
      return await potion.save();
    } catch (error: any) {
      throw new Error(`创建药品失败: ${error.message}`);
    }
  }

  /**
   * 更新药品信息
   */
  static async updatePotion(id: string, updateData: Partial<PotionData>) {
    try {
      const potion = await Potion.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
      if (!potion) {
        throw new Error('药品不存在');
      }
      return potion;
    } catch (error: any) {
      throw new Error(`更新药品失败: ${error.message}`);
    }
  }

  /**
   * 删除药品
   */
  static async deletePotion(id: string) {
    try {
      const potion = await Potion.findByIdAndDelete(id);
      if (!potion) {
        throw new Error('药品不存在');
      }
      return potion;
    } catch (error: any) {
      throw new Error(`删除药品失败: ${error.message}`);
    }
  }

  /**
   * 获取指定药品详情
   */
  static async getPotionById(id: string) {
    try {
      const potion = await Potion.findById(id);
      if (!potion) {
        throw new Error('药品不存在');
      }
      return potion;
    } catch (error: any) {
      throw new Error(`获取药品详情失败: ${error.message}`);
    }
  }

  /**
   * 获取药品列表（支持分页和查询）
   */
  static async getPotions(params: PotionQueryParams) {
    try {
      const { name, effectType, page = 1, limit = 50 } = params;
      
      const query: any = {};
      if (name) {
        query.name = { $regex: name, $options: 'i' };
      }
      if (effectType) {
        query['effect.type'] = effectType;
      }

      const skip = (page - 1) * limit;
      
      const [potions, total] = await Promise.all([
        Potion.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Potion.countDocuments(query)
      ]);

      return {
        potions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`获取药品列表失败: ${error.message}`);
    }
  }
} 