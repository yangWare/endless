import { PotionService, PotionData, PotionQueryParams } from '../services/PotionService';
import { PlayerService } from '../services/PlayerService';
import { BaseContext } from '../types/context';
import { Types } from 'mongoose';
import { Player } from '../models/Player';

export class PotionAPI {
  /**
   * 创建新药品
   */
  static async create(ctx: BaseContext) {
    try {
      const potionData: PotionData = ctx.request.body;
      const potion = await PotionService.createPotion(potionData);
      ctx.body = {
        success: true,
        data: potion
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
   * 更新药品信息
   */
  static async update(ctx: BaseContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少药品ID');
      }
      const updateData: Partial<PotionData> = ctx.request.body;
      const potion = await PotionService.updatePotion(id, updateData);
      ctx.body = {
        success: true,
        data: potion
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
   * 删除药品
   */
  static async delete(ctx: BaseContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少药品ID');
      }
      const potion = await PotionService.deletePotion(id);
      ctx.body = {
        success: true,
        data: potion
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
   * 获取指定药品详情
   */
  static async getById(ctx: BaseContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少药品ID');
      }
      const potion = await PotionService.getPotionById(id);
      ctx.body = {
        success: true,
        data: potion
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
   * 获取药品列表
   */
  static async list(ctx: BaseContext) {
    try {
      const queryParams: PotionQueryParams = {
        name: ctx.query.name as string,
        effectType: ctx.query.effectType as string,
        page: parseInt(ctx.query.page as string) || 1,
        limit: parseInt(ctx.query.limit as string) || 50
      };
      
      const result = await PotionService.getPotions(queryParams);
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

  /**
   * 批量获取药品详情
   */
  static async getBatchByIds(ctx: BaseContext) {
    try {
      const ids = ctx.query.ids as string;
      if (!ids) {
        throw new Error('缺少药品ID列表');
      }
      const idList = ids.split(',').filter(id => id.trim());
      if (idList.length === 0) {
        throw new Error('药品ID列表不能为空');
      }
      const potions = await PotionService.getPotionsByIds(idList);
      ctx.body = {
        success: true,
        data: potions
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