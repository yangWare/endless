import { MapService, MapData, MapQueryParams } from '../services/MapService';
import { Types } from 'mongoose';
import { MapContext } from '../types/context';

export class MapAPI {
  /**
   * 创建新地图
   */
  static async create(ctx: MapContext) {
    try {
      const mapData: MapData = ctx.request.body;
      const map = await MapService.createMap(mapData);
      ctx.body = {
        success: true,
        data: map
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新地图信息
   */
  static async update(ctx: MapContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少地图ID');
      }
      const updateData: Partial<MapData> = ctx.request.body;
      const map = await MapService.updateMap(id, updateData);
      ctx.body = {
        success: true,
        data: map
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 删除地图
   */
  static async delete(ctx: MapContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少地图ID');
      }
      const map = await MapService.deleteMap(id);
      ctx.body = {
        success: true,
        data: map
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取指定地图详情
   */
  static async getById(ctx: MapContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少地图ID');
      }
      const map = await MapService.getMapById(id);
      ctx.body = {
        success: true,
        data: map
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取地图列表
   */
  static async list(ctx: MapContext) {
    try {
      const queryParams: MapQueryParams = {
        name: ctx.query.name as string,
        page: parseInt(ctx.query.page as string) || 1,
        limit: parseInt(ctx.query.limit as string) || 50
      };
      
      const result = await MapService.getMaps(queryParams);
      ctx.body = {
        success: true,
        data: result
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error.message
      };
    }
  }
} 