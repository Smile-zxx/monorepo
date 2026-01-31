import React from 'react'
import { RouteObject } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Users from '../pages/Users'
import Settings from '../pages/Settings'
import ErrorBoundary from '../pages/ErrorBoundary'
import Notes from '../pages/Notes'
import RemotePage from '../pages/RemotePage'

// 路由配置
export const routeConfig = [
  {
    "path": "/",
    "element": "Dashboard",
    "title": "仪表盘",
    "icon": "IconDashboard",
    "showInMenu": true
  },
  {
    "path": "/dashboard",
    "element": "Dashboard",
    "title": "仪表盘",
    "icon": "IconDashboard",
    "showInMenu": false
  },
  {
    "path": "/users",
    "element": "Users",
    "title": "用户管理",
    "icon": "IconUser",
    "showInMenu": true
  },
  {
    "path": "/settings",
    "element": "Settings",
    "title": "系统设置",
    "icon": "IconSettings",
    "showInMenu": true
  }, {
    "path": "/ErrorBoundary",
    "element": "ErrorBoundary",
    "title": "ErrorBoundary",
    "showInMenu": true
  },
  {
    "path": "/notes",
    "element": "Notes",
    "title": "Notes",
    "showInMenu": true
  },
  {
    "path": "/remote",
    "element": "RemotePage",
    "title": "远程组件",
    "showInMenu": true
  }
]

// 组件映射
const componentMap = {
  Dashboard,
  Users,
  Settings,
  ErrorBoundary,
  Notes,
  RemotePage
}

// 生成路由对象
export const routes: RouteObject[] = routeConfig.map(config => ({
  path: config.path,
  element: React.createElement(componentMap[config.element as keyof typeof componentMap])
}))

// 获取菜单配置
export const getMenuConfig = () => {
  return routeConfig.filter(route => route.showInMenu)
}
