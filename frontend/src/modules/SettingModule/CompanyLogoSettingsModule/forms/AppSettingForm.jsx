import { Button, Form, message, Upload } from 'antd';

import { UploadOutlined } from '@ant-design/icons';

import useLanguage from '@/locale/useLanguage';

export default function AppSettingForm() {
  const translate = useLanguage();
  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt100M = file.size / 1024 / 1024 < 100;
    if (!isLt100M) {
      message.error('Image must be smaller than 100MB!');
    }
    return false;
  };
  return (
    <>
      <Form.Item
        name="file"
        label="Logo"
        valuePropName="fileList"
        getValueFromEvent={(e) => e.fileList}
      >
        <Upload
          beforeUpload={beforeUpload}
          listType="picture"
          accept="image/png, image/jpeg"
          maxCount={1}
        >
          <Button icon={<UploadOutlined />}>{translate('click_to_upload')}</Button>
        </Upload>
      </Form.Item>
    </>
  );
}
