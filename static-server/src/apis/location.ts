import { LocationService, LocationData, LocationQueryParams } from '../services/LocationService';
import { ForgeService } from '../services/ForgeService';
import { ShopService } from '../services/ShopService';
import { Types } from 'mongoose';
import { LocationContext, BaseContext } from '../types/context';

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
        throw new Error('缺少ID');
      }
      await LocationService.delete(id);
      ctx.body = {
        success: true,
        message: '地点及其相关数据已成功删除'
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
   * 获取指定地点详情 - 面向管理后台
   */
  static async getByIdForAdmin(ctx: LocationContext) {
    try {
      const id = ctx.params.id;
      if (!id) {
        throw new Error('缺少地点ID');
      }
      const location = await LocationService.getLocationByIdForAdmin(id);
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

  /**
   * 生成敌人
   */
  static async generateEnemies(ctx: BaseContext) {
    try {
      const { playerId, isCotinue } = ctx.request.body;

      // 参数验证
      if (!playerId || ![0, 1].includes(isCotinue)) {
        throw new Error('缺少locationId或playerId或isContinue不合法');
      }

      // 生成敌人
      const result = await LocationService.generateEnemies(playerId, isCotinue);
      ctx.body = {
        success: true,
        data: result
      };
    } catch (error: any) {
      console.log(error)
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取指定地点的敌人实例列表
   */
  static async getLocationEnemyInstances(ctx: BaseContext) {
    try {
      const { locationId } = ctx.params;

      if (!locationId) {
        throw new Error('缺少地点ID');
      }

      const enemyInstances = await LocationService.getLocationEnemyInstances(locationId);
      ctx.body = {
        success: true,
        data: enemyInstances
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
   * 锻造装备
   */
  static async forge(ctx: BaseContext) {
    try {
      const { playerId, materialIds, assistMaterialIds, equipmentType, forgeToolLevel } = ctx.request.body;
      const locationId = ctx.params.id;

      // 参数验证
      if (!playerId) {
        throw new Error('缺少玩家ID');
      }
      if (!locationId) {
        throw new Error('缺少位置ID');
      }
      if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
        throw new Error('缺少或无效的材料ID列表');
      }
      if (assistMaterialIds && (!Array.isArray(assistMaterialIds) || assistMaterialIds.length > 5)) {
        throw new Error('辅助材料数量不能超过5个');
      }
      if (!equipmentType || !['weapon', 'armor', 'wrist', 'accessory', 'helmet', 'boots'].includes(equipmentType)) {
        throw new Error('无效的装备类型');
      }
      if (!forgeToolLevel || typeof forgeToolLevel !== 'number' || forgeToolLevel < 1) {
        throw new Error('无效的锻造炉等级');
      }

      // 创建锻造服务实例
      const forgeService = new ForgeService();

      // 执行锻造
      const result = await forgeService.forge({
        playerId,
        locationId,
        materialIds,
        assistMaterialIds: assistMaterialIds || [],
        equipmentType,
        forgeToolLevel
      });

      ctx.body = {
        success: result.success,
        message: result.message,
        data: {
          equipment: result.equipment,
          forgeCost: result.forgeCost,
          curForgeHeartSkill: result.curForgeHeartSkill
        }
      };
    } catch (error: any) {
      console.error('锻造失败:', error);
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取商店药水列表
   */
  static async getShopPotions(ctx: BaseContext) {
    try {
      const { locationId } = ctx.params;

      if (!locationId) {
        throw new Error('缺少地点ID');
      }

      const potions = await ShopService.getShopPotions(locationId);
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