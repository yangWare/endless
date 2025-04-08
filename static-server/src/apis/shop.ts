import { ShopService } from '../services/ShopService';
import { BaseContext } from '../types/context';

export class ShopAPI {
  /**
   * 获取商店的药水列表
   */
  static async getPotions(ctx: BaseContext) {
    try {
      const { locationId } = ctx.request.body;

      // 参数验证
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

  /**
   * 出售物品给商店
   */
  static async sellItem(ctx: BaseContext) {
    try {
      const { playerId, locationId, item } = ctx.request.body;

      // 参数验证
      if (!playerId || !locationId || !item) {
        throw new Error('缺少必要参数');
      }

      const price = await ShopService.sellItem(playerId, locationId, item);
      ctx.body = {
        success: true,
        data: {
          price
        }
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
   * 购买药品
   */
  static async buyPotion(ctx: BaseContext) {
    try {
      const { playerId, locationId, potionId } = ctx.request.body;

      // 参数验证
      if (!playerId || !locationId || !potionId) {
        throw new Error('缺少必要参数');
      }

      const price = await ShopService.buyPotion(playerId, locationId, potionId);
      ctx.body = {
        success: true,
        data: {
          price
        }
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
   * 计算材料价格
   */
  static async calculateMaterialPrice(ctx: BaseContext) {
    try {
      const { materialId } = ctx.request.body;

      // 参数验证
      if (!materialId) {
        throw new Error('缺少材料ID');
      }

      const price = await ShopService.calculateMaterialPrice(materialId);
      ctx.body = {
        success: true,
        data: {
          price
        }
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
   * 计算装备价格
   */
  static async calculateEquipmentPrice(ctx: BaseContext) {
    try {
      const { equipment } = ctx.request.body;

      // 参数验证
      if (!equipment || !equipment.combatStats) {
        throw new Error('缺少装备信息或战斗属性');
      }

      const price = ShopService.calculateEquipmentPrice(equipment);
      ctx.body = {
        success: true,
        data: {
          price
        }
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