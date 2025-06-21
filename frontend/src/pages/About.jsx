import { Button, Result } from 'antd';

import useLanguage from '@/locale/useLanguage';

const About = () => {
  const translate = useLanguage();
  return (
    <Result
      status="info"
      title={'ShashwatImplant'}
      subTitle={translate('Do you need help on customize of this app')}
      extra={
        <>
          <p>
            Website : http://localhost:3000
            <br />
          </p>
          <p>
            ShashwatImplant, bhavnagar, Gujarat, India
            <br />
          </p>
          <Button
            type="primary"
            onClick={() => {
              window.open(`http://localhost:3000/contact`, '_self');
            }}
          >
            {translate('Contact us')}
          </Button>
        </>
      }
    />
  );
};

export default About;
