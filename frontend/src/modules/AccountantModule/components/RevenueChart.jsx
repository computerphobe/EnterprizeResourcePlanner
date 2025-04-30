import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';
import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';
import { request } from '@/request';

function RevenueChart() {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const money_format_settings = useSelector(selectMoneyFormat);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revenueSourcesData, setRevenueSourcesData] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await request.getFinancialData();
        
        if (response.success && response.result && response.result.revenueSources) {
          setRevenueSourcesData(response.result.revenueSources);
        }
      } catch (error) {
        console.error("Error fetching revenue data:", error);
      } finally {
        setLoading(false);
        setChartLoaded(true);
      }
    };
    
    fetchData();
  }, []);
  
  // Table columns for revenue sources
  const revenueSourceColumns = [
    {
      title: translate('Revenue Source'),
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: translate('Amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => moneyFormatter({ 
        amount, 
        currency_code: money_format_settings?.default_currency_code 
      }),
      align: 'right',
    },
    {
      title: translate('Percentage'),
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage) => `${percentage}%`,
      align: 'right',
    },
    {
      title: translate('YoY Change'),
      dataIndex: 'change',
      key: 'change',
      render: (change) => {
        const color = change >= 0 ? 'green' : 'red';
        const sign = change >= 0 ? '+' : '';
        return <span style={{ color }}>{sign}{change}%</span>;
      },
      align: 'right',
    },
  ];
  useEffect(() => {
    // We'll use a setTimeout to simulate dynamic loading
    // In a real implementation, you would load your chart library here
    const timer = setTimeout(() => {
      setChartLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div>
      <Row gutter={[16, 16]}>        <Col xs={24} lg={12}>
          <Card title={translate('Quarterly Revenue')} bordered={false}>
            <div 
              style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              {!chartLoaded ? (
                <div>{translate('Loading chart...')}</div>
              ) : (
                <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
                  {/* Simulated bar chart with CSS */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                    <div style={{ height: '210px', width: '40px', backgroundColor: '#1890ff', marginBottom: '8px' }}></div>
                    <div>{translate('Q1')}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                    <div style={{ height: '180px', width: '40px', backgroundColor: '#1890ff', marginBottom: '8px' }}></div>
                    <div>{translate('Q2')}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                    <div style={{ height: '240px', width: '40px', backgroundColor: '#1890ff', marginBottom: '8px' }}></div>
                    <div>{translate('Q3')}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                    <div style={{ height: '270px', width: '40px', backgroundColor: '#1890ff', marginBottom: '8px' }}></div>
                    <div>{translate('Q4')}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                    <div style={{ height: '300px', width: '40px', backgroundColor: '#52c41a', marginBottom: '8px' }}></div>
                    <div>{translate('Current')}</div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>          <Card 
            title={translate('Revenue by Source')} 
            bordered={false}
            loading={loading}
          >
            {!loading ? (
              <>
                <Table 
                  dataSource={revenueSourcesData} 
                  columns={revenueSourceColumns}
                  pagination={false}
                  size="middle"
                />
                  <div className="mt-4">
                  <h4 className="text-lg font-medium mb-2">{translate('Key Insights')}</h4>
                  {revenueSourcesData.length > 0 && (
                    <>
                      <p>
                        {translate(
                          `Overall revenue ${revenueSourcesData.reduce((acc, src) => acc + src.change, 0) / revenueSourcesData.length > 0 ? 'increased' : 'decreased'} by ${
                            Math.abs(revenueSourcesData.reduce((acc, src) => acc + src.change, 0) / revenueSourcesData.length).toFixed(1)
                          }% compared to last year.`
                        )}
                      </p>
                      {revenueSourcesData.some(src => src.change > 0) && (
                        <p>
                          {translate(`Highest growth area: ${
                            [...revenueSourcesData].sort((a, b) => b.change - a.change)[0]?.source
                          } (${
                            [...revenueSourcesData].sort((a, b) => b.change - a.change)[0]?.change > 0 ? '+' : ''
                          }${
                            [...revenueSourcesData].sort((a, b) => b.change - a.change)[0]?.change
                          }%)`)}
                        </p>
                      )}
                      <p>
                        {translate(`Most stable revenue stream: ${
                          [...revenueSourcesData].sort((a, b) => b.percentage - a.percentage)[0]?.source
                        } (${
                          [...revenueSourcesData].sort((a, b) => b.percentage - a.percentage)[0]?.percentage
                        }% of total revenue)`)}
                      </p>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center p-8">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}


export default RevenueChart;