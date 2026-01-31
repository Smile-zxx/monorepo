import React, { Suspense } from 'react';
// @ts-ignore
import { __federation_method_setRemote } from '__federation__';

const RemoteTable = React.lazy(async () => {
  // 模拟从业务逻辑中获取地址
  const remoteUrl = 'http://localhost:3001/remoteEntry.js';
  
  __federation_method_setRemote('remote_app', {
    url: () => Promise.resolve(remoteUrl),
    format: 'var',
    from: 'webpack'
  });

  // @ts-ignore
  return import('remote_app/RemoteTable');
});

const RemotePage = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>动态加载远程入口示例</h2>
      <p>入口地址已通过业务逻辑动态设置</p>
      <hr />
      <Suspense fallback={<div>正在初始化远程环境并加载组件...</div>}>
        <RemoteTable />
      </Suspense>
    </div>
  );
};

export default RemotePage;
