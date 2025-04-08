import { Location } from '../models/Location';
import { Potion } from '../models/Potion';
import { Types } from 'mongoose';

export interface ShopPotionItem {
  potionId: Types.ObjectId;
  price: number;
}

export class ShopService {
  /**
   * 获取商店的药水列表
   */
  static async getShopPotions(locationId: string) {
    try {
      const location = await Location.findById(locationId)
        .populate({
          path: 'npc.shop.potionItems.potionId',
          model: 'Potion'
        });

      if (!location) {
        throw new Error('地点不存在');
      }

      return location.npc?.shop?.potionItems || [];
    } catch (error: any) {
      throw new Error(`获取商店药水列表失败: ${error.message}`);
    }
  }

  /**
   * 更新商店的药水列表
   */
  static async updateShopPotions(locationId: string, potionItems: ShopPotionItem[]) {
    try {
      // 验证所有药水ID是否有效
      for (const item of potionItems) {
        const potion = await Potion.findById(item.potionId);
        if (!potion) {
          throw new Error(`药水ID ${item.potionId} 不存在`);
        }
      }

      const location = await Location.findByIdAndUpdate(
        locationId,
        {
          'npc.shop.potionItems': potionItems
        },
        { new: true }
      ).populate({
        path: 'npc.shop.potionItems.potionId',
        model: 'Potion'
      });

      if (!location) {
        throw new Error('地点不存在');
      }

      return location.npc?.shop?.potionItems || [];
    } catch (error: any) {
      throw new Error(`更新商店药水列表失败: ${error.message}`);
    }
  }
} 