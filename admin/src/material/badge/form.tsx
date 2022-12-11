import React, {FC, useEffect, useRef, useState} from "react";
import {UploadOutlined} from "@ant-design/icons";
import Form, {FormInstance} from "antd/lib/form";
import Image from "antd/lib/image";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import Select from "antd/lib/select";
import Upload from "antd/lib/upload";

import tokenStorage from "../../auth/token-storage";
import Badge from "./model";
import $badge from "./service";

type EditAppFormProps = {
  badge?: Badge;
  onClose: (fetchNeeded: boolean) => void;
};

export const EditBadgeForm: FC<EditAppFormProps> = ({badge, onClose: close}) => {
  const [loading, setLoading] = useState(false);
  const form = useRef<FormInstance>(null);
  const createMode = Boolean(badge && badge.id === 0);

  function submit() {
    if (form.current) {
      form.current.submit();
    }
  }

  function save(badge: Badge) {
    setLoading(true);
    $badge
      .set(badge)
      .then(() => setLoading(false))
      .then(() => close(true))
      .catch(() => {});
  }

  return (
    <Modal
      width={750}
      closable={!loading}
      confirmLoading={loading}
      destroyOnClose
      okText={createMode ? "Ajouter" : "Modifier"}
      onCancel={() => !loading && close(false)}
      onOk={submit}
      title={createMode ? "Ajouter un badge" : "Modifier un badge"}
      visible={badge !== undefined}
    >
      <Form ref={form} onFinish={save} layout="vertical" initialValues={badge}>
        <Form.Item hidden name="id">
          <Input onPressEnter={submit} />
        </Form.Item>
        <Form.Item label="Nom" name="name" rules={[{required: true, message: "Nom requis."}]}>
          <Input autoFocus disabled={loading} onPressEnter={submit} />
        </Form.Item>
        <Form.Item
          label="Icône"
          name="iconUrl"
          valuePropName="file"
          rules={[{required: true, message: "Icône requise."}]}
        >
          <Upload.Dragger
            maxCount={1}
            action={`${process.env.REACT_APP_API_URL}/upload`}
            method="PUT"
            headers={{Authorization: `Bearer ${tokenStorage.get()}`}}
            withCredentials
            onChange={({file}) =>
              file.status === "done" && form.current?.setFieldsValue({iconUrl: file.response[file.name]})
            }
            listType="picture"
            onRemove={() => form.current?.resetFields(["iconUrl"])}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Glissez l'image dans cette zone</p>
            <p className="ant-upload-hint">L'image doit être au format SVG</p>
          </Upload.Dragger>
        </Form.Item>
        {badge && badge.id > 0 && (
          <Image
            src={`${process.env.REACT_APP_API_URL}/public/${badge.iconUrl}`}
            alt=""
            width={200}
            wrapperStyle={{marginBottom: "1rem"}}
          />
        )}
      </Form>
    </Modal>
  );
};

export const SelectBadgesFormItem: FC = () => {
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    $badge
      .get()
      .then(setBadges)
      .then(() => setLoading(false));
  }, []);

  return (
    <Form.Item label="Badges" name="badgeIds" hasFeedback>
      <Select mode="multiple" disabled={loading}>
        {badges.map(({id, name}) => (
          <Select.Option key={id} value={id}>
            {name}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default EditBadgeForm;
