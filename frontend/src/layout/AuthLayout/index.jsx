import React from 'react';
import { Layout, Row, Col } from 'antd';

import { useSelector } from 'react-redux';
import { Content } from 'antd/lib/layout/layout';
import loginImage from '@/style/images/login.svg';

export default function AuthLayout({ sideContent, children }) {
  return (
    <Layout style={{ 
      minHeight: '100vh',
      background: `url(${loginImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    }}>
      <Row style={{ minHeight: '100vh' }}>
        <Col
          xs={{ span: 0, order: 2 }}
          sm={{ span: 0, order: 2 }}
          md={{ span: 11, order: 1 }}
          lg={{ span: 12, order: 1 }}
          style={{
            minHeight: '100vh',
          }}
        >
          {sideContent}
        </Col>
        <Col
          xs={{ span: 24, order: 1 }}
          sm={{ span: 24, order: 1 }}
          md={{ span: 13, order: 2 }}
          lg={{ span: 12, order: 2 }}
          style={{ 
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {children}
        </Col>
      </Row>
    </Layout>
  );
}
