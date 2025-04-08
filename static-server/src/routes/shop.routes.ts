import Router from '@koa/router';
import { ShopAPI } from '../apis/shop';
import { ParamContext } from '../types/context';

const router = new Router({
  prefix: '/api/shop'
});

// 获取药水列表
router.post('/potions', async (ctx: ParamContext) => {
  await ShopAPI.getPotions(ctx);
});

// 出售物品
router.post('/sell', async (ctx: ParamContext) => {
  await ShopAPI.sellItem(ctx);
});

// 购买药水
router.post('/buy/potion', async (ctx: ParamContext) => {
  await ShopAPI.buyPotion(ctx);
});

// 计算材料价格
router.post('/calculate/material', async (ctx: ParamContext) => {
  await ShopAPI.calculateMaterialPrice(ctx);
});

// 计算装备价格
router.post('/calculate/equipment', async (ctx: ParamContext) => {
  await ShopAPI.calculateEquipmentPrice(ctx);
});

export default router; 