import { Location } from '../models/Location';
import { Types } from 'mongoose';

export interface LocationNPC {
  forge?: {
    level: number;
  };
  shop?: {
    items: Array<{
      id: string;
      price: number;
    }>;
  };
}

export interface LocationEnemy {
  [key: string]: {
    probability: number;
    maxCount: number;
  };
}

export interface LocationData {
  name: string;
  description: string;
  mapId: number;
  position: {
    x: number;
    y: number;
  };
  adjacentLocations: number[];
  npc?: LocationNPC;
  enemy?: LocationEnemy;
  enemyUpdateDuration?: number;
}

export interface LocationQueryParams {
  name?: string;
  mapId?: number;
  page?: number;
  limit?: number;
}

export class LocationService {
  /**
   * 创建新地点
   */
  static async createLocation(locationData: LocationData) {
    try {
      const location = new Location(locationData);
      return await location.save();
    } catch (error: any) {
      throw new Error(`创建地点失败: ${error.message}`);
    }
  }

  /**
   * 更新地点信息
   */
  static async updateLocation(id: string, updateData: Partial<LocationData>) {
    try {
      const location = await Location.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
      if (!location) {
        throw new Error('地点不存在');
      }
      return location;
    } catch (error: any) {
      throw new Error(`更新地点失败: ${error.message}`);
    }
  }

  /**
   * 删除地点
   */
  static async deleteLocation(id: string) {
    try {
      const location = await Location.findByIdAndDelete(id);
      if (!location) {
        throw new Error('地点不存在');
      }
      return location;
    } catch (error: any) {
      throw new Error(`删除地点失败: ${error.message}`);
    }
  }

  /**
   * 获取指定地点详情
   */
  static async getLocationById(id: string) {
    try {
      const location = await Location.findById(id);
      if (!location) {
        throw new Error('地点不存在');
      }
      return location;
    } catch (error: any) {
      throw new Error(`获取地点详情失败: ${error.message}`);
    }
  }

  /**
   * 获取地点列表（支持分页和查询）
   */
  static async getLocations(params: LocationQueryParams) {
    try {
      const { name, mapId, page = 1, limit = 50 } = params;
      
      const query: any = {};
      if (name) {
        query.name = { $regex: name, $options: 'i' };
      }
      if (mapId) {
        query.mapId = mapId;
      }

      const skip = (page - 1) * limit;
      
      const [locations, total] = await Promise.all([
        Location.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Location.countDocuments(query)
      ]);

      return {
        locations,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`获取地点列表失败: ${error.message}`);
    }
  }
} 