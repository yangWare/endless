import Koa from 'koa';
import serve from 'koa-static';
import path from 'path';
import { connectDB } from './db';
import { Test } from './models/Test';

// 扩展Koa的Context类型
interface KoaContext extends Koa.Context {
  request: Koa.Request & {
    body?: any;
  };
}

const app = new Koa();
const PORT = process.env.PORT || 3000;

// 连接数据库
connectDB();

// 解析请求体
app.use(async (ctx: KoaContext, next) => {
  if (ctx.request.method === 'POST') {
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

// 写入数据接口
app.use(async (ctx: KoaContext, next) => {
  if (ctx.path === '/api/write' && ctx.method === 'GET') {
    try {
      const test = new Test({ 
        name: '默认测试数据', 
        value: `这是第${Date.now()}条测试数据` 
      });
      await test.save();
      ctx.body = { success: true, data: test };
    } catch (error: any) {
      ctx.status = 500;
      ctx.body = { success: false, error: error?.message || '未知错误' };
    }
    return;
  }
  await next();
});

// 读取数据接口
app.use(async (ctx: KoaContext, next) => {
  if (ctx.path === '/api/read' && ctx.method === 'GET') {
    try {
      const tests = await Test.find().sort({ createdAt: -1 });
      ctx.body = { success: true, data: tests };
    } catch (error: any) {
      ctx.status = 500;
      ctx.body = { success: false, error: error?.message || '未知错误' };
    }
    return;
  }
  await next();
});

// 配置静态文件服务
app.use(async (ctx: KoaContext, next) => {
  // 检查请求路径是否以 /endless 开头
  if (ctx.path.startsWith('/endless')) {
    // 移除 /endless 前缀
    const newPath = ctx.path.replace('/endless', '');
    
    // 如果是根路径，则默认返回 index.html
    if (newPath === '' || newPath === '/') {
      ctx.path = '/index.html';
    } else {
      ctx.path = newPath;
    }
    
    await serve(path.join(__dirname, '../static'))(ctx, next);
  } else {
    ctx.status = 404;
    ctx.body = { success: false, error: '路径不正确' };
  }
});

// 错误处理
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 