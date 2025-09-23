import React, { useState } from 'react'
import { Table, Button, Input, Tag, Space, Modal, Form, Message } from '@arco-design/web-react'
import { IconPlus, IconEdit, IconDelete, IconSearch } from '@arco-design/web-react/icon'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  createTime: string
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: '张三',
      email: 'zhangsan@example.com',
      role: '管理员',
      status: 'active',
      createTime: '2024-01-15 10:30:00'
    },
    {
      id: 2,
      name: '李四',
      email: 'lisi@example.com',
      role: '普通用户',
      status: 'active',
      createTime: '2024-01-16 14:20:00'
    },
    {
      id: 3,
      name: '王五',
      email: 'wangwu@example.com',
      role: '普通用户',
      status: 'inactive',
      createTime: '2024-01-17 09:15:00'
    }
  ])

  const [visible, setVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === '管理员' ? 'red' : 'blue'}>
          {role}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'gray'}>
          {status === 'active' ? '活跃' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: User) => (
        <Space>
          <Button
            type="text"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            status="danger"
            icon={<IconDelete />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const handleAdd = () => {
    setEditingUser(null)
    form.resetFields()
    setVisible(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    form.setFieldsValue(user)
    setVisible(true)
  }

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个用户吗？',
      onOk: () => {
        setUsers(users.filter(user => user.id !== id))
        Message.success('删除成功')
      },
    })
  }

  const handleSubmit = () => {
    form.validate().then((values) => {
      if (editingUser) {
        // 编辑用户
        setUsers(users.map(user => 
          user.id === editingUser.id ? { ...user, ...values } : user
        ))
        Message.success('更新成功')
      } else {
        // 新增用户
        const newUser: User = {
          ...values,
          id: Math.max(...users.map(u => u.id)) + 1,
          createTime: new Date().toLocaleString()
        }
        setUsers([...users, newUser])
        Message.success('添加成功')
      }
      setVisible(false)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
        <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
          新增用户
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <Input.Search
          placeholder="搜索用户..."
          style={{ width: 300 }}
          prefix={<IconSearch />}
        />
      </div>

      <Table
        columns={columns}
        data={users}
        rowKey="id"
        pagination={{
          total: users.length,
          pageSize: 10,
          showTotal: true,
        }}
      />

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        visible={visible}
        onOk={handleSubmit}
        onCancel={() => setVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="姓名"
            field="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            label="邮箱"
            field="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱格式' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            label="角色"
            field="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Input placeholder="请输入角色" />
          </Form.Item>
          <Form.Item
            label="状态"
            field="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Input placeholder="请输入状态" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users
