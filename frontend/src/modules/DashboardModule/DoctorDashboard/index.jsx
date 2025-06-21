import React from 'react';
import { Row, Col, Card } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const DoctorDashboard = () => {
  return (
    <div className="doctor-dashboard">
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card>
            <h1 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h1>
            <p>This is your personalized dashboard where you can view your information and activities.</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DoctorDashboard; 