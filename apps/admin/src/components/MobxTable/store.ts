import { makeAutoObservable, runInAction } from 'mobx';
import { PaginationProps } from '@arco-design/web-react/es/Pagination';
import { IFetcherParams, IFetcherResult, IMobxTableStore, MobxTableMode } from './types';

/**
 * MobxTable 的状态管理 Store
 * 实现了核心的业务逻辑：数据获取、状态管理、分页计算、竞态处理等。
 * 
 * @template T 表格行数据的类型
 */
export class MobxTableStore<T = any> implements IMobxTableStore<T> {
    // ==================== 状态属性 ====================

    /** 表格数据列表（当前展示的数据） */
    data: T[] = [];
    
    /** 本地模式下的全量数据缓存 */
    localData: T[] = [];

    /** 表格加载状态 */
    loading: boolean = false;
    
    /** 数据加载模式 */
    mode: MobxTableMode = 'remote';

    /** 是否还有更多数据（用于 loadmore 模式） */
    hasMore: boolean = true;

    /** 分页配置 */
    pagination: PaginationProps = {
        current: 1,
        pageSize: 10,
        total: 0,
        showTotal: (total) => `共 ${total} 条`,
        showJumper: true,
        sizeCanChange: true,
    };
    
    /** 当前列筛选条件 (Table column filters) */
    filters: any = {};
    
    /** 当前排序条件 */
    sorter: any = {};

    /** Toolbar 筛选条件 (Toolbar filter values) */
    filterValues: any = {};

    // ==================== 私有属性 ====================

    /** 数据获取函数引用 */
    private fetcher: (params: IFetcherParams) => Promise<IFetcherResult<T>> | IFetcherResult<T>;

    // 生命周期回调引用
    private onBeforeFetch?: (params: IFetcherParams) => void;
    private onFetchSuccess?: (data: IFetcherResult<T>) => void;
    private onFetchError?: (error: any) => void;

    /** 请求序列号，用于处理竞态问题 */
    private requestId: number = 0;

    /**
     * 构造函数
     * @param fetcher 数据获取函数
     * @param initialPagination 初始分页配置
     * @param mode 数据加载模式
     */
    constructor(
        fetcher: (params: IFetcherParams) => Promise<IFetcherResult<T>> | IFetcherResult<T>,
        initialPagination?: Partial<PaginationProps>,
        mode: MobxTableMode = 'remote'
    ) {
        this.fetcher = fetcher;
        this.mode = mode;
        if (initialPagination) {
            this.pagination = { ...this.pagination, ...initialPagination };
        }
        // 使用 makeAutoObservable 自动转换属性和方法
        makeAutoObservable(this);
    }

    // ==================== Actions (状态更新方法) ====================

    /**
     * 注册生命周期回调
     */
    setCallbacks(callbacks: {
        onBeforeFetch?: (params: IFetcherParams) => void;
        onFetchSuccess?: (data: IFetcherResult<T>) => void;
        onFetchError?: (error: any) => void;
    }) {
        this.onBeforeFetch = callbacks.onBeforeFetch;
        this.onFetchSuccess = callbacks.onFetchSuccess;
        this.onFetchError = callbacks.onFetchError;
    }

    setLoading(loading: boolean) {
        this.loading = loading;
    }

    setData(data: T[]) {
        this.data = data;
    }

    setPagination(pagination: Partial<PaginationProps>) {
        this.pagination = { ...this.pagination, ...pagination };
    }

    /**
     * 设置 Toolbar 筛选值并触发查询
     * @param name 字段名
     * @param value 值
     */
    setFilterValue(name: string, value: any) {
        this.filterValues[name] = value;
        this.fetchData({
            current: 1, // 修改筛选条件后通常重置到第一页
        });
    }

    /**
     * 批量更新 Store 配置
     * 主要用于 onBeforeInit 钩子中批量应用初始配置
     */
    updateConfig(config: Partial<IMobxTableStore<T>>) {
        runInAction(() => {
            if (config.pagination) {
                this.pagination = { ...this.pagination, ...config.pagination };
            }
            if (config.filterValues) {
                this.filterValues = { ...this.filterValues, ...config.filterValues };
            }
            if (config.filters) {
                this.filters = { ...this.filters, ...config.filters };
            }
            if (config.sorter) {
                this.sorter = config.sorter;
            }
            if (config.mode) {
                this.mode = config.mode;
            }
        });
    }

    // ==================== 核心业务逻辑 ====================

    /**
     * 处理本地数据逻辑 (Local Mode)
     * 基于 localData 进行内存中的排序和分页
     */
    private processLocalData() {
        let result = [...this.localData];

        // 1. 筛选 (TODO: 目前仅支持简单的精确匹配或自定义 filter 函数，此处为示例)
        // 实际项目中，本地模式的筛选通常由外部处理好 localData，或者在此处实现更复杂的逻辑

        // 2. 排序
        if (this.sorter && this.sorter.field && this.sorter.direction) {
            const { field, direction } = this.sorter;
            result.sort((a: any, b: any) => {
                const aVal = a[field];
                const bVal = b[field];
                if (aVal === bVal) return 0;
                const compare = aVal > bVal ? 1 : -1;
                return direction === 'ascend' ? compare : -compare;
            });
        }

        // 3. 分页
        const total = result.length;
        const current = this.pagination.current || 1;
        const pageSize = this.pagination.pageSize || 10;
        const start = (current - 1) * pageSize;
        const end = start + pageSize;
        const pageData = result.slice(start, end);

        // 更新视图数据
        runInAction(() => {
            this.data = pageData;
            this.pagination = {
                ...this.pagination,
                total,
            };
            this.loading = false;
        });
    }

    /**
     * 核心数据获取方法
     * 包含竞态处理、模式分流、生命周期触发等逻辑
     * 
     * @param params 额外的查询参数（可选）
     * @param forceReloadLocal 是否强制重新加载本地数据（用于 local 模式的刷新）
     */
    async fetchData(params?: Partial<IFetcherParams>, forceReloadLocal: boolean = false) {
        // 1. 组装请求参数
        const currentParams: IFetcherParams = {
            current: this.pagination.current || 1,
            pageSize: this.pagination.pageSize || 10,
            filters: this.filters,
            sorter: this.sorter,
            filterValues: this.filterValues,
            ...params,
        };

        // 2. Local 模式特殊处理
        // 如果已有本地数据且不是强制刷新，则直接在前端处理，不发起请求
        if (this.mode === 'local' && this.localData.length > 0 && !forceReloadLocal) {
            // 更新 Store 中的分页参数
            if (params?.current) {
                runInAction(() => {
                    this.pagination.current = params.current;
                    if (params.pageSize) this.pagination.pageSize = params.pageSize;
                });
            }
            this.processLocalData();
            return;
        }

        // 3. 竞态处理：生成请求 ID
        const currentRequestId = ++this.requestId;

        // 4. 触发 before 钩子
        this.onBeforeFetch?.(currentParams);

        // 5. 设置 Loading
        // 只有当这是最新的请求时才设置 loading，避免旧请求覆盖新请求的状态
        if (currentRequestId === this.requestId) {
            this.setLoading(true);
        }

        try {
            // 6. 调用 fetcher 获取数据
            const result = await this.fetcher(currentParams);

            // 7. 竞态检查：如果请求 ID 不匹配，说明有新请求已发出，当前结果作废
            if (currentRequestId !== this.requestId) return;

            // 8. 更新状态
            runInAction(() => {
                if (this.mode === 'local') {
                    // Local 模式：保存全量数据，然后前端分页
                    this.localData = result.list;
                    this.processLocalData();
                } else if (this.mode === 'loadmore') {
                    // LoadMore 模式：追加数据
                    if (currentParams.current === 1) {
                        this.data = result.list; // 第一页直接替换
                    } else {
                        this.data = [...this.data, ...result.list]; // 后续页追加
                    }
                    this.pagination = {
                        ...this.pagination,
                        current: currentParams.current,
                        pageSize: currentParams.pageSize,
                        total: result.total,
                    };
                    // 判断是否还有更多数据
                    this.hasMore = this.data.length < result.total;
                    this.loading = false;
                } else {
                    // Remote 模式（默认）：直接替换数据
                    this.data = result.list;
                    this.pagination = {
                        ...this.pagination,
                        current: currentParams.current,
                        pageSize: currentParams.pageSize,
                        total: result.total,
                    };
                    this.loading = false;
                }
            });

            // 9. 触发 success 钩子
            this.onFetchSuccess?.(result);
        } catch (error) {
            // 竞态检查
            if (currentRequestId !== this.requestId) return;

            console.error('Failed to fetch table data:', error);
            runInAction(() => {
                this.loading = false;
            });
            
            // 10. 触发 error 钩子
            this.onFetchError?.(error);
        }
    }

    /**
     * 处理表格的标准变更事件（分页、排序、筛选）
     * 通常由 Table 组件直接触发
     */
    handleTableChange = (pagination: PaginationProps, sorter: any, filters: any) => {
        runInAction(() => {
            this.pagination = { ...this.pagination, ...pagination };
            this.sorter = sorter;
            this.filters = filters;
        });

        // 触发数据更新
        // Local 模式下 fetchData 内部会判断是否走本地逻辑
        this.fetchData({
            current: pagination.current,
            pageSize: pagination.pageSize,
            sorter,
            filters,
        });
    };

    /**
     * 执行搜索
     * 通常会重置页码到第一页
     */
    search = (params: Partial<IFetcherParams>) => {
        // 对于 Local 模式，这里设置 forceReloadLocal=true 是为了保险起见
        // 假设搜索条件变化需要重新从后端获取全量数据（如果全量数据包含所有可能结果，可改为 false）
        this.fetchData({
            ...params,
            current: 1, 
        }, true);
    };

    /**
     * 刷新当前表格数据
     * 保持当前的查询条件和页码
     */
    refresh = () => {
        this.fetchData({}, true); // 强制刷新
    };

    /**
     * 加载更多（仅 LoadMore 模式）
     */
    loadMore = () => {
        if (this.mode !== 'loadmore' || this.loading || !this.hasMore) return;
        
        const nextPage = (this.pagination.current || 1) + 1;
        this.fetchData({
            current: nextPage
        });
    }
}
