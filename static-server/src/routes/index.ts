import Router from '@koa/router';
import raceRoutes from './race.routes';
import materialTypeRoutes from './material-type.routes';
import materialRoutes from './material.routes';
import creatureRoutes from './creature.routes';
import potionRoutes from './potion.routes';
import locationRoutes from './location.routes';
import mapRoutes from './map.routes';
import playerRoutes from './player.routes';
import enemyRoutes from './enemy.routes';
import shopRoutes from './shop.routes';
import { errorHandler, bodyParser, endlessPrefix } from '../middlewares/common';
import { Context } from 'koa';
import serve from 'koa-static';
import path from 'path';

const router = new Router();

// 注册错误处理和请求体解析中间件
router.use(errorHandler);
router.use(bodyParser);

// 创建一个新的路由实例来处理 API 路由
const apiRouter = new Router();

// 注册子路由
apiRouter.use(raceRoutes.routes());
apiRouter.use(raceRoutes.allowedMethods());
apiRouter.use(materialTypeRoutes.routes());
apiRouter.use(materialTypeRoutes.allowedMethods());
apiRouter.use(materialRoutes.routes());
apiRouter.use(materialRoutes.allowedMethods());
apiRouter.use(creatureRoutes.routes());
apiRouter.use(creatureRoutes.allowedMethods());
apiRouter.use(potionRoutes.routes());
apiRouter.use(potionRoutes.allowedMethods());
apiRouter.use(locationRoutes.routes());
apiRouter.use(locationRoutes.allowedMethods());
apiRouter.use(mapRoutes.routes());
apiRouter.use(mapRoutes.allowedMethods());
apiRouter.use(playerRoutes.routes());
apiRouter.use(playerRoutes.allowedMethods());
apiRouter.use(enemyRoutes.routes());
apiRouter.use(enemyRoutes.allowedMethods());
apiRouter.use(shopRoutes.routes());
apiRouter.use(shopRoutes.allowedMethods());

// 注册 endless 前缀处理中间件和 API 路由
router.use('/endless', endlessPrefix, apiRouter.routes(), apiRouter.allowedMethods());

// 前端静态文件服务
router.get('/(.*)', async (ctx: Context, next) => {
  if (ctx.path.startsWith('/images')) {
    const newPath = ctx.path.replace('/images', '');
    ctx.path = newPath;
    await serve(path.join(__dirname, '../../images'))(ctx, next);
    return;
  }

  if (ctx.path === '/') {
    ctx.path = '/static/index.html';
  }
  
  // 处理 admin 路径
  if (ctx.path.startsWith('/admin')) {
    const newPath = ctx.path.replace('/admin', '');
    try {
      await require('fs').promises.access(path.join(__dirname, '../../admin', newPath));
      ctx.path = newPath;
    } catch (error) {
      ctx.path = '/index.html';
    }
    await serve(path.join(__dirname, '../../admin'))(ctx, next);
    return;
  }

  if (ctx.path.startsWith('/static')) {
    const newPath = ctx.path.replace('/static', '');
    try {
      await require('fs').promises.access(path.join(__dirname, '../../static', newPath));
      ctx.path = newPath;
    } catch (error) {
      ctx.path = '/index.html';
    }
    await serve(path.join(__dirname, '../../static'))(ctx, next);
  } else {
    await next();
  }
});

export default router; 