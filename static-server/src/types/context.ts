import { Context } from 'koa';

// 基础 Context 类型，包含所有共享的属性
export interface BaseContext extends Context {
  request: Context['request'] & {
    body?: any;
  };
}

// 带有参数的路由 Context 类型
export interface ParamContext extends BaseContext {
  params: {
    id?: string;
  };
}

// 种族相关的 Context 类型
export interface RaceContext extends ParamContext {
  request: ParamContext['request'];
} 