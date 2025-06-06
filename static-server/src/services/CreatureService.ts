import { Creature } from '../models/Creature';
import { Types } from 'mongoose';

export interface DropMaterial {
  materialId: Types.ObjectId;
  probability: number;
}

export interface CreatureData {
  name: string;
  description: string;
  raceId: Types.ObjectId;
  level: number;
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
    perception: number;
    stealth: number;
    escape: number;
    rage: number;
  };
  drop_materials: DropMaterial[];
}

export interface CreatureQueryParams {
  name?: string;
  raceId?: Types.ObjectId;
  level?: number;
  page?: number;
  limit?: number;
}

export interface DroppedMaterial {
  materialId: Types.ObjectId;
  quantity: number;
}

export class CreatureService {
  /**
   * 创建新生物
   */
  static async createCreature(creatureData: CreatureData) {
    try {
      const creature = new Creature(creatureData);
      return await creature.save();
    } catch (error: any) {
      throw new Error(`创建生物失败: ${error.message}`);
    }
  }

  /**
   * 更新生物信息
   */
  static async updateCreature(id: string, updateData: Partial<CreatureData>) {
    try {
      const creature = await Creature.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
      if (!creature) {
        throw new Error('生物不存在');
      }
      return creature;
    } catch (error: any) {
      throw new Error(`更新生物失败: ${error.message}`);
    }
  }

  /**
   * 删除生物
   */
  static async deleteCreature(id: string) {
    try {
      const creature = await Creature.findByIdAndDelete(id);
      if (!creature) {
        throw new Error('生物不存在');
      }
      return creature;
    } catch (error: any) {
      throw new Error(`删除生物失败: ${error.message}`);
    }
  }

  /**
   * 获取指定生物详情
   */
  static async getCreatureById(id: string) {
    try {
      const creature = await Creature.findById(id).populate('raceId');
      if (!creature) {
        throw new Error('生物不存在');
      }
      return creature;
    } catch (error: any) {
      throw new Error(`获取生物详情失败: ${error.message}`);
    }
  }

    /**
   * 获取指定生物详情 -- 面向管理后台提供，raceId不进行关联
   */
    static async getCreatureByIdForAdmin(id: string) {
      try {
        const creature = await Creature.findById(id);
        if (!creature) {
          throw new Error('生物不存在');
        }
        return creature;
      } catch (error: any) {
      throw new Error(`获取生物详情失败: ${error.message}`);
    }
  }

  /**
   * 获取生物列表（支持分页和查询）
   */
  static async getCreatures(params: CreatureQueryParams) {
    try {
      const { name, raceId, level, page = 1, limit = 50 } = params;
      
      const query: any = {};
      if (name) {
        query.name = { $regex: name, $options: 'i' };
      }
      if (raceId) {
        query.raceId = new Types.ObjectId(raceId);
      }
      if (level) {
        query.level = level;
      }

      const skip = (page - 1) * limit;
      
      const [creatures, total] = await Promise.all([
        Creature.find(query)
          .populate('raceId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Creature.countDocuments(query)
      ]);

      return {
        creatures,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`获取生物列表失败: ${error.message}`);
    }
  }

  /**
   * 计算生物死亡时的掉落物品
   * @param creatureId 生物ID
   * @returns 掉落物品列表
   */
  static async calculateDrops(creatureId: Types.ObjectId): Promise<DroppedMaterial[]> {
    try {
      const creature = await Creature.findById(creatureId).populate('drop_materials.materialId', 'name');
      if (!creature) {
        throw new Error('生物不存在');
      }

      const dropMaterials = creature.drop_materials || []
      const droppedMaterials: DroppedMaterial[] = [];

      for (const drop of dropMaterials) {
        const roll = Math.random();
        if (roll < drop.probability) {
          droppedMaterials.push({
            materialId: drop.materialId,
            quantity: 1 // 固定掉落1个
          });
        }
      }

      return droppedMaterials;
    } catch (error: any) {
      throw new Error(`计算掉落物品失败: ${error.message}`);
    }
  }
} 