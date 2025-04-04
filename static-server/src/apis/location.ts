import { LocationService, LocationData, LocationQueryParams } from '../services/LocationService';
import { Types } from 'mongoose';
import { LocationContext } from '../types/context';

export class LocationAPI {
  /**
   * 创建新地点
   */
  static async create(ctx: LocationContext) {
    try {
      const locationData: LocationData = ctx.request.body;
      const location = await LocationService.createLocation(locationData);
      ctx.body = {
        success: true,
        data: location
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
   * 更新地点信息
   */
  static async update(ctx: LocationContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少地点ID');
      }
      const updateData: Partial<LocationData> = ctx.request.body;
      const location = await LocationService.updateLocation(id, updateData);
      ctx.body = {
        success: true,
        data: location
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
   * 删除地点
   */
  static async delete(ctx: LocationContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少地点ID');
      }
      const location = await LocationService.deleteLocation(id);
      ctx.body = {
        success: true,
        data: location
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
   * 获取指定地点详情
   */
  static async getById(ctx: LocationContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少地点ID');
      }
      const location = await LocationService.getLocationById(id);
      ctx.body = {
        success: true,
        data: location
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
   * 获取地点列表
   */
  static async list(ctx: LocationContext) {
    try {
      const queryParams: LocationQueryParams = {
        name: ctx.query.name as string,
        mapId: ctx.query.mapId ? new Types.ObjectId(ctx.query.mapId as string) : undefined,
        page: parseInt(ctx.query.page as string) || 1,
        limit: parseInt(ctx.query.limit as string) || 50
      };
      
      const result = await LocationService.getLocations(queryParams);
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