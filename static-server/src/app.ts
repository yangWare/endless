import Koa from 'koa';
import serve from 'koa-static';
import path from 'path';
import { connectDB } from './db';
import { RaceAPI } from './apis/race';
import { MaterialTypeAPI } from './apis/material-type';
import { MaterialAPI } from './apis/material';
import { CreatureAPI } from './apis/creature';
import { PotionAPI } from './apis/potion';
import { LocationAPI } from './apis/location';
import { MapAPI } from './apis/map';
import { PlayerAPI } from './apis/player';
import { BaseContext, ParamContext } from './types/context';

const app = new Koa();
const PORT = process.env.PORT || 3000;

// 连接数据库
connectDB();

// 解析请求体
app.use(async (ctx: BaseContext, next) => {
  if (ctx.request.method === 'POST' || ctx.request.method === 'PUT') {
    ctx.request.body = await new Promise((resolve) => {
      let data = '';
      ctx.req.on('data', (chunk) => {
        data += chunk;
      });
      ctx.req.on('end', () => {
        resolve(JSON.parse(data));
      });
    });
  }
  await next();
});

// 处理 endless 前缀
app.use(async (ctx: BaseContext, next) => {
  const newPath = ctx.path.replace('/endless', '');
  ctx.path = newPath || '/';
  await next();
});

// 图片文件服务
app.use(async (ctx: BaseContext, next) => {
  if (ctx.path.startsWith('/images')) {
    const newPath = ctx.path.replace('/images', '');
    ctx.path = newPath;
    await serve(path.join(__dirname, '../images'))(ctx, next);
    return;
  }
  await next();
});

// API 路由
app.use(async (ctx: BaseContext, next) => {
  // 为路由添加 params 属性
  const ctxWithParams = ctx as ParamContext;
  ctxWithParams.params = {};

  // 从路径中提取 ID
  const match = ctx.path.match(/^\/api\/(races|material-types|materials|creatures|potions|locations|maps)\/([a-zA-Z0-9]+)$/);
  if (match) {
    ctxWithParams.params.id = match[2];
  }

  // 种族 API
  if (ctx.path === '/api/races' && ctx.method === 'GET') {
    await RaceAPI.list(ctxWithParams);
    return;
  }

  if (ctx.path === '/api/races' && ctx.method === 'POST') {
    await RaceAPI.create(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/races\/[a-zA-Z0-9]+$/) && ctx.method === 'GET') {
    await RaceAPI.getById(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/races\/[a-zA-Z0-9]+$/) && ctx.method === 'PUT') {
    await RaceAPI.update(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/races\/[a-zA-Z0-9]+$/) && ctx.method === 'DELETE') {
    await RaceAPI.delete(ctxWithParams);
    return;
  }

  // 材料类型 API
  if (ctx.path === '/api/material-types' && ctx.method === 'GET') {
    await MaterialTypeAPI.list(ctxWithParams);
    return;
  }

  if (ctx.path === '/api/material-types' && ctx.method === 'POST') {
    await MaterialTypeAPI.create(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/material-types\/[a-zA-Z0-9]+$/) && ctx.method === 'GET') {
    await MaterialTypeAPI.getById(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/material-types\/[a-zA-Z0-9]+$/) && ctx.method === 'PUT') {
    await MaterialTypeAPI.update(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/material-types\/[a-zA-Z0-9]+$/) && ctx.method === 'DELETE') {
    await MaterialTypeAPI.delete(ctxWithParams);
    return;
  }

  // 材料 API
  if (ctx.path === '/api/materials' && ctx.method === 'GET') {
    await MaterialAPI.list(ctxWithParams);
    return;
  }

  if (ctx.path === '/api/materials' && ctx.method === 'POST') {
    await MaterialAPI.create(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/materials\/[a-zA-Z0-9]+$/) && ctx.method === 'GET') {
    await MaterialAPI.getById(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/materials\/[a-zA-Z0-9]+$/) && ctx.method === 'PUT') {
    await MaterialAPI.update(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/materials\/[a-zA-Z0-9]+$/) && ctx.method === 'DELETE') {
    await MaterialAPI.delete(ctxWithParams);
    return;
  }

  // 生物 API
  if (ctx.path === '/api/creatures' && ctx.method === 'GET') {
    await CreatureAPI.list(ctxWithParams);
    return;
  }

  if (ctx.path === '/api/creatures' && ctx.method === 'POST') {
    await CreatureAPI.create(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/creatures\/[a-zA-Z0-9]+$/) && ctx.method === 'GET') {
    await CreatureAPI.getById(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/creatures\/[a-zA-Z0-9]+$/) && ctx.method === 'PUT') {
    await CreatureAPI.update(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/creatures\/[a-zA-Z0-9]+$/) && ctx.method === 'DELETE') {
    await CreatureAPI.delete(ctxWithParams);
    return;
  }

  // 药品 API
  if (ctx.path === '/api/potions' && ctx.method === 'GET') {
    await PotionAPI.list(ctxWithParams);
    return;
  }

  if (ctx.path === '/api/potions' && ctx.method === 'POST') {
    await PotionAPI.create(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/potions\/[a-zA-Z0-9]+$/) && ctx.method === 'GET') {
    await PotionAPI.getById(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/potions\/[a-zA-Z0-9]+$/) && ctx.method === 'PUT') {
    await PotionAPI.update(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/potions\/[a-zA-Z0-9]+$/) && ctx.method === 'DELETE') {
    await PotionAPI.delete(ctxWithParams);
    return;
  }

  // 地点 API
  if (ctx.path === '/api/locations' && ctx.method === 'GET') {
    await LocationAPI.list(ctxWithParams);
    return;
  }

  if (ctx.path === '/api/locations' && ctx.method === 'POST') {
    await LocationAPI.create(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/locations\/[a-zA-Z0-9]+$/) && ctx.method === 'GET') {
    await LocationAPI.getById(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/locations\/[a-zA-Z0-9]+$/) && ctx.method === 'PUT') {
    await LocationAPI.update(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/locations\/[a-zA-Z0-9]+$/) && ctx.method === 'DELETE') {
    await LocationAPI.delete(ctxWithParams);
    return;
  }

  // 地图 API
  if (ctx.path === '/api/maps' && ctx.method === 'GET') {
    await MapAPI.list(ctxWithParams);
    return;
  }

  if (ctx.path === '/api/maps' && ctx.method === 'POST') {
    await MapAPI.create(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/maps\/[a-zA-Z0-9]+$/) && ctx.method === 'GET') {
    await MapAPI.getById(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/maps\/[a-zA-Z0-9]+$/) && ctx.method === 'PUT') {
    await MapAPI.update(ctxWithParams);
    return;
  }

  if (ctx.path.match(/^\/api\/maps\/[a-zA-Z0-9]+$/) && ctx.method === 'DELETE') {
    await MapAPI.delete(ctxWithParams);
    return;
  }

  // 玩家 API
  if (ctx.path === '/api/players' && ctx.method === 'POST') {
    await PlayerAPI.create(ctxWithParams);
    return;
  }

  if (ctx.path === '/api/players/info' && ctx.method === 'POST') {
    await PlayerAPI.getInfo(ctxWithParams);
    return;
  }

  if (ctx.path === '/api/players/location' && ctx.method === 'POST') {
    await PlayerAPI.getLocation(ctxWithParams);
    return;
  }

  if (ctx.path === '/api/players/location/update' && ctx.method === 'POST') {
    await PlayerAPI.updateLocation(ctxWithParams);
    return;
  }

  await next();
});

// 配置静态文件服务
app.use(async (ctx: BaseContext, next) => {
  if (ctx.path === '/') {
    ctx.path = '/static/index.html';
  }
  // 处理 admin 路径
  if (ctx.path.startsWith('/admin')) {
    const newPath = ctx.path.replace('/admin', '');
    // 检查文件是否存在
    const filePath = path.join(__dirname, '../admin', newPath);
    try {
      await require('fs').promises.access(filePath);
      ctx.path = newPath;
    } catch (error) {
      // 文件不存在，返回 index.html
      ctx.path = '/index.html';
    }
    await serve(path.join(__dirname, '../admin'))(ctx, next);
    return;
  }
  if (ctx.path.startsWith('/static')) {
    const newPath = ctx.path.replace('/static', '');
    // 检查文件是否存在
    const filePath = path.join(__dirname, '../static', newPath);
    try {
      await require('fs').promises.access(filePath);
      ctx.path = newPath;
    } catch (error) {
      // 文件不存在，返回 index.html
      ctx.path = '/index.html';
    }
    await serve(path.join(__dirname, '../static'))(ctx, next);
  } else {
    await next();
  }
});

// 错误处理
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 