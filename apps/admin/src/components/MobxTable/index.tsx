import React, { useEffect, useMemo, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import { Table, Button, Spin } from '@arco-design/web-react';
import { observer } from 'mobx-react-lite';
import { MobxTableStore } from './store';
import { Toolbar } from './Toolbar';
import { IMobxTableProps, MobxTableRef, IMobxTablePollingConfig } from './types';

/**
 * usePolling Hook
 * 封装轮询逻辑，提供 startPoll 和 stopPoll 方法
 * 支持自动处理页面可见性（Visibility API）
 * 
 * @param store MobxTableStore 实例
 * @param polling 初始轮询配置
 */
const usePolling = (
  store: MobxTableStore<any>,
  polling?: number | IMobxTablePollingConfig
) => {
  const pollingTimerRef = useRef<number | undefined>();
  const pollingConfigRef = useRef<IMobxTablePollingConfig | null>(null);

  /** 停止当前的轮询定时器 */
  const stopPoll = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = undefined;
    }
  }, []);

  /**
   * 启动轮询
   * @param interval 可选的轮询间隔，若未提供则使用当前配置
   */
  const startPoll = useCallback((interval?: number) => {
    stopPoll(); // 先停止旧的

    const pollInterval = interval ?? pollingConfigRef.current?.interval;
    if (!pollInterval || pollInterval <= 0) {
      return;
    }

    const config: IMobxTablePollingConfig = {
      interval: pollInterval,
      enabled: true,
      pauseOnHidden: pollingConfigRef.current?.pauseOnHidden ?? true,
    };

    pollingConfigRef.current = config;

    const tick = () => {
      // 如果配置了 pauseOnHidden 且页面不可见，则跳过本次刷新
      if (config.pauseOnHidden && typeof document !== 'undefined' && document.hidden) {
        return;
      }
      store.refresh();
    };

    pollingTimerRef.current = window.setInterval(tick, config.interval);
  }, [store, stopPoll]);

  // 初始化轮询配置
  useEffect(() => {
    if (polling) {
      const config: IMobxTablePollingConfig =
        typeof polling === 'number'
          ? { interval: polling, enabled: true, pauseOnHidden: true }
          : {
            interval: polling.interval,
            enabled: polling.enabled ?? true,
            pauseOnHidden: polling.pauseOnHidden ?? true,
          };

      pollingConfigRef.current = config;

      if (config.enabled && config.interval > 0) {
        startPoll(config.interval);
      }
    }

    return () => stopPoll();
  }, [polling, startPoll, stopPoll]);

  return { startPoll, stopPoll };
};

/**
 * MobxTable 组件
 * 一个基于 MobX 和 Arco Design 的高阶表格组件。
 * 
 * 架构设计：
 * - Model 层 (store.ts): 负责状态管理、数据获取、分页逻辑。
 * - View 层 (index.tsx, Toolbar.tsx): 负责 UI 渲染。
 * - Logic 层 (usePolling, useEffects): 负责生命周期和胶水逻辑。
 */
const MobxTableInternal = <T extends object>(
  props: IMobxTableProps<T>,
  ref: React.Ref<MobxTableRef>
) => {
  const {
    columns,
    fetcher,
    rowKey = 'id',
    initialPagination,
    toolbar,
    polling,
    mode = 'remote',
    onBeforeInit,
    onBeforeFetch,
    onFetchSuccess,
    onFetchError,
  } = props;

  // 1. 初始化 Store (Model)
  // 使用 useMemo 确保 Store 实例在组件生命周期内唯一
  const store = useMemo(() => new MobxTableStore<T>(fetcher, initialPagination, mode), []);

  // 2. 注册生命周期回调
  // 当 props 中的回调变化时，同步更新到 Store 中
  useEffect(() => {
    store.setCallbacks({
      onBeforeFetch,
      onFetchSuccess,
      onFetchError,
    });
  }, [store, onBeforeFetch, onFetchSuccess, onFetchError]);

  // 3. 初始化轮询逻辑
  const { startPoll, stopPoll } = usePolling(store, polling);

  // 4. 暴露 Ref 方法
  useImperativeHandle(ref, () => ({
    store,
    refresh: () => store.refresh(),
    search: (params) => store.search(params),
    startPoll,
    stopPoll,
    loadMore: () => store.loadMore(),
  }), [store, startPoll, stopPoll]);

  // 5. 组件挂载初始化
  // 处理 onBeforeInit（支持异步）并触发首次 fetch
  useEffect(() => {
    const initAndFetch = async () => {
      if (onBeforeInit) {
        store.setLoading(true);
        try {
          const config = await onBeforeInit(store);
          if (config) {
            store.updateConfig(config);
          }
        } catch (error) {
          console.error('Failed to execute onBeforeInit:', error);
        }
      }
      store.fetchData();
    };

    initAndFetch();
  }, [store]);

  // 6. 渲染 View
  return (
    <div className="mobx-table-container">
      <Toolbar toolbar={toolbar} store={store} />

      <Table
        rowKey={rowKey}
        // loadmore 模式下我们自己控制 loading 状态（通常是在底部显示 spinner），
        // 而不是让 Table 组件显示全屏 loading
        loading={mode === 'loadmore' ? false : store.loading}
        data={store.data}
        columns={columns}
        // loadmore 模式下不显示标准分页器
        pagination={mode === 'loadmore' ? false : store.pagination}
        onChange={store.handleTableChange}
      />

      {/* LoadMore 模式下的底部区域 */}
      {mode === 'loadmore' && (
        <div className="text-center py-4">
          {store.loading ? (
            <Spin />
          ) : store.hasMore ? (
            <Button onClick={() => store.loadMore()}>加载更多</Button>
          ) : (
            <span className="text-gray-400">没有更多数据了</span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 导出的 MobxTable 组件
 * 使用 observer 包装以响应 Store 变化
 * 使用 forwardRef 转发 Ref
 */
export const MobxTable = observer(forwardRef(MobxTableInternal)) as <T extends object>(
  props: IMobxTableProps<T> & { ref?: React.Ref<MobxTableRef> }
) => React.ReactElement;
