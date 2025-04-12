import { CreatureService, CreatureData, CreatureQueryParams } from '../services/CreatureService';
import { BaseContext } from '../types/context';
import { Types } from 'mongoose';

export class CreatureAPI {
  /**
   * 创建新生物
   */
  static async create(ctx: BaseContext) {
    try {
      const creatureData: CreatureData = ctx.request.body;
      const creature = await CreatureService.createCreature(creatureData);
      ctx.body = {
        success: true,
        data: creature
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
   * 更新生物信息
   */
  static async update(ctx: BaseContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少生物ID');
      }
      const updateData: Partial<CreatureData> = ctx.request.body;
      const creature = await CreatureService.updateCreature(id, updateData);
      ctx.body = {
        success: true,
        data: creature
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
   * 删除生物
   */
  static async delete(ctx: BaseContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少生物ID');
      }
      const creature = await CreatureService.deleteCreature(id);
      ctx.body = {
        success: true,
        data: creature
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
   * 获取指定生物详情
   */
  static async getById(ctx: BaseContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少生物ID');
      }
      const creature = await CreatureService.getCreatureById(id);
      ctx.body = {
        success: true,
        data: creature
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
   * 获取指定生物详情 -- 面向管理后台提供，raceId不进行关联
   */
  static async getByIdForAdmin(ctx: BaseContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少生物ID');
      }
      const creature = await CreatureService.getCreatureByIdForAdmin(id);
      ctx.body = {
        success: true,
        data: creature
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
   * 获取生物列表
   */
  static async list(ctx: BaseContext) {
    try {
      const queryParams: CreatureQueryParams = {
        name: ctx.query.name as string,
        raceId: ctx.query.raceId ? new Types.ObjectId(ctx.query.raceId as string) : undefined,
        level: ctx.query.level ? parseInt(ctx.query.level as string) : undefined,
        page: parseInt(ctx.query.page as string) || 1,
        limit: parseInt(ctx.query.limit as string) || 50
      };
      
      const result = await CreatureService.getCreatures(queryParams);
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