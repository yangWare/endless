import { EnemyInstanceService } from '../services/EnemyInstanceService';
import { BaseContext } from '../types/context';

export class EnemyAPI {
  /**
   * 计算敌人的战斗属性
   */
  static async calculateCombatStats(ctx: BaseContext) {
    try {
      const { enemyInstanceId } = ctx.params;

      // 参数验证
      if (!enemyInstanceId) {
        throw new Error('缺少敌人实例ID');
      }

      // 计算战斗属性
      const stats = await EnemyInstanceService.calculateCombatStats(enemyInstanceId);
      ctx.body = {
        success: true,
        data: stats
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 攻击敌人
   */
  static async attack(ctx: BaseContext) {
    try {
      const { playerId, enemyInstanceId } = ctx.request.body;

      // 参数验证
      if (!playerId || !enemyInstanceId) {
        throw new Error('缺少必要参数');
      }

      // 攻击敌人
      const result = await EnemyInstanceService.attackEnemy(playerId, enemyInstanceId);
      ctx.body = {
        success: true,
        data: result
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error.message
      };
    }
  }
} 