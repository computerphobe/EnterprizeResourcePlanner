import { useEffect, useState, memo } from 'react';
import { Card, Row, Col, Table, Spin, Empty, message } from 'antd';
import { LoadingOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';
import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';
import { request } from '@/request';

function RevenueChartComponent({ preloadedData = null, isLoading = false }) {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const money_format_settings = useSelector(selectMoneyFormat);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [loading, setLoading] = useState(preloadedData ? false : true);
  const [revenueSourcesData, setRevenueSourcesData] = useState(
    preloadedData?.revenueSources || []
  );
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [quarterlyData, setQuarterlyData] = useState([
    { quarter: 'Q1', amount: 45000 },
    { quarter: 'Q2', amount: 38000 },
    { quarter: 'Q3', amount: 52000 },
    { quarter: 'Q4', amount: 65000 },
    { quarter: 'Current', amount: 70000, isCurrent: true }
  ]);
  
  // Single data fetching effect
  useEffect(() => {
    let isMounted = true;
    
    // If we already have preloaded data, use it
    if (preloadedData && preloadedData.revenueSources) {
      if (isMounted) {
        setRevenueSourcesData(preloadedData.revenueSources);
        
        // Calculate current quarter revenue from revenue sources
        if (preloadedData.revenueSources.length > 0) {
          const currentAmount = preloadedData.revenueSources.reduce(
            (total, source) => total + (source.amount || 0), 0
          );
          setQuarterlyData(prev => {
            const newData = [...prev];
            newData[4].amount = currentAmount;
            return newData;
          });
        }
        
        setChartLoaded(true);
        setLoading(false);
      }
      return;
    }
    
    // Only fetch if no preloaded data and we haven't already tried
    if (!preloadedData && !fetchAttempted && !isLoading) {
      const fetchData = async () => {
        try {
          if (isMounted) setLoading(true);
          const response = await request.getFinancialData();
          
          if (response.success && response.result && response.result.revenueSources && isMounted) {
            setRevenueSourcesData(response.result.revenueSources);
            
            // Calculate current quarter revenue from revenue sources
            if (response.result.revenueSources.length > 0) {
              const currentAmount = response.result.revenueSources.reduce(
                (total, source) => total + (source.amount || 0), 0
              );
              setQuarterlyData(prev => {
                const newData = [...prev];
                newData[4].amount = currentAmount;
                return newData;
              });
            }
            
            console.log('Revenue chart fetched data directly');
          } else if (isMounted) {
            console.error('Failed to fetch revenue data');
          }
        } catch (error) {
          if (isMounted) {
            console.error("Error fetching revenue data:", error);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
            setChartLoaded(true);
            setFetchAttempted(true);
          }
        }
      };
      
      fetchData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [preloadedData, fetchAttempted, isLoading]);
  
  // Update when preloadedData changes - separate effect to handle updates
  useEffect(() => {
    if (preloadedData?.revenueSources) {
      setRevenueSourcesData(preloadedData.revenueSources);
      
      // Calculate current quarter revenue from revenue sources
      if (preloadedData.revenueSources.length > 0) {
        const currentAmount = preloadedData.revenueSources.reduce(
          (total, source) => total + (source.amount || 0), 0
        );
        setQuarterlyData(prev => {
          const newData = [...prev];
          newData[4].amount = currentAmount;
          return newData;
        });
      }
      
      setLoading(false);
      setChartLoaded(true);
    }
  }, [preloadedData]);
  
  // Determine the actual loading state
  const isCurrentlyLoading = isLoading || loading;
  
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
        amount: amount || 0, 
        currency_code: money_format_settings?.default_currency_code 
      }),
      align: 'right',
    },
    {
      title: translate('Percentage'),
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage) => `${percentage || 0}%`,
      align: 'right',
    },
    {
      title: translate('YoY Change'),
      dataIndex: 'change',
      key: 'change',
      render: (change) => {
        const color = change >= 0 ? 'green' : 'red';
        const sign = change >= 0 ? '+' : '';
        const icon = change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
        return <span style={{ color }}>{icon} {sign}{change || 0}%</span>;
      },
      align: 'right',
    },
  ];
  
  // Function to get maximum value for scaling bars
  const getMaxAmount = () => {
    return Math.max(...quarterlyData.map(item => item.amount)) * 1.1; // Add 10% margin
  };
  
  const maxAmount = getMaxAmount();
  
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={translate('Quarterly Revenue')} 
            bordered={false}
            loading={isCurrentlyLoading}
          >
            <div 
              style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              {isCurrentlyLoading ? (
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              ) : !chartLoaded ? (
                <div>{translate('Loading chart...')}</div>
              ) : (
                <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
                  {/* Dynamic bar chart based on quarterly data */}
                  {quarterlyData.map((item, index) => (
                    <div 
                      key={`quarterly-${item.quarter}-${index}`} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        width: '60px' 
                      }}
                    >
                      <div 
                        style={{ 
                          height: `${(item.amount / maxAmount) * 300}px`, 
                          width: '40px', 
                          backgroundColor: item.isCurrent ? '#52c41a' : '#1890ff', 
                          marginBottom: '8px',
                          transition: 'height 0.5s ease'
                        }}
                      ></div>
                      <div>{translate(item.quarter)}</div>
                      <div style={{ fontSize: '10px', color: '#888' }}>
                        {moneyFormatter({ 
                          amount: item.amount, 
                          currency_code: money_format_settings?.default_currency_code,
                          showCurrency: false
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title={translate('Revenue by Source')} 
            bordered={false}
            loading={isCurrentlyLoading}
          >
            {isCurrentlyLoading ? (
              <div className="flex justify-center items-center p-8">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              </div>
            ) : revenueSourcesData.length === 0 ? (
              <Empty description={translate('No revenue data available')} />
            ) : (
              <>
                <Table 
                  dataSource={revenueSourcesData} 
                  columns={revenueSourceColumns}
                  pagination={false}
                  size="middle"
                  rowKey="key"
                />
                <div className="mt-4">
                  <h4 className="text-lg font-medium mb-2">{translate('Key Insights')}</h4>
                  {revenueSourcesData.length > 0 && (
                    <>
                      <p>
                        {translate(
                          `Overall revenue ${revenueSourcesData.reduce((acc, src) => acc + (src.change || 0), 0) / revenueSourcesData.length > 0 ? 'increased' : 'decreased'} by ${
                            Math.abs((revenueSourcesData.reduce((acc, src) => acc + (src.change || 0), 0) / revenueSourcesData.length) || 0).toFixed(1)
                          }% compared to last year.`
                        )}
                      </p>
                      {revenueSourcesData.some(src => (src.change || 0) > 0) && (
                        <p>
                          {translate(`Highest growth area: ${
                            [...revenueSourcesData].sort((a, b) => (b.change || 0) - (a.change || 0))[0]?.source
                          } (${
                            [...revenueSourcesData].sort((a, b) => (b.change || 0) - (a.change || 0))[0]?.change >= 0 ? '+' : ''
                          }${
                            [...revenueSourcesData].sort((a, b) => (b.change || 0) - (a.change || 0))[0]?.change || 0
                          }%)`)}
                        </p>
                      )}
                      <p>
                        {translate(`Most significant revenue stream: ${
                          [...revenueSourcesData].sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0]?.source
                        } (${
                          [...revenueSourcesData].sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0]?.percentage || 0
                        }% of total revenue)`)}
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// Use React.memo to prevent unnecessary re-renders
const RevenueChart = memo(RevenueChartComponent);

export default RevenueChart;