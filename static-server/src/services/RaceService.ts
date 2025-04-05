import { Race } from '../models/Race';
import { Types } from 'mongoose';

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

export interface RaceData {
  id?: number;  // 创建时可选，更新时必需
  name: string;
  description: string;
  parentRace?: Types.ObjectId | null;
  combatStats: Partial<CombatStats>;
}

export interface RaceQueryParams {
  name?: string;
  parentRace?: string;
  page?: number;
  limit?: number;
}

export class RaceService {
  /**
   * 创建新种族
   */
  static async createRace(raceData: RaceData) {
    try {
      // 确保 combatStats 的所有字段都有默认值
      const defaultCombatStats: CombatStats = {
        max_hp: 10.0,
        attack: 2.0,
        defense: 1.0,
        crit_rate: 1.0,
        crit_resist: 1.0,
        crit_damage: 1.0,
        crit_damage_resist: 1.0,
        hit_rate: 1.0,
        dodge_rate: 1.0
      };

      const race = new Race({
        ...raceData,
        combatStats: {
          ...defaultCombatStats,
          ...raceData.combatStats
        }
      });
      return await race.save();
    } catch (error: any) {
      throw new Error(`创建种族失败: ${error.message}`);
    }
  }

  /**
   * 更新种族信息
   */
  static async updateRace(id: string, updateData: Partial<RaceData>) {
    try {
      // 如果更新了 parentRace，验证其是否存在
      if (updateData.parentRace) {
        const parentExists = await Race.exists({ _id: updateData.parentRace });
        if (!parentExists) {
          throw new Error('父种族不存在');
        }
      }

      const race = await Race.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
      if (!race) {
        throw new Error('种族不存在');
      }
      return race;
    } catch (error: any) {
      throw new Error(`更新种族失败: ${error.message}`);
    }
  }

  /**
   * 删除种族
   */
  static async deleteRace(id: string) {
    try {
      // 检查是否有子种族
      const hasChildren = await Race.exists({ parentRace: id });
      if (hasChildren) {
        throw new Error('无法删除该种族，因为存在子种族');
      }

      const race = await Race.findByIdAndDelete(id);
      if (!race) {
        throw new Error('种族不存在');
      }
      return race;
    } catch (error: any) {
      throw new Error(`删除种族失败: ${error.message}`);
    }
  }

  /**
   * 获取指定种族详情
   */
  static async getRaceById(id: string) {
    try {
      const race = await Race.findById(id);
      if (!race) {
        throw new Error('种族不存在');
      }
      return race;
    } catch (error: any) {
      throw new Error(`获取种族详情失败: ${error.message}`);
    }
  }

  /**
   * 获取种族列表（支持分页和查询）
   */
  static async getRaces(params: RaceQueryParams) {
    try {
      const { name, parentRace, page = 1, limit = 50 } = params;
      
      const query: any = {};
      if (name) {
        query.name = { $regex: name, $options: 'i' };
      }
      if (parentRace) {
        query.parentRace = new Types.ObjectId(parentRace);
      }

      const skip = (page - 1) * limit;
      
      const [races, total] = await Promise.all([
        Race.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Race.countDocuments(query)
      ]);

      return {
        races,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`获取种族列表失败: ${error.message}`);
    }
  }
} 