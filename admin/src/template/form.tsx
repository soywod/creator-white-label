import {FC, useEffect, useRef, useState} from "react";
import {DoubleRightOutlined} from "@ant-design/icons";
import Button from "antd/lib/button";
import Form, {FormInstance} from "antd/lib/form";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import Popconfirm from "antd/lib/popconfirm";
import Select from "antd/lib/select";

import $template from "./service";
import Template from "./model";
import useLoading from "../_shared/loading";

type EditTemplateFormProps = {
  template?: Template;
  encodedPath: string;
  onClose: (fetchNeeded: boolean) => void;
};

export const EditTemplateForm: FC<EditTemplateFormProps> = ({template, encodedPath, onClose}) => {
  const [loading] = useLoading();
  const form = useRef<FormInstance>(null);
  const createMode = Boolean(template && template.id === 0);
  const label = createMode ? "Ajouter" : "Modifier";

  function close(fetchNeeded: boolean) {
    onClose(fetchNeeded);
  }

  function submit() {
    if (form.current) {
      form.current.submit();
    }
  }

  function set(template: Template) {
    $template
      .set(template)
      .then(() => close(true))
      .catch(() => {});
  }

  function del(templateId: number) {
    $template
      .del(templateId)
      .then(() => close(true))
      .catch(() => {});
  }

  return (
    <Modal
      closable={!loading}
      confirmLoading={loading}
      destroyOnClose
      onCancel={() => !loading && close(false)}
      onOk={submit}
      title={`${label} un template`}
      visible={template !== undefined}
      footer={[
        <Button key="cancel" type="default" onClick={() => close(false)}>
          Annuler
        </Button>,
        template && template.id > 0 ? (
          <Popconfirm
            key="delete"
            title="Êtes-vous sûr de vouloir supprimer ce template ?"
            placement="topRight"
            okText="Oui"
            cancelText="Non"
            onConfirm={() => del(template.id)}
          >
            <Button danger>Supprimer</Button>
          </Popconfirm>
        ) : null,
        <Button key="save" type="primary" onClick={submit}>
          {label}
        </Button>,
      ]}
    >
      <Form ref={form} onFinish={set} layout="vertical" initialValues={template}>
        <Form.Item hidden name="id">
          <Input />
        </Form.Item>
        <Form.Item hidden name="folderId">
          <Input />
        </Form.Item>
        <Form.Item label="Nom" name="name" rules={[{required: true, message: "Nom requis"}]}>
          <Input />
        </Form.Item>
        <Form.Item label="Tags" name="tags" hasFeedback>
          <Input disabled={loading} placeholder="Séparés par des virgules : tag1,tag2,tag…" />
        </Form.Item>
        <div style={{textAlign: "right"}}>
          <a href={`/template/edit/${(template && template.id) || ""}?path=${encodedPath}`}>
            Accéder à l'éditeur <DoubleRightOutlined />
          </a>
        </div>
      </Form>
    </Modal>
  );
};

export const SelectTemplatesFormItem: FC = () => {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    $template
      .get()
      .then(setTemplates)
      .then(() => setLoading(false));
  }, []);

  return (
    <Form.Item label="Templates" name="templateIds" hasFeedback>
      <Select mode="multiple" disabled={loading}>
        {templates.map(({id, name}) => (
          <Select.Option key={id} value={id}>
            {name}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default EditTemplateForm;
