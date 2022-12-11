import React, {useRef} from "react";
import Button from "antd/lib/button";
import Form, {FormInstance} from "antd/lib/form";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import Popconfirm from "antd/lib/popconfirm";

import useLoading from "../loading";
import Folder from "./model";
import $folder from "./service";

export type EditFolderFormProps<T> = {
  folder?: Folder<T>;
  category: string;
  onClose: (refreshNeeded: boolean) => void;
};

export function EditFolderForm<T>(props: EditFolderFormProps<T>) {
  const {folder, onClose: close} = props;
  const [loading] = useLoading();
  const form = useRef<FormInstance>(null);
  const createMode = Boolean(folder && folder.id === 0);
  const label = createMode ? "Créer" : "Modifier";

  function submit() {
    if (form.current) {
      form.current.submit();
    }
  }

  function set(folder: Folder<T>) {
    $folder
      .set(folder)
      .then(() => close(true))
      .catch(() => {});
  }

  function del(folderId: number) {
    $folder
      .del(folderId)
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
      title={`${label} un dossier`}
      visible={folder !== undefined}
      footer={[
        <Button key="cancel" type="default" onClick={() => close(false)}>
          Annuler
        </Button>,
        folder && folder.id > 0 ? (
          <Popconfirm
            key="delete"
            title="Êtes-vous sûr de vouloir supprimer ce dossier avec son contenu ?"
            placement="topRight"
            okText="Oui"
            cancelText="Non"
            onConfirm={() => del(folder.id)}
          >
            <Button danger>Supprimer</Button>
          </Popconfirm>
        ) : null,
        <Button key="save" type="primary" onClick={submit}>
          {label}
        </Button>,
      ]}
    >
      <Form ref={form} onFinish={set} layout="vertical" initialValues={folder || undefined}>
        <Form.Item hidden name="id">
          <Input />
        </Form.Item>
        <Form.Item hidden name="parentId">
          <Input />
        </Form.Item>
        <Form.Item hidden name="category">
          <Input />
        </Form.Item>
        <Form.Item label="Nom" name="name" rules={[{required: true, message: "Nom requis"}]}>
          <Input autoFocus onPressEnter={submit} disabled={loading} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default EditFolderForm;
