import { useState, useEffect } from 'react';
import { Divider, Button, Row, Col, Descriptions, Statistic } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import {
  EditOutlined,
  FilePdfOutlined,
  CloseCircleOutlined,
  RetweetOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import useLanguage from '@/locale/useLanguage';
import { useMoney, useDate } from '@/settings';
import useMail from '@/hooks/useMail';
import { erp } from '@/redux/erp/actions';
import { selectCurrentItem } from '@/redux/erp/selectors';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import { generate as uniqueId } from 'shortid';

const Item = ({ item, currentErp }) => {
  const { moneyFormatter } = useMoney();
  return (
    <Row gutter={[12, 0]} key={item._id}>
      <Col className="gutter-row" span={11}>
        <p style={{ marginBottom: 5 }}>
          <strong>{item.itemName}</strong>
        </p>
        <p>{item.description}</p>
      </Col>
      <Col className="gutter-row" span={4} style={{ textAlign: 'right' }}>
        {moneyFormatter({ amount: item.price, currency_code: currentErp.currency })}
      </Col>
      <Col className="gutter-row" span={4} style={{ textAlign: 'right' }}>
        {item.quantity}
      </Col>
      <Col className="gutter-row" span={5} style={{ textAlign: 'right', fontWeight: '700' }}>
        {moneyFormatter({ amount: item.total, currency_code: currentErp.currency })}
      </Col>
      <Divider dashed style={{ marginTop: 0, marginBottom: 15 }} />
    </Row>
  );
};

export default function ReadItem({ config, selectedItem }) {
  const translate = useLanguage();
  const { entity, ENTITY_NAME } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { moneyFormatter } = useMoney();
  const { send, isLoading: mailInProgress } = useMail({ entity });

  const { result: currentResult } = useSelector(selectCurrentItem);

  const resetErp = {
    status: '',
    client: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
    subTotal: 0,
    taxTotal: 0,
    taxRate: 0,
    total: 0,
    credit: 0,
    number: 0,
    year: 0,
  };

  const [itemslist, setItemsList] = useState([]);
  const [currentErp, setCurrentErp] = useState(selectedItem ?? resetErp);

  useEffect(() => {
    if (currentResult) {
      const { items, invoice, ...others } = currentResult;

      if (items) {
        setItemsList(items);
        setCurrentErp(currentResult);
      } else if (invoice?.items) {
        setItemsList(invoice.items);
        setCurrentErp({ ...invoice.items, ...others, ...invoice });
      }
    }
    return () => {
      setItemsList([]);
      setCurrentErp(resetErp);
    };
  }, [currentResult]);

  const client = currentErp?.client || {};

  return (
    <>
      <PageHeader
        onBack={() => navigate(`/${entity.toLowerCase()}`)}
        title={`${ENTITY_NAME} # ${currentErp.number}/${currentErp.year || ''}`}
        ghost={false}
        tags={[
          <span key="status">{currentErp.status && translate(currentErp.status)}</span>,
          currentErp.paymentStatus && (
            <span key="paymentStatus">
              {translate(currentErp.paymentStatus)}
            </span>
          ),
        ]}
        extra={[
          <Button key={uniqueId()} onClick={() => navigate(`/${entity.toLowerCase()}`)} icon={<CloseCircleOutlined />}>
            {translate('Close')}
          </Button>,
          <Button
            key={uniqueId()}
            onClick={() =>
              window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${currentErp._id}.pdf`, '_blank')
            }
            icon={<FilePdfOutlined />}
          >
            {translate('Download PDF')}
          </Button>,
          <Button
            key={uniqueId()}
            loading={mailInProgress}
            onClick={() => send(currentErp._id)}
            icon={<MailOutlined />}
          >
            {translate('Send by Email')}
          </Button>,
          <Button
            key={uniqueId()}
            onClick={() => dispatch(erp.convert({ entity, id: currentErp._id }))}
            icon={<RetweetOutlined />}
            style={{ display: entity === 'quote' ? 'inline-block' : 'none' }}
          >
            {translate('Convert to Invoice')}
          </Button>,
          <Button
            key={uniqueId()}
            onClick={() => {
              dispatch(erp.currentAction({ actionType: 'update', data: currentErp }));
              navigate(`/${entity.toLowerCase()}/update/${currentErp._id}`);
            }}
            type="primary"
            icon={<EditOutlined />}
          >
            {translate('Edit')}
          </Button>,
        ]}
        style={{ padding: '20px 0px' }}
      >
        <Row>
          <Statistic title="Status" value={currentErp.status} />
          <Statistic
            title={translate('SubTotal')}
            value={moneyFormatter({ amount: currentErp.subTotal, currency_code: currentErp.currency })}
            style={{ margin: '0 32px' }}
          />
          <Statistic
            title={translate('Total')}
            value={moneyFormatter({ amount: currentErp.total, currency_code: currentErp.currency })}
            style={{ margin: '0 32px' }}
          />
          <Statistic
            title={translate('Paid')}
            value={moneyFormatter({ amount: currentErp.credit, currency_code: currentErp.currency })}
            style={{ margin: '0 32px' }}
          />
        </Row>
      </PageHeader>

      <Divider dashed />

      <Descriptions title={`Client: ${client?.name || 'N/A'}`}>
        <Descriptions.Item label={translate('Address')}>{client?.address || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label={translate('email')}>{client?.email || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label={translate('Phone')}>{client?.phone || 'N/A'}</Descriptions.Item>
      </Descriptions>

      <Divider />

      <Row gutter={[12, 0]}>
        <Col span={11}><strong>{translate('Product')}</strong></Col>
        <Col span={4} style={{ textAlign: 'right' }}><strong>{translate('Price')}</strong></Col>
        <Col span={4} style={{ textAlign: 'right' }}><strong>{translate('Quantity')}</strong></Col>
        <Col span={5} style={{ textAlign: 'right' }}><strong>{translate('Total')}</strong></Col>
        <Divider />
      </Row>

      {itemslist.map((item) => (
        <Item key={item._id} item={item} currentErp={currentErp} />
      ))}

      <div style={{ width: '300px', float: 'right', textAlign: 'right', fontWeight: '700' }}>
        <Row gutter={[12, -5]}>
          <Col span={12}><p>{translate('Sub Total')} :</p></Col>
          <Col span={12}>
            <p>{moneyFormatter({ amount: currentErp.subTotal, currency_code: currentErp.currency })}</p>
          </Col>

          <Col span={12}><p>{translate('Tax Total')} ({currentErp.taxRate}%) :</p></Col>
          <Col span={12}>
            <p>{moneyFormatter({ amount: currentErp.taxTotal, currency_code: currentErp.currency })}</p>
          </Col>

          <Col span={12}><p>{translate('Total')} :</p></Col>
          <Col span={12}>
            <p>{moneyFormatter({ amount: currentErp.total, currency_code: currentErp.currency })}</p>
          </Col>
        </Row>
      </div>
    </>
  );
}
