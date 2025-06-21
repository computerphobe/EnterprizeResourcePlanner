import React from 'react';
import { Layout, Typography } from 'antd';

const { Content, Header } = Layout;
const { Title } = Typography;

const PageLayout = ({ title, extra, children }) => {
  return (
    <Layout>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ color: 'white', margin: 0 }}>{title}</Title>
        {extra}
      </Header>
      <Content style={{ padding: '24px' }}>
        {children}
      </Content>
    </Layout>
  );
};

export default PageLayout;