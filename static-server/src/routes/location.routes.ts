import Router from '@koa/router';
import { LocationAPI } from '../apis/location';
import { ParamContext } from '../types/context';

const router = new Router({
  prefix: '/api/locations'
});

// 获取地点列表
router.get('/', async (ctx: ParamContext) => {
  await LocationAPI.list(ctx);
});

// 创建地点
router.post('/', async (ctx: ParamContext) => {
  await LocationAPI.create(ctx);
});

// 获取单个地点
router.get('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await LocationAPI.getById(ctx);
});

// 获取单个地点 - 面向管理后台
router.get('/:id/admin', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await LocationAPI.getByIdForAdmin(ctx);
});

// 更新地点
router.put('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await LocationAPI.update(ctx);
});

// 删除地点
router.delete('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await LocationAPI.delete(ctx);
});

// 生成地点敌人
router.post('/:id/enemies', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await LocationAPI.generateEnemies(ctx);
});

// 获取地点敌人实例列表
router.get('/:id/enemies', async (ctx: ParamContext) => {
  ctx.params = { locationId: ctx.params.id };
  await LocationAPI.getLocationEnemyInstances(ctx);
});

// 锻造装备
router.post('/:id/forge', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await LocationAPI.forge(ctx);
});

// 获取生物情报
router.post('/creature-intel', async (ctx: ParamContext) => {
  await LocationAPI.getCreatureIntel(ctx);
});

export default router; 