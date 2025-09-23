import React from 'react'
import { Card, Grid, Statistic, Progress } from '@arco-design/web-react'
import { IconUser, IconMessage, IconHeart } from '@arco-design/web-react/icon'
const { Row, Col } = Grid
const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={1234}
              prefix={<IconUser />}
              style={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="订单数量"
              value={567}
              style={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="消息数量"
              value={89}
              prefix={<IconMessage />}
              style={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="收藏数量"
              value={234}
              prefix={<IconHeart />}
              style={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 进度卡片 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="系统使用率" className="h-64">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>CPU 使用率</span>
                  <span>68%</span>
                </div>
                <Progress percent={68} status="normal" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>内存使用率</span>
                  <span>45%</span>
                </div>
                <Progress percent={45} status="normal" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>磁盘使用率</span>
                  <span>32%</span>
                </div>
                <Progress percent={32} status="normal" />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近活动" className="h-64">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">用户张三登录系统</span>
                <span className="text-xs text-gray-500">2分钟前</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">新增订单 #12345</span>
                <span className="text-xs text-gray-500">5分钟前</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">系统备份完成</span>
                <span className="text-xs text-gray-500">10分钟前</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">用户李四退出系统</span>
                <span className="text-xs text-gray-500">15分钟前</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
