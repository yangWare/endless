import { MaterialTypeService, MaterialTypeData, MaterialTypeQueryParams } from '../services/MaterialTypeService';
import { BaseContext } from '../types/context';

export class MaterialTypeAPI {
  /**
   * 创建新材料类型
   */
  static async create(ctx: BaseContext) {
    try {
      const materialTypeData: MaterialTypeData = ctx.request.body;
      const materialType = await MaterialTypeService.createMaterialType(materialTypeData);
      ctx.body = {
        success: true,
        data: materialType
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
   * 更新材料类型信息
   */
  static async update(ctx: BaseContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少材料类型ID');
      }
      const updateData: Partial<MaterialTypeData> = ctx.request.body;
      const materialType = await MaterialTypeService.updateMaterialType(id, updateData);
      ctx.body = {
        success: true,
        data: materialType
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
   * 删除材料类型
   */
  static async delete(ctx: BaseContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少材料类型ID');
      }
      const materialType = await MaterialTypeService.deleteMaterialType(id);
      ctx.body = {
        success: true,
        data: materialType
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
   * 获取指定材料类型详情
   */
  static async getById(ctx: BaseContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少材料类型ID');
      }
      const materialType = await MaterialTypeService.getMaterialTypeById(id);
      ctx.body = {
        success: true,
        data: materialType
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
   * 获取材料类型列表
   */
  static async list(ctx: BaseContext) {
    try {
      const queryParams: MaterialTypeQueryParams = {
        name: ctx.query.name as string,
        page: parseInt(ctx.query.page as string) || 1,
        limit: parseInt(ctx.query.limit as string) || 50
      };
      
      const result = await MaterialTypeService.getMaterialTypes(queryParams);
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