import { useState, useEffect } from 'react';
import { Row, Col, Card, Breadcrumb, Spin } from 'antd';
import { HomeOutlined, PieChartOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import ExpensesChart from '@/modules/AccountantModule/components/ExpensesChart';
import useLanguage from '@/locale/useLanguage';
import { request } from '@/request';

const ExpensesPage = () => {
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState(null);
  const translate = useLanguage();

  // Fetch financial data only once when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await request.getFinancialData();
        if (response.success && response.result) {
          setExpenseData(response.result);
        }
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="expenses-page">
      <div className="pad20">
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <div className="page-header-container">
              <Breadcrumb className="breadcrumb-style">
                <Breadcrumb.Item>
                  <Link to="/">
                    <HomeOutlined />
                  </Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                  <PieChartOutlined /> {translate('Expenses')}
                </Breadcrumb.Item>
              </Breadcrumb>
              <div className="page-title">{translate('Expenses Analysis')}</div>
            </div>
          </Col>
          
          <Col span={24}>
            <Card bordered={false} className="criclebox h-full">
              {loading ? (
                <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                  <Spin size="large" />
                </div>
              ) : (
                <ExpensesChart preloadedData={expenseData} />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ExpensesPage; 
