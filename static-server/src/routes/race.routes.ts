import Router from '@koa/router';
import { RaceAPI } from '../apis/race';
import { ParamContext } from '../types/context';

const router = new Router({
  prefix: '/api/races'
});

// 获取种族列表
router.get('/', async (ctx: ParamContext) => {
  await RaceAPI.list(ctx);
});

// 创建种族
router.post('/', async (ctx: ParamContext) => {
  await RaceAPI.create(ctx);
});

// 获取单个种族
router.get('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await RaceAPI.getById(ctx);
});

// 更新种族
router.put('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await RaceAPI.update(ctx);
});

// 删除种族
router.delete('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await RaceAPI.delete(ctx);
});

export default router; 