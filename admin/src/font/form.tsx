import React, {FC, useEffect, useRef, useState} from "react";
import {UploadOutlined} from "@ant-design/icons";
import Form, {FormInstance} from "antd/lib/form";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import Select from "antd/lib/select";
import Upload from "antd/lib/upload";

import tokenStorage from "../auth/token-storage";
import Font from "./model";
import $font from "./service";

type EditFontFormProps = {
  font?: Font;
  onClose: (fetchNeeded: boolean) => void;
};

export const EditFontForm: FC<EditFontFormProps> = ({font, onClose: close}) => {
  const [loading, setLoading] = useState(false);
  const form = useRef<FormInstance>(null);
  const createMode = Boolean(font && font.id === 0);

  function submit() {
    if (form.current) {
      form.current.submit();
    }
  }

  function save(font: Font) {
    setLoading(true);
    $font
      .set(font)
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
      title={createMode ? "Ajouter une police" : "Modifier une police"}
      visible={font !== undefined}
    >
      <Form ref={form} onFinish={save} layout="vertical" initialValues={font}>
        <Form.Item hidden name="id">
          <Input onPressEnter={submit} />
        </Form.Item>
        <Form.Item label="Nom" name="name" hasFeedback rules={[{required: true, message: "Nom requis"}]}>
          <Input disabled={loading} />
        </Form.Item>
        <Form.Item
          label="Fichier"
          name="url"
          valuePropName="file"
          rules={[{required: true, message: "Fichier requis"}]}
        >
          <Upload.Dragger
            maxCount={1}
            action={`${process.env.REACT_APP_API_URL}/upload`}
            method="PUT"
            headers={{Authorization: `Bearer ${tokenStorage.get()}`}}
            withCredentials
            onChange={({file}) =>
              file.status === "done" && form.current?.setFieldsValue({url: file.response[file.name]})
            }
            listType="text"
            onRemove={() => form.current?.resetFields(["url"])}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Glissez la police dans cette zone</p>
            <p className="ant-upload-hint">La police doit être au format TTF</p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const SelectFontsFormItem: FC = () => {
  const [loading, setLoading] = useState(true);
  const [fonts, setFonts] = useState<Font[]>([]);

  useEffect(() => {
    $font
      .get()
      .then(setFonts)
      .then(() => setLoading(false));
  }, []);

  return (
    <Form.Item label="Fonts" name="fontIds" hasFeedback>
      <Select mode="multiple" disabled={loading}>
        {fonts.map(({id, name}) => (
          <Select.Option key={id} value={id}>
            {name}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default EditFontForm;
