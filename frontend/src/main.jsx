import { createRoot } from 'react-dom/client';
import RootApp from './RootApp';
import { App as AntdApp } from 'antd';

const root = createRoot(document.getElementById('root'));

root.render(
  <AntdApp>
    <RootApp />
  </AntdApp>
);
