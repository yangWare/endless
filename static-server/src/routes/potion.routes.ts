import Router from '@koa/router';
import { PotionAPI } from '../apis/potion';
import { ParamContext } from '../types/context';

const router = new Router({
  prefix: '/api/potions'
});

// 获取药水列表
router.get('/', async (ctx: ParamContext) => {
  await PotionAPI.list(ctx);
});

// 创建药水
router.post('/', async (ctx: ParamContext) => {
  await PotionAPI.create(ctx);
});

// 获取单个药水
router.get('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await PotionAPI.getById(ctx);
});

// 更新药水
router.put('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await PotionAPI.update(ctx);
});

// 删除药水
router.delete('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await PotionAPI.delete(ctx);
});

export default router; 