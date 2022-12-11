import React, {FC, useEffect} from "react";
import {useHistory} from "react-router-dom";
import Button from "antd/lib/button";
import Card from "antd/lib/card";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import Layout from "antd/lib/layout";
import Spin from "antd/lib/spin";

import useLoading from "../_shared/loading";
import useAuth from "./hook";

export const SignIn: FC = () => {
  const history = useHistory();
  const [loading] = useLoading();
  const {auth, signIn} = useAuth();

  useEffect(() => {
    if (history.location.pathname === "/sign-in" && auth.type === "authenticated") {
      history.replace("/");
    }
  }, [auth.type, history]);

  return (
    <Layout style={{minHeight: "100vh", justifyContent: "center", alignItems: "center", overflow: "hidden"}}>
      {auth.type === "not-initialized" ? (
        <Spin size="large" />
      ) : (
        <Card>
          <Form name="basic" onFinish={signIn} labelCol={{span: 8}} wrapperCol={{span: 16}}>
            <Form.Item label="Identifiant" name="username" rules={[{required: true, message: "Identifiant requis."}]}>
              <Input autoFocus disabled={loading} />
            </Form.Item>
            <Form.Item label="Mot de passe" name="password" rules={[{required: true, message: "Mot de passe requis."}]}>
              <Input.Password disabled={loading} />
            </Form.Item>
            <Form.Item wrapperCol={{offset: 8, span: 16}} style={{margin: 0}}>
              <Button type="primary" htmlType="submit" loading={loading}>
                Se connecter
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </Layout>
  );
};

export default SignIn;
