import React, { useState } from 'react'
import { Layout as ArcoLayout, Breadcrumb } from '@arco-design/web-react'
import {
  IconMenuFold,
  IconMenuUnfold
} from '@arco-design/web-react/icon'
import { useLocation } from 'react-router-dom'
import { routeConfig } from '../config/routes'
import SidebarMenu from '../components/SidebarMenu'

const { Header, Sider, Content } = ArcoLayout

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbItems = [{ title: '首页' }]

    pathSegments.forEach((_, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/')
      const route = routeConfig.find(item => item.path === path)
      if (route) {
        breadcrumbItems.push({ title: route.title })
      }
    })

    return breadcrumbItems
  }

  return (
    <ArcoLayout className="h-screen overflow-hidden">
      <Sider
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsible
        trigger={null}
        breakpoint="lg"
        className="bg-gray-900 shadow-lg"
        style={{
          background: '#1f2937',
          color: '#fff',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000
        }}
      >
        <SidebarMenu collapsed={collapsed} />
      </Sider>

      <ArcoLayout
        className="flex flex-col lg:ml-60 ml-0"
        style={{
          marginLeft: collapsed ? '80px' : '240px',
          height: '100vh',
          transition: 'margin-left 0.2s',
          width: `calc(100% - ${collapsed ? '80px' : '240px'})`
        }}
      >
        <Header className="flex items-center justify-between px-6 bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              {collapsed ? <IconMenuUnfold className="text-lg" /> : <IconMenuFold className="text-lg" />}
            </button>
            <Breadcrumb className="text-sm">
              {getBreadcrumbItems().map((item, index) => (
                <Breadcrumb.Item key={index} className="text-gray-600">
                  {item.title}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-gray-600 text-sm">
              欢迎使用后台管理系统
            </div>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">管</span>
            </div>
          </div>
        </Header>

        <Content className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm p-6 min-h-full">
              {children}
            </div>
          </div>
        </Content>
      </ArcoLayout>
    </ArcoLayout>
  )
}

export default Layout
