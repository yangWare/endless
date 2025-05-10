import { EnemyInstanceService } from '../services/EnemyInstanceService';
import { BaseContext, ParamContext } from '../types/context';

export class EnemyAPI {
  /**
   * 计算敌人的战斗属性
   */
  static async calculateCombatStats(ctx: BaseContext) {
    try {
      const enemyInstanceId = ctx.params.id;

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
      const { playerId, enemyInstanceIds, isContinue } = ctx.request.body;

      // 参数验证
      if (!playerId || !enemyInstanceIds || ![0, 1].includes(isContinue)) {
        throw new Error('缺少必要参数');
      }

      // 攻击敌人
      const result = await EnemyInstanceService.attackEnemy(playerId, enemyInstanceIds, isContinue);
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

  /**
   * 计算生物战斗属性
   */
  static async calculateCreatureCombatStats(ctx: ParamContext) {
    try {
      const creatureId = ctx.params.id;
      if (!creatureId) {
        throw new Error('缺少生物ID');
      }

      const combatStats = await EnemyInstanceService.calculateCreatureCombatStats(creatureId);
      
      ctx.body = {
        success: true,
        data: combatStats
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