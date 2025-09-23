import React, { useState } from 'react'
import { Card, Form, Input, Switch, Button, Divider, Message, Select } from '@arco-design/web-react'

const Settings: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    form.validate().then((values) => {
      setLoading(true)
      // 模拟保存设置
      setTimeout(() => {
        setLoading(false)
        Message.success('设置保存成功')
      }, 1000)
    })
  }

  const handleReset = () => {
    form.resetFields()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">系统设置</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 基本设置 */}
        <Card title="基本设置" className="h-fit">
          <Form form={form} layout="vertical">
            <Form.Item
              label="系统名称"
              field="systemName"
              initialValue="后台管理系统"
            >
              <Input placeholder="请输入系统名称" />
            </Form.Item>
            
            <Form.Item
              label="系统描述"
              field="systemDescription"
              initialValue="基于 React + Arco Design 的后台管理系统"
            >
              <Input.TextArea 
                placeholder="请输入系统描述"
                rows={3}
              />
            </Form.Item>
            
            <Form.Item
              label="系统版本"
              field="systemVersion"
              initialValue="1.0.0"
            >
              <Input placeholder="请输入系统版本" />
            </Form.Item>
            
            <Form.Item
              label="管理员邮箱"
              field="adminEmail"
              initialValue="admin@example.com"
            >
              <Input placeholder="请输入管理员邮箱" />
            </Form.Item>
          </Form>
        </Card>

        {/* 功能设置 */}
        <Card title="功能设置" className="h-fit">
          <Form form={form} layout="vertical">
            <Form.Item
              label="启用用户注册"
              field="enableRegister"
              initialValue={true}
              triggerPropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="启用邮箱验证"
              field="enableEmailVerify"
              initialValue={false}
              triggerPropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="启用两步验证"
              field="enable2FA"
              initialValue={false}
              triggerPropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="自动备份"
              field="autoBackup"
              initialValue={true}
              triggerPropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="备份频率"
              field="backupFrequency"
              initialValue="daily"
            >
              <Select placeholder="请选择备份频率">
                <Select.Option value="daily">每日</Select.Option>
                <Select.Option value="weekly">每周</Select.Option>
                <Select.Option value="monthly">每月</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Card>

        {/* 安全设置 */}
        <Card title="安全设置" className="h-fit">
          <Form form={form} layout="vertical">
            <Form.Item
              label="密码最小长度"
              field="passwordMinLength"
              initialValue={8}
            >
              <Input type="number" placeholder="请输入密码最小长度" />
            </Form.Item>
            
            <Form.Item
              label="登录失败锁定次数"
              field="loginLockCount"
              initialValue={5}
            >
              <Input type="number" placeholder="请输入锁定次数" />
            </Form.Item>
            
            <Form.Item
              label="会话超时时间（分钟）"
              field="sessionTimeout"
              initialValue={30}
            >
              <Input type="number" placeholder="请输入超时时间" />
            </Form.Item>
            
            <Form.Item
              label="启用 IP 白名单"
              field="enableIPWhitelist"
              initialValue={false}
              triggerPropName="checked"
            >
              <Switch />
            </Form.Item>
          </Form>
        </Card>

        {/* 通知设置 */}
        <Card title="通知设置" className="h-fit">
          <Form form={form} layout="vertical">
            <Form.Item
              label="启用邮件通知"
              field="enableEmailNotify"
              initialValue={true}
              triggerPropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="启用短信通知"
              field="enableSMSNotify"
              initialValue={false}
              triggerPropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="启用桌面通知"
              field="enableDesktopNotify"
              initialValue={true}
              triggerPropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="通知时间"
              field="notifyTime"
              initialValue="09:00"
            >
              <Input placeholder="请输入通知时间" />
            </Form.Item>
          </Form>
        </Card>
      </div>

      <Divider />

      <div className="flex justify-end space-x-4">
        <Button onClick={handleReset}>
          重置
        </Button>
        <Button 
          type="primary" 
          loading={loading}
          onClick={handleSubmit}
        >
          保存设置
        </Button>
      </div>
    </div>
  )
}

export default Settings
