import Router from '@koa/router';
import { MaterialTypeAPI } from '../apis/material-type';
import { ParamContext } from '../types/context';

const router = new Router({
  prefix: '/api/material-types'
});

// 获取材料类型列表
router.get('/', async (ctx: ParamContext) => {
  await MaterialTypeAPI.list(ctx);
});

// 创建材料类型
router.post('/', async (ctx: ParamContext) => {
  await MaterialTypeAPI.create(ctx);
});

// 获取单个材料类型
router.get('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await MaterialTypeAPI.getById(ctx);
});

// 更新材料类型
router.put('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await MaterialTypeAPI.update(ctx);
});

// 删除材料类型
router.delete('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await MaterialTypeAPI.delete(ctx);
});

export default router; 