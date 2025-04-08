import Koa from 'koa';
import { connectDB } from './db';
import router from './routes';

const app = new Koa();
const PORT = process.env.PORT || 3000;

// 连接数据库
connectDB();

// 注册路由
app.use(router.routes());
app.use(router.allowedMethods());

// 错误处理
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 