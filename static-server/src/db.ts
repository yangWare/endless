import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 从环境变量构建 MongoDB 连接字符串
const MONGODB_URI = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DATABASE}?authSource=${process.env.MONGODB_AUTH_SOURCE}`;

const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,    // 增加超时时间到10秒
  heartbeatFrequencyMS: 2000,
  retryWrites: true,
  retryReads: true,
  connectTimeoutMS: 10000,            // 连接超时时间
  socketTimeoutMS: 45000,             // Socket超时时间
};

export const connectDB = async () => {
  try {
    console.log('MongoDB 连接中...', {
      uri: MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@'),  // 隐藏敏感信息
      options: mongooseOptions
    });
    
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('MongoDB 连接成功');
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        codeName: (error as any).codeName,
      });
    }
    process.exit(1);
  }
};

// 监听连接错误
mongoose.connection.on('error', (err) => {
  console.error('MongoDB 连接错误:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    code: (err as any).code,
    codeName: (err as any).codeName,
  });
});

// 监听连接断开
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB 连接断开');
});

// 监听连接成功
mongoose.connection.on('connected', () => {
  console.log('MongoDB 连接成功');
});

// 监听重连尝试
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB 重新连接成功');
});

// 监听重连尝试开始
mongoose.connection.on('reconnectFailed', () => {
  console.log('MongoDB 重连失败');
}); 