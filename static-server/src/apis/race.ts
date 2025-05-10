import { RaceService, RaceData, RaceQueryParams } from '../services/RaceService';
import { RaceContext } from '../types/context';

export class RaceAPI {
  /**
   * 创建新种族
   */
  static async create(ctx: RaceContext) {
    try {
      const raceData: RaceData = ctx.request.body;
      const race = await RaceService.createRace(raceData);
      ctx.body = {
        success: true,
        data: race
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
   * 更新种族信息
   */
  static async update(ctx: RaceContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少种族ID');
      }
      const updateData: Partial<RaceData> = ctx.request.body;
      const race = await RaceService.updateRace(id, updateData);
      ctx.body = {
        success: true,
        data: race
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
   * 删除种族
   */
  static async delete(ctx: RaceContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少种族ID');
      }
      const race = await RaceService.deleteRace(id);
      ctx.body = {
        success: true,
        data: race
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
   * 获取指定种族详情
   */
  static async getById(ctx: RaceContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少种族ID');
      }
      const race = await RaceService.getRaceById(id);
      ctx.body = {
        success: true,
        data: race
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
   * 获取种族列表
   */
  static async list(ctx: RaceContext) {
    try {
      const queryParams: RaceQueryParams = {
        name: ctx.query.name as string,
        parentRace: ctx.query.parentRace as string,
        page: parseInt(ctx.query.page as string) || 1,
        limit: parseInt(ctx.query.limit as string) || 50
      };
      
      const result = await RaceService.getRaces(queryParams);
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