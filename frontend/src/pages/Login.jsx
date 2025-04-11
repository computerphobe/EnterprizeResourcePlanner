import { useDispatch, useSelector } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { Form, Button } from 'antd';

import { login } from '@/redux/auth/actions';
import { selectAuth } from '@/redux/auth/selectors';
import LoginForm from '@/forms/LoginForm';
import Loading from '@/components/Loading';
import AuthModule from '@/modules/AuthModule';

const LoginPage = () => {
  const translate = useLanguage();
  const auth = useSelector(selectAuth);
  const { isLoading } = auth;
  const dispatch = useDispatch();

  console.log('LoginPage component loaded');

  const onFinish = (values) => {
    console.log('Login form submitted with:', values);
    dispatch(login({ loginData: values }));
  };
  
  const FormContainer = () => (
    <Loading isLoading={isLoading}>
      <Form layout="vertical" onFinish={onFinish}>
        <LoginForm />
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="login-form-button"
            loading={isLoading}
            size="large"
          >
            {translate('Log in')}
          </Button>
        </Form.Item>
      </Form>
    </Loading>
  );

  return <AuthModule authContent={<FormContainer />} AUTH_TITLE="Sign in" />;
};

export default LoginPage;
