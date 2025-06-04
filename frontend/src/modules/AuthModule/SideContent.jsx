import { Space, Layout, Divider, Typography } from 'antd';
import useLanguage from '@/locale/useLanguage';
import { useSelector } from 'react-redux';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function SideContent() {
  const translate = useLanguage();

  return (
    <Content
      style={{
        padding: '150px 30px 30px',
        width: '100%',
        maxWidth: '450px',
        margin: '0 auto',
        color: 'white',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
      }}
      className="sideContent"
    >
      <div style={{ width: '100%' }}>
        <Title level={1} style={{ fontSize: 28, color: 'white' }}>
          Shashwat Implants and surgical care
        </Title>
        <Text style={{ color: 'white' }}>
          
        </Text>
      </div>
    </Content>
  );
}
