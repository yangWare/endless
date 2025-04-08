import { Context, Next } from 'koa';
import { BaseContext } from '../types/context';

interface AppError extends Error {
  status?: number;
}

// 错误处理中间件
export const errorHandler = async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    const err = error as AppError;
    console.error('Server Error:', err);
    ctx.status = err.status || 500;
    ctx.body = {
      error: err.message || 'Internal Server Error'
    };
  }
};

// 请求体解析中间件
export const bodyParser = async (ctx: BaseContext, next: Next) => {
  if (ctx.request.method === 'POST' || ctx.request.method === 'PUT') {
    ctx.request.body = await new Promise((resolve) => {
      let data = '';
      ctx.req.on('data', (chunk) => {
        data += chunk;
      });
      ctx.req.on('end', () => {
        resolve(JSON.parse(data || '{}'));
      });
    });
  }
  await next();
};

// endless 前缀处理中间件
export const endlessPrefix = async (ctx: BaseContext, next: Next) => {
  const newPath = ctx.path.replace('/endless', '');
  ctx.path = newPath || '/';
  await next();
}; 