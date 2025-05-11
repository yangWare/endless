import Router from '@koa/router';
import { PlayerAPI } from '../apis/player';
import { ParamContext } from '../types/context';

const router = new Router({
  prefix: '/api/players'
});

// 创建玩家
router.post('/', async (ctx: ParamContext) => {
  await PlayerAPI.create(ctx);
});

// 获取玩家信息
router.post('/info', async (ctx: ParamContext) => {
  await PlayerAPI.getInfo(ctx);
});

// 获取玩家位置
router.post('/location', async (ctx: ParamContext) => {
  await PlayerAPI.getLocation(ctx);
});

// 更新玩家位置
router.post('/location/update', async (ctx: ParamContext) => {
  await PlayerAPI.updateLocation(ctx);
});

// 获取玩家战斗状态
router.post('/combat-stats', async (ctx: ParamContext) => {
  await PlayerAPI.getCombatStats(ctx);
});

// 装备物品
router.post('/equip', async (ctx: ParamContext) => {
  await PlayerAPI.equipItem(ctx);
});

// 删除玩家
router.post('/delete', async (ctx: ParamContext) => {
  await PlayerAPI.delete(ctx);
});

// 复活玩家
router.post('/revive', async (ctx: ParamContext) => {
  await PlayerAPI.revive(ctx);
});

// 使用药水
router.post('/use-potion', async (ctx: ParamContext) => {
  await PlayerAPI.usePotion(ctx);
});

// 脱战
router.post('/escape', async (ctx: ParamContext) => {
  await PlayerAPI.escape(ctx);
});

export default router; 