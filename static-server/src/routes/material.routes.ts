import Router from '@koa/router';
import { MaterialAPI } from '../apis/material';
import { ParamContext } from '../types/context';

const router = new Router({
  prefix: '/api/materials'
});

// 获取材料列表
router.get('/', async (ctx: ParamContext) => {
  await MaterialAPI.list(ctx);
});

// 创建材料
router.post('/', async (ctx: ParamContext) => {
  await MaterialAPI.create(ctx);
});

// 根据ID列表获取材料
router.post('/ids', async (ctx: ParamContext) => {
  await MaterialAPI.getByIds(ctx);
});

// 获取单个材料
router.get('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await MaterialAPI.getById(ctx);
});

// 更新材料
router.put('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await MaterialAPI.update(ctx);
});

// 删除材料
router.delete('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await MaterialAPI.delete(ctx);
});

// 计算材料战斗属性
router.get('/:id/combat-stats', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await MaterialAPI.calculateCombatStats(ctx);
});

export default router; 