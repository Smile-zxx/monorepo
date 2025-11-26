import React from 'react';
import { observer } from 'mobx-react-lite';
import { IToolbarItem, IMobxTableStore } from './types';

interface ToolbarProps {
  toolbar?: React.ReactNode | IToolbarItem[];
  store: IMobxTableStore;
}

/**
 * Toolbar 组件
 * 负责渲染表格上方的工具栏区域
 * 支持自定义 ReactNode 或配置化的筛选表单
 */
export const Toolbar = observer(({ toolbar, store }: ToolbarProps) => {
  if (!toolbar) return null;

  // 如果配置是数组，则自动渲染筛选表单
  if (Array.isArray(toolbar)) {
    return (
      <div className="flex items-center flex-wrap gap-4 mb-4 p-4 bg-white rounded border border-gray-100">
        {(toolbar as IToolbarItem[]).map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="text-gray-600 whitespace-nowrap">{item.label}</span>
            {/* 渲染配置的组件，并注入 value, onChange 和 store 实例 */}
            {item.component({
              value: store.filterValues[item.name],
              onChange: (value) => store.setFilterValue(item.name, value),
              table: store,
            })}
          </div>
        ))}
      </div>
    );
  }

  // 否则直接渲染 ReactNode
  return <div className="mb-4">{toolbar as React.ReactNode}</div>;
});
