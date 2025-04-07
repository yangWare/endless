import { PlayerService } from '../services/PlayerService';
import { BaseContext } from '../types/context';

export class PlayerAPI {
  /**
   * 创建新玩家
   */
  static async create(ctx: BaseContext) {
    try {
      const { username, password, nickname } = ctx.request.body;

      // 参数验证
      if (!username || !password || !nickname) {
        throw new Error('缺少必要参数');
      }

      // 创建玩家
      const player = await PlayerService.createPlayer(username, password, nickname);

      // 返回创建成功的玩家信息（不包含密码）
      const { password: _, ...playerWithoutPassword } = player.toObject();
      ctx.body = {
        success: true,
        data: playerWithoutPassword
      };
    } catch (error: any) {
      console.log(error)
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取玩家信息
   */
  static async getInfo(ctx: BaseContext) {
    try {
      const { username, password } = ctx.request.body;

      // 参数验证
      if (!username || !password) {
        throw new Error('缺少必要参数');
      }

      // 获取玩家信息
      const player = await PlayerService.getPlayerByCredentials(username, password);
      if (!player) {
        throw new Error('账号或密码错误');
      }

      // 返回玩家信息（不包含密码）
      const { password: _, ...playerWithoutPassword } = player.toObject();
      ctx.body = {
        success: true,
        data: playerWithoutPassword
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
   * 更新玩家位置
   */
  static async updateLocation(ctx: BaseContext) {
    try {
      const { playerId, mapId, locationId } = ctx.request.body;

      // 参数验证
      if (!playerId || !mapId || !locationId) {
        throw new Error('缺少必要参数');
      }

      // 更新玩家位置
      const player = await PlayerService.updatePlayerLocation(playerId, mapId, locationId);
      ctx.body = {
        success: true,
        data: player
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
   * 获取玩家位置信息
   */
  static async getLocation(ctx: BaseContext) {
    try {
      const { playerId } = ctx.request.body;

      // 参数验证
      if (!playerId) {
        throw new Error('缺少玩家ID');
      }

      // 获取玩家位置信息
      const location = await PlayerService.getPlayerLocation(playerId);
      ctx.body = {
        success: true,
        data: location
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
   * 获取玩家战斗属性
   */
  static async getCombatStats(ctx: BaseContext) {
    try {
      const { playerId } = ctx.request.body;

      // 参数验证
      if (!playerId) {
        throw new Error('缺少玩家ID');
      }

      // 获取玩家战斗属性
      const combatStats = await PlayerService.calculateCombatStats(playerId);
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

  /**
   * 穿戴装备
   */
  static async equipItem(ctx: BaseContext) {
    try {
      const { playerId, equipmentId } = ctx.request.body;

      // 参数验证
      if (!playerId || !equipmentId) {
        throw new Error('缺少必要参数');
      }

      // 穿戴装备
      const player = await PlayerService.equipItem(playerId, equipmentId);
      
      // 返回更新后的玩家信息（不包含密码）
      const { password: _, ...playerWithoutPassword } = player.toObject();
      ctx.body = {
        success: true,
        data: playerWithoutPassword
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
   * 删除玩家
   */
  static async delete(ctx: BaseContext) {
    try {
      const { username, password } = ctx.request.body;

      // 参数验证
      if (!username || !password) {
        throw new Error('缺少用户名或密码');
      }

      // 删除玩家
      const success = await PlayerService.deletePlayer(username, password);
      if (!success) {
        throw new Error('删除玩家失败');
      }

      ctx.body = {
        success: true,
        message: '玩家删除成功'
      };
    } catch (error: any) {
      console.log(error)
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error.message
      };
    }
  }
} 