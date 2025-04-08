import Router from '@koa/router';
import { EnemyAPI } from '../apis/enemy';
import { ParamContext } from '../types/context';

const router = new Router({
  prefix: '/api/enemies'
});

// 获取敌人战斗状态
router.get('/:id/combat-stats', async (ctx: ParamContext) => {
  ctx.params = { id: ctx.params.id };
  await EnemyAPI.calculateCombatStats(ctx);
});

// 敌人攻击
router.post('/attack', async (ctx: ParamContext) => {
  await EnemyAPI.attack(ctx);
});

export default router; 