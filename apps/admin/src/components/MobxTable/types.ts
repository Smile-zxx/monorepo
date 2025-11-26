import { ColumnProps } from '@arco-design/web-react/es/Table';
import { PaginationProps } from '@arco-design/web-react/es/Pagination';
import React from 'react';

/**
 * 表格数据加载模式
 * - remote: 远程分页模式（默认），每次分页、筛选、排序都请求后端接口
 * - local: 本地分页模式，一次性获取所有数据，前端进行分页、筛选、排序
 * - loadmore: 加载更多模式，适用于移动端或无限滚动场景，数据追加而非替换
 */
export type MobxTableMode = 'remote' | 'local' | 'loadmore';

/**
 * MobxTable Store 的接口定义
 * 暴露给 Toolbar 组件或 Ref 使用的方法和属性
 */
export interface IMobxTableStore<T = any> {
    /** 当前展示的数据列表 */
    data: T[];
    /** 表格加载状态 */
    loading: boolean;
    /** 分页配置信息 */
    pagination: PaginationProps;
    /** 当前的筛选条件 */
    filters: any;
    /** 当前的排序状态 */
    sorter: any;
    /** Toolbar 表单的筛选值 */
    filterValues: any;
    /** 当前的数据加载模式 */
    mode: MobxTableMode;
    /** 是否还有更多数据（仅用于 loadmore 模式） */
    hasMore: boolean;
    
    /** 设置加载状态 */
    setLoading: (loading: boolean) => void;
    /** 手动设置表格数据 */
    setData: (data: T[]) => void;
    /** 更新分页配置 */
    setPagination: (pagination: Partial<PaginationProps>) => void;
    /** 设置 Toolbar 筛选值并触发查询 */
    setFilterValue: (name: string, value: any) => void;
    /** 核心数据获取方法 */
    fetchData: (params?: Partial<IFetcherParams>) => Promise<void>;
    /** 处理表格的标准变更事件（分页、排序、筛选） */
    handleTableChange: (pagination: PaginationProps, sorter: any, filters: any) => void;
    /** 执行搜索（通常会重置页码） */
    search: (params: Partial<IFetcherParams>) => void;
    /** 刷新当前数据 */
    refresh: () => void;
    /** 批量更新 Store 配置 */
    updateConfig: (config: Partial<IMobxTableStore<T>>) => void;
    
    /** 加载下一页数据（仅 loadmore 模式有效） */
    loadMore: () => void;
}

/**
 * 轮询配置接口
 */
export interface IMobxTablePollingConfig {
  /** 轮询间隔（毫秒） */
  interval: number;
  /** 是否开启轮询，默认 true */
  enabled?: boolean;
  /** 当页面不可见（document.hidden）时是否暂停轮询，默认 true */
  pauseOnHidden?: boolean;
}

/**
 * Toolbar 配置项接口
 * 用于快速生成筛选表单
 */
export interface IToolbarItem {
  /** 字段名，对应筛选条件中的 key */
  name: string;
  /** 
   * 筛选组件渲染函数
   * @param props.value 当前字段的值
   * @param props.onChange 值变更回调
   * @param props.table Store 实例，可用于调用 refresh 等方法
   */
  component: (props: { value: any; onChange: (value: any) => void; table: IMobxTableStore }) => React.ReactNode;
  /** 显示标签 */
  label: string;
}

/**
 * MobxTable 组件的 Props 定义
 * @template T 表格行数据的类型
 */
export interface IMobxTableProps<T = any> {
  /**
   * 数据加载模式，默认为 'remote'
   */
  mode?: MobxTableMode;

  /**
   * 表格列定义，继承自 Arco Design Table 的 ColumnProps
   */
  columns: ColumnProps<T>[];
  
  /**
   * 数据获取函数，核心属性
   * @param params 获取数据的参数（分页、排序、筛选等）
   * @returns 返回包含列表数据和总数的 Promise 或直接对象
   */
  fetcher: (params: IFetcherParams) => Promise<IFetcherResult<T>> | IFetcherResult<T>;
  
  /**
   * 行数据的唯一标识字段，默认为 'id'
   */
  rowKey?: string;
  
  /**
   * 初始分页配置
   */
  initialPagination?: Partial<PaginationProps>;
  
  /**
   * 表格数据轮询配置
   * - 传入 number 时表示轮询间隔（毫秒）
   * - 传入对象时可进行更细粒度配置
   */
  polling?: number | IMobxTablePollingConfig;
  
  /**
   * 表格上方的工具栏区域
   * - 可以是 ReactNode 自定义渲染
   * - 也可以是 IToolbarItem 数组，用于自动生成筛选表单
   */
  toolbar?: React.ReactNode | IToolbarItem[];

  /**
   * 初始化前的钩子（支持异步）
   * 在 Store 创建后，首次请求前调用
   * 在执行期间 Table 会处于 loading 状态
   * @param table Store 实例
   * @returns 可选返回修改后的 table config，将自动应用到 store
   */
  onBeforeInit?: (table: IMobxTableStore<T>) => Promise<Partial<IMobxTableStore<T>> | void> | Partial<IMobxTableStore<T>> | void;

  /**
   * 数据获取前的钩子
   * @param params 本次请求的参数
   */
  onBeforeFetch?: (params: IFetcherParams) => void;

  /**
   * 数据获取成功的钩子
   * @param data 获取到的数据
   */
  onFetchSuccess?: (data: IFetcherResult<T>) => void;

  /**
   * 数据获取失败的钩子
   * @param error 错误信息
   */
  onFetchError?: (error: any) => void;
}

/**
 * 数据获取函数的参数接口
 * 传递给 fetcher 的参数
 */
export interface IFetcherParams {
  /** 当前页码 */
  current: number;
  /** 每页显示条数 */
  pageSize: number;
  /** 排序信息 */
  sorter?: any;
  /** 列筛选信息 */
  filters?: any;
  /** Toolbar 筛选信息 */
  filterValues?: any;
  /** 其他自定义查询参数 */
  [key: string]: any;
}

/**
 * 数据获取函数的返回结果接口
 * @template T 数据项类型
 */
export interface IFetcherResult<T> {
  /** 数据列表 */
  list: T[];
  /** 数据总条数 */
  total: number;
}

/**
 * MobxTable 组件暴露给父组件的方法（Ref）
 */
export interface MobxTableRef {
  /**
   * 刷新表格数据（保持当前页码和查询条件）
   */
  refresh: () => void;
  
  /**
   * 执行搜索
   * @param params 搜索参数
   * 注意：搜索通常会重置页码到第一页
   */
  search: (params: Partial<IFetcherParams>) => void;

  /**
   * 开始轮询
   * @param interval 轮询间隔（毫秒），如果不传则使用初始化时的 polling 配置
   */
  startPoll: (interval?: number) => void;

  /**
   * 停止轮询
   */
  stopPoll: () => void;

  /**
   * 加载更多（仅 loadmore 模式有效）
   */
  loadMore: () => void;
}
