import { LocationState } from '../models/LocationState';
import { Types } from 'mongoose';

export interface EnemyRefreshTime {
  creatureId: Types.ObjectId;
  refreshTime: Date;
}

export interface LocationStateData {
  locationId: Types.ObjectId;
  enemyRefreshTimes: EnemyRefreshTime[];
}

export interface LocationStateQueryParams {
  locationId?: Types.ObjectId;
  page?: number;
  limit?: number;
}

export class LocationStateService {
  /**
   * 创建地点状态
   */
  static async createLocationState(stateData: LocationStateData) {
    try {
      const state = new LocationState(stateData);
      return await state.save();
    } catch (error: any) {
      throw new Error(`创建地点状态失败: ${error.message}`);
    }
  }

  /**
   * 更新地点状态
   */
  static async updateLocationState(id: string, updateData: Partial<LocationStateData>) {
    try {
      const state = await LocationState.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      ).populate('locationId').populate('enemyRefreshTimes.creatureId');
      
      if (!state) {
        throw new Error('地点状态不存在');
      }
      return state;
    } catch (error: any) {
      throw new Error(`更新地点状态失败: ${error.message}`);
    }
  }

  /**
   * 删除地点状态
   */
  static async deleteLocationState(id: string) {
    try {
      const state = await LocationState.findByIdAndDelete(id);
      if (!state) {
        throw new Error('地点状态不存在');
      }
      return state;
    } catch (error: any) {
      throw new Error(`删除地点状态失败: ${error.message}`);
    }
  }

  /**
   * 获取指定地点状态详情
   */
  static async getLocationStateById(id: string) {
    try {
      const state = await LocationState.findById(id)
        .populate('locationId')
        .populate('enemyRefreshTimes.creatureId');
      
      if (!state) {
        throw new Error('地点状态不存在');
      }
      return state;
    } catch (error: any) {
      throw new Error(`获取地点状态详情失败: ${error.message}`);
    }
  }

  /**
   * 获取地点状态列表（支持分页和查询）
   */
  static async getLocationStates(params: LocationStateQueryParams) {
    try {
      const { locationId, page = 1, limit = 50 } = params;
      
      const query: any = {};
      if (locationId) {
        query.locationId = new Types.ObjectId(locationId);
      }

      const skip = (page - 1) * limit;
      
      const [states, total] = await Promise.all([
        LocationState.find(query)
          .populate('locationId')
          .populate('enemyRefreshTimes.creatureId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        LocationState.countDocuments(query)
      ]);

      return {
        states,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`获取地点状态列表失败: ${error.message}`);
    }
  }

  /**
   * 更新指定地点的敌人刷新时间
   */
  static async updateEnemyRefreshTime(locationId: string, creatureId: string, refreshTime: Date) {
    try {
      const state = await LocationState.findOne({ locationId });
      
      if (!state) {
        throw new Error('地点状态不存在');
      }

      // 查找是否已存在该生物的刷新时间记录
      const existingIndex = state.enemyRefreshTimes.findIndex(
        time => time.creatureId.toString() === creatureId
      );

      if (existingIndex >= 0) {
        // 更新现有记录
        state.enemyRefreshTimes[existingIndex].refreshTime = refreshTime;
      } else {
        // 添加新记录
        state.enemyRefreshTimes.push({
          creatureId: new Types.ObjectId(creatureId),
          refreshTime
        });
      }

      return await state.save();
    } catch (error: any) {
      throw new Error(`更新敌人刷新时间失败: ${error.message}`);
    }
  }
} 