import { MaterialService, MaterialData, MaterialQueryParams } from '../services/MaterialService';
import { BaseContext } from '../types/context';

export class MaterialAPI {
  /**
   * 创建新材料
   */
  static async create(ctx: BaseContext) {
    try {
      const materialData: MaterialData = ctx.request.body;
      const material = await MaterialService.createMaterial(materialData);
      ctx.body = {
        success: true,
        data: material
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
   * 更新材料信息
   */
  static async update(ctx: BaseContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少材料ID');
      }
      const updateData: Partial<MaterialData> = ctx.request.body;
      const material = await MaterialService.updateMaterial(id, updateData);
      ctx.body = {
        success: true,
        data: material
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
   * 删除材料
   */
  static async delete(ctx: BaseContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少材料ID');
      }
      const material = await MaterialService.deleteMaterial(id);
      ctx.body = {
        success: true,
        data: material
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
   * 获取指定材料详情
   */
  static async getById(ctx: BaseContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少材料ID');
      }
      const material = await MaterialService.getMaterialById(id);
      ctx.body = {
        success: true,
        data: material
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
   * 获取材料列表
   */
  static async list(ctx: BaseContext) {
    try {
      const queryParams: MaterialQueryParams = {
        name: ctx.query.name as string,
        level: ctx.query.level ? parseInt(ctx.query.level as string) : undefined,
        typeId: ctx.query.typeId as string,
        page: parseInt(ctx.query.page as string) || 1,
        limit: parseInt(ctx.query.limit as string) || 50
      };
      
      const result = await MaterialService.getMaterials(queryParams);
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
   * 根据ID列表获取材料
   */
  static async getByIds(ctx: BaseContext) {
    try {
      const { ids } = ctx.request.body;
      if (!ids || !Array.isArray(ids)) {
        throw new Error('缺少材料ID列表或格式错误');
      }
      const materials = await MaterialService.getMaterialsByIds(ids);
      ctx.body = {
        success: true,
        data: materials
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