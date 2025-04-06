import { Map } from '../models/Map';
import { Types } from 'mongoose';

export interface MapData {
  name: string;
  description: string;
  bgImage: string;
  width: number;
  height: number;
  startLocationId: Types.ObjectId;
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
   * 获取第一张地图（按创建时间排序）
   */
  static async getFirstMap() {
    try {
      return await Map.findOne().sort({ createdAt: 1 });
    } catch (error: any) {
      throw new Error(`获取第一张地图失败: ${error.message}`);
    }
  }

  /**
   * 根据ID获取地图
   * @param mapId 地图ID
   */
  static async getMapById(mapId: string) {
    try {
      return await Map.findById(mapId);
    } catch (error: any) {
      throw new Error(`获取地图失败: ${error.message}`);
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