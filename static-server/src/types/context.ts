import { Context } from 'koa';
import { Types } from 'mongoose';

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
    locationId?: string;
    action?: string;
  };
}

// 种族相关的 Context 类型
export interface RaceContext extends ParamContext {}
export interface MaterialTypeContext extends ParamContext {}
export interface MaterialContext extends ParamContext {}
export interface CreatureContext extends ParamContext {}
export interface PotionContext extends ParamContext {}
export interface LocationContext extends ParamContext {}
export interface MapContext extends ParamContext {} 