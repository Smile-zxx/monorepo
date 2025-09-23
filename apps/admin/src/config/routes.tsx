import React from 'react'
import { RouteObject } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Users from '../pages/Users'
import Settings from '../pages/Settings'

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
  }
]

// 组件映射
const componentMap = {
  Dashboard,
  Users,
  Settings
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
