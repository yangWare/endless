import Router from '@koa/router';
import { CreatureAPI } from '../apis/creature';
import { ParamContext } from '../types/context';

const router = new Router({
  prefix: '/api/creatures'
});

// 获取生物列表
router.get('/', async (ctx: ParamContext) => {
  await CreatureAPI.list(ctx);
});

// 创建生物
router.post('/', async (ctx: ParamContext) => {
  await CreatureAPI.create(ctx);
});

// 获取单个生物
router.get('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await CreatureAPI.getById(ctx);
});

// 更新生物
router.put('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await CreatureAPI.update(ctx);
});

// 获取单个生物 -- 面向管理后台提供，raceId不进行关联
router.get('/:id/admin', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await CreatureAPI.getByIdForAdmin(ctx);
});

// 删除生物
router.delete('/:id', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await CreatureAPI.delete(ctx);
});

export default router; 