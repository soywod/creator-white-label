import React, {FC, useState, useRef} from "react";
import Form, {FormInstance} from "antd/lib/form";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";

import $app from "./service";
import {Application, emptyApp} from "./model";
import {SelectUsersFormItem} from "../user/form";
import {SelectMaterialsFormItem} from "../material/form";
import {SelectFontsFormItem} from "../font/form";

type EditAppFormProps = {
  app?: Application;
  onClose: (fetchNeeded: boolean) => void;
};

export const EditAppForm: FC<EditAppFormProps> = ({app, onClose: close}) => {
  const [loading, setLoading] = useState(false);
  const form = useRef<FormInstance>(null);
  const createMode = app && app.id === 0;

  function submit() {
    if (form.current) {
      form.current.submit();
    }
  }

  function save(app: Application) {
    setLoading(true)
    $app
      .set(app)
      .then(() => close(true))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  return (
    <Modal
      closable={!loading}
      confirmLoading={loading}
      destroyOnClose
      okText={createMode ? "Créer" : "Modifier"}
      onCancel={() => !loading && close(false)}
      onOk={submit}
      title={createMode ? "Créer une application" : "Modifier une application"}
      visible={app !== undefined}
    >
      <Form ref={form} onFinish={save} layout="vertical" initialValues={app || emptyApp()}>
        <Form.Item hidden name="id">
          <Input onPressEnter={submit} />
        </Form.Item>
        <Form.Item label="Nom" name="name" rules={[{required: true, message: "Nom requis"}]}>
          <Input autoFocus disabled={loading} onPressEnter={submit} />
        </Form.Item>
        <SelectUsersFormItem />
        <SelectMaterialsFormItem />
        <SelectFontsFormItem />
      </Form>
    </Modal>
  );
};

export default EditAppForm;
