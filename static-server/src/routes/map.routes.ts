import Router from '@koa/router';
import { MapAPI } from '../apis/map';
import { ParamContext } from '../types/context';

const router = new Router({
  prefix: '/api/maps'
});

// 获取地图列表
router.get('/', async (ctx: ParamContext) => {
  await MapAPI.list(ctx);
});

// 创建地图
router.post('/', async (ctx: ParamContext) => {
  await MapAPI.create(ctx);
});

// 获取单个地图
router.get('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await MapAPI.getById(ctx);
});

// 更新地图
router.put('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await MapAPI.update(ctx);
});

// 删除地图
router.delete('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await MapAPI.delete(ctx);
});

export default router; 