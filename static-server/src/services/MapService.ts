import { Map } from '../models/Map';
import { Types } from 'mongoose';

export interface MapData {
  id: number;
  name: string;
  description: string;
  bgImage: string;
  width: number;
  height: number;
  startLocationId: number;
}

export interface MapQueryParams {
  name?: string;
  page?: number;
  limit?: number;
}

export class MapService {
  /**
   * 创建新地图
   */
  static async createMap(mapData: MapData) {
    try {
      const map = new Map(mapData);
      return await map.save();
    } catch (error: any) {
      throw new Error(`创建地图失败: ${error.message}`);
    }
  }

  /**
   * 更新地图信息
   */
  static async updateMap(id: string, updateData: Partial<MapData>) {
    try {
      const map = await Map.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
      if (!map) {
        throw new Error('地图不存在');
      }
      return map;
    } catch (error: any) {
      throw new Error(`更新地图失败: ${error.message}`);
    }
  }

  /**
   * 删除地图
   */
  static async deleteMap(id: string) {
    try {
      // TODO: 可以添加检查是否有关联的locations
      const map = await Map.findByIdAndDelete(id);
      if (!map) {
        throw new Error('地图不存在');
      }
      return map;
    } catch (error: any) {
      throw new Error(`删除地图失败: ${error.message}`);
    }
  }

  /**
   * 获取指定地图详情
   */
  static async getMapById(id: string) {
    try {
      const map = await Map.findById(id);
      if (!map) {
        throw new Error('地图不存在');
      }
      return map;
    } catch (error: any) {
      throw new Error(`获取地图详情失败: ${error.message}`);
    }
  }

  /**
   * 获取地图列表（支持分页和查询）
   */
  static async getMaps(params: MapQueryParams) {
    try {
      const { name, page = 1, limit = 50 } = params;
      
      const query: any = {};
      if (name) {
        query.name = { $regex: name, $options: 'i' };
      }

      const skip = (page - 1) * limit;
      
      const [maps, total] = await Promise.all([
        Map.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Map.countDocuments(query)
      ]);

      return {
        maps,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new Error(`获取地图列表失败: ${error.message}`);
    }
  }
} 