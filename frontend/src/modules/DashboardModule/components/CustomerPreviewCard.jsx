import { Statistic, Progress, Divider, Row, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, CheckOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import color from '@/utils/color';

export default function CustomerPreviewCard({
  isLoading = false,
  activeCustomer = 0,
  newCustomer = 0,
}) {
  const translate = useLanguage();
  return (
    <Row className="gutter-row">
      <div className="whiteBox shadow" style={{ height: 458 }}>
        <div
          className="pad20"
          style={{
            textAlign: 'center',
            justifyContent: 'center',
          }}
        >
          <h3 style={{ color: 'black', marginBottom: 40, marginTop: 15, fontSize: 'large' }}>
            {translate('Customers')}
          </h3>

          {isLoading ? (
            <div style={color.center}>
              <p style={{ color: 'black', fontSize: 16 }}>{translate('Loading...')}</p>
            <Spin />
            </div>
          ) : (
            <div
              style={{
                color: 'black',
                display: 'grid',
                justifyContent: 'center',
              }}
            >
              <Progress
                type="dashboard"
                strokeColor={{
                  '0%': '#bae7ff',
                  '100%': '#1890ff',
                }}
                trailColor="#f0f5ff"
                format={() => (
                  <CheckOutlined style={{ color: '#1890ff' }} />
                )}
                percent={newCustomer}
                size={148}
              />
              <p>{translate('New Customer this Month')}</p>
              <Divider />
              <Statistic
                title={translate('Active Customer')}
                value={activeCustomer}
                precision={2}
                valueStyle={
                  activeCustomer > 0
                    ? { color: 'black' }
                    : activeCustomer < 0
                      ? { color: 'black' }
                      : { color: '#000000' }
                }
                prefix={
                  activeCustomer > 0 ? (
                    <ArrowUpOutlined />
                  ) : activeCustomer < 0 ? (
                    <ArrowDownOutlined />
                  ) : null
                }
                suffix="%"
              />
            </div>
          )}
        </div>
      </div>
    </Row>
  );
}
