import React, {FC, useEffect, useRef, useState} from "react";
import Form, {FormInstance} from "antd/lib/form";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import Switch from "antd/lib/switch";
import Select from "antd/lib/select";

import User from "./model";
import $user from "./service";

type EditUserFormProps = {
  user?: User;
  onClose: (fetchNeeded: boolean) => void;
};

export const EditUserForm: FC<EditUserFormProps> = ({user, onClose: close}) => {
  const [loading, setLoading] = useState(false);
  const form = useRef<FormInstance>(null);
  const createMode = Boolean(user && user.id === 0);

  function submit() {
    if (form.current) {
      form.current.submit();
    }
  }

  function save(user: User) {
    setLoading(true);
    $user
      .set(user)
      .then(() => close(true))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  return (
    <Modal
      closable={!loading}
      confirmLoading={loading}
      destroyOnClose
      okText={createMode ? "Ajouter" : "Modifier"}
      onCancel={() => !loading && close(false)}
      onOk={submit}
      title={createMode ? "Ajouter un utilisateur" : "Modifier un utilisateur"}
      visible={user !== undefined}
    >
      <Form ref={form} onFinish={save} layout="vertical" initialValues={user}>
        <Form.Item hidden name="id">
          <Input onPressEnter={submit} />
        </Form.Item>
        <Form.Item label="Identifiant" name="username" rules={[{required: true, message: "Identifiant requis."}]}>
          <Input autoFocus disabled={loading} onPressEnter={submit} />
        </Form.Item>
        <Form.Item
          label="Mot de passe"
          name="password"
          rules={[{required: createMode, message: "Mot de passe requis."}]}
        >
          <Input.Password disabled={loading} onPressEnter={submit} />
        </Form.Item>
        <Form.Item label="Administrateur" name="isAdmin" valuePropName="checked" style={{margin: 0}}>
          <Switch disabled={loading} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const SelectUsersFormItem: FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    $user
      .get()
      .then(setUsers)
      .then(() => setLoading(false));
  }, []);

  return (
    <Form.Item label="Users" name="userIds" hasFeedback>
      <Select mode="multiple" disabled={loading}>
        {users.map(({id, username}) => (
          <Select.Option key={id} value={id}>
            {username}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default EditUserForm;
