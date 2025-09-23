import React from 'react'
import { Menu } from '@arco-design/web-react'
import {
  IconDashboard,
  IconUser,
  IconSettings
} from '@arco-design/web-react/icon'
import { useNavigate, useLocation } from 'react-router-dom'
import { getMenuConfig } from '../config/routes'

interface SidebarMenuProps {
  collapsed: boolean
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ collapsed }) => {
  const navigate = useNavigate()
  const location = useLocation()

  // 图标映射
  const iconMap = {
    IconDashboard: <IconDashboard className="text-lg" />,
    IconUser: <IconUser className="text-lg" />,
    IconSettings: <IconSettings className="text-lg" />,
  }

  // 从路由配置生成菜单项
  const menuItems = getMenuConfig().map(route => ({
    key: route.path,
    icon: iconMap[route.icon as keyof typeof iconMap],
    title: route.title,
  }))

  const handleMenuClick = (key: string) => {
    navigate(key)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Logo区域 */}
      <div className="flex items-center justify-center h-16 border-b border-gray-700 flex-shrink-0">
        <div className="text-white text-xl font-bold transition-all duration-300">
          {collapsed ? (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-sm">管</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-sm">管</span>
              </div>
              <span>后台管理系统</span>
            </div>
          )}
        </div>
      </div>

      {/* 菜单区域 */}
      <div className="flex-1 overflow-y-auto py-4">
        <Menu
          defaultSelectedKeys={[location.pathname]}
          selectedKeys={[location.pathname]}
          className="bg-transparent border-none"
          style={{ 
            background: 'transparent',
            color: '#fff',
            height: '100%'
          }}
          onClickMenuItem={handleMenuClick}
        >
          {menuItems.map(item => (
            <Menu.Item 
              key={item.key}
              className="mx-2 my-1 rounded-lg transition-all duration-200 hover:bg-blue-600/20"
              style={{
                background: location.pathname === item.key ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: '#fff',
                border: 'none',
                margin: '4px 8px'
              }}
            >
              <div className="flex items-center space-x-3 px-3 py-3">
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    {item.title}
                  </span>
                )}
              </div>
            </Menu.Item>
          ))}
        </Menu>
      </div>

      {/* 底部信息 */}
      <div className="flex-shrink-0">
        {!collapsed && (
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-400 text-center">
              <div className="mb-1">版本 v1.0.0</div>
              <div>© 2024 管理系统</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="p-2 border-t border-gray-700">
            <div className="text-xs text-gray-400 text-center">
              v1.0.0
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SidebarMenu
