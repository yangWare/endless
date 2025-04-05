import Koa from 'koa';
import serve from 'koa-static';
import path from 'path';
import { connectDB } from './db';
import { RaceAPI } from './apis/race';
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
  const match = ctx.path.match(/^\/api\/races\/([a-zA-Z0-9]+)$/);
  if (match) {
    ctxWithParams.params.id = match[1];
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

  await next();
});

// 配置静态文件服务
app.use(async (ctx: BaseContext, next) => {
  if (ctx.path === '/') {
    ctx.path = '/static/index.html';
  }
  if (ctx.path.startsWith('/static')) {
    const newPath = ctx.path.replace('/static', '');
    if (newPath === '' || newPath === '/') {
      ctx.path = '/index.html';
    } else {
      ctx.path = newPath;
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