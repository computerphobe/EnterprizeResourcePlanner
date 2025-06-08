import { useState, useEffect } from 'react';
import { Button, Tag, Form, Divider } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeftOutlined,
  CloseCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';

import { generate as uniqueId } from 'shortid';
import Loading from '@/components/Loading';
import useLanguage from '@/locale/useLanguage';

import { settingsAction } from '@/redux/settings/actions';
import { erp } from '@/redux/erp/actions';
import { selectCreatedItem } from '@/redux/erp/selectors';

import calculate from '@/utils/calculate';

function SaveForm({ form }) {
  const translate = useLanguage();
  return (
    <Button onClick={() => form.submit()} type="primary" icon={<PlusOutlined />}>
      {translate('Save')}
    </Button>
  );
}

export default function CreateItem({ config, CreateForm }) {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { entity } = config;
  const { isLoading, isSuccess, result } = useSelector(selectCreatedItem);
  const [form] = Form.useForm();
  const [subTotal, setSubTotal] = useState(0);
  const [offerSubTotal, setOfferSubTotal] = useState(0);

  useEffect(() => {
    dispatch(settingsAction.list({ entity: 'setting' }));
  }, []);

  useEffect(() => {
    if (isSuccess) {
      form.resetFields();
      dispatch(erp.resetAction({ actionType: 'create' }));
      setSubTotal(0);
      setOfferSubTotal(0);
      navigate(`/${entity.toLowerCase()}/read/${result._id}`);
    }
  }, [isSuccess]);

  const handelValuesChange = (changedValues, values) => {
    const items = values['items'] || [];
    let newSubTotal = 0;
    let newOfferTotal = 0;

    items.forEach((item) => {
      if (item.quantity && item.price) {
        newSubTotal = calculate.add(newSubTotal, calculate.multiply(item.quantity, item.price));
      }
      if (item.quantity && item.offerPrice) {
        newOfferTotal = calculate.add(newOfferTotal, calculate.multiply(item.quantity, item.offerPrice));
      }
    });

    setSubTotal(newSubTotal);
    setOfferSubTotal(newOfferTotal);
  };

  const onSubmit = (fieldsValue) => {
    // ✅ Convert dayjs objects to native Date
    fieldsValue.date = fieldsValue.date?.toDate?.() || fieldsValue.date;
    fieldsValue.expiredDate = fieldsValue.expiredDate?.toDate?.() || fieldsValue.expiredDate;

    // ✅ Clean and prepare items
    const items = (fieldsValue.items || []).map((item) => ({
      itemName: item.itemName?.trim(),
      description: item.description || '',
      quantity: item.quantity,
      price: item.price,
      total: calculate.multiply(item.quantity, item.price),
    }));

    const invoicePayload = {
      ...fieldsValue,
      items,
    };

    console.log('✅ Final payload to backend:', invoicePayload);
    dispatch(erp.create({ entity, jsonData: invoicePayload }));
  };

  return (
    <>
      <PageHeader
        onBack={() => navigate(`/${entity.toLowerCase()}`)}
        backIcon={<ArrowLeftOutlined />}
        title={translate('New')}
        ghost={false}
        tags={<Tag>{translate('Draft')}</Tag>}
        extra={[
          <Button
            key={uniqueId()}
            onClick={() => navigate(`/${entity.toLowerCase()}`)}
            icon={<CloseCircleOutlined />}
          >
            {translate('Cancel')}
          </Button>,
          <SaveForm form={form} key={uniqueId()} />,
        ]}
        style={{ padding: '20px 0px' }}
      />
      <Divider dashed />
      <Loading isLoading={isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          onFinishFailed={(err) => console.warn('Validation failed:', err)}
          onValuesChange={handelValuesChange}
        >
          <CreateForm
            subTotal={subTotal}
            offerTotal={offerSubTotal}
            form={form}
          />
        </Form>
      </Loading>
    </>
  );
}
