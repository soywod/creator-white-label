import React, {FC, useEffect, useRef, useState} from "react";
import {UploadOutlined} from "@ant-design/icons";
import Button from "antd/lib/button";
import Form, {FormInstance} from "antd/lib/form";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import Popconfirm from "antd/lib/popconfirm";
import Select from "antd/lib/select";
import Upload, {UploadChangeParam} from "antd/lib/upload";

import tokenStorage from "../auth/token-storage";
import $shape from "./service";
import Shape from "./model";
import useLoading from "../_shared/loading";

type EditShapeFormProps = {
  shape?: Shape;
  onClose: (fetchNeeded: boolean) => void;
};

export const EditShapeForm: FC<EditShapeFormProps> = ({shape, onClose}) => {
  const [loading] = useLoading();
  const [fileList, setFileList] = useState<any[]>([]);
  const form = useRef<FormInstance>(null);
  const createMode = Boolean(shape && shape.id === 0);
  const label = createMode ? "Ajouter" : "Modifier";

  useEffect(() => {
    if (shape && shape.id > 0) {
      setFileList([
        {
          name: "image",
          status: "done",
          url: `${process.env.REACT_APP_API_URL}/public/${shape.url}`,
          response: {image: shape.url},
        },
      ]);
    }
  }, [shape]);

  function close(fetchNeeded: boolean) {
    setFileList([]);
    onClose(fetchNeeded);
  }

  function submit() {
    if (form.current) {
      form.current.submit();
    }
  }

  function set(shape: Shape) {
    Promise.all(fileList.map(file => $shape.set({...shape, url: file.response[file.name]})))
      .then(() => close(true))
      .catch(() => {});
  }

  function del(shapeId: number) {
    $shape
      .del(shapeId)
      .then(() => close(true))
      .catch(() => {});
  }

  function handleFileChange(info: UploadChangeParam) {
    if (info.fileList.every(file => file.status === "done")) {
      setFileList(
        info.fileList
          .map(file => ({
            ...file,
            url: `${process.env.REACT_APP_API_URL}/public/${file.response[file.name]}`,
          }))
          .slice(createMode ? 0 : info.fileList.length - 1),
      );
    }
  }

  return (
    <Modal
      closable={!loading}
      confirmLoading={loading}
      destroyOnClose
      onCancel={() => !loading && close(false)}
      onOk={submit}
      title={`${label} une forme`}
      visible={shape !== undefined}
      footer={[
        <Button key="cancel" type="default" onClick={() => close(false)}>
          Annuler
        </Button>,
        shape && shape.id > 0 ? (
          <Popconfirm
            key="delete"
            title="Êtes-vous sûr de vouloir supprimer cette forme ?"
            placement="topRight"
            okText="Oui"
            cancelText="Non"
            onConfirm={() => del(shape.id)}
          >
            <Button danger>Supprimer</Button>
          </Popconfirm>
        ) : null,
        <Button key="save" type="primary" onClick={submit}>
          {label}
        </Button>,
      ]}
    >
      <Form ref={form} onFinish={set} layout="vertical" initialValues={shape}>
        <Form.Item hidden name="id">
          <Input />
        </Form.Item>
        <Form.Item hidden name="folderId">
          <Input />
        </Form.Item>
        <Form.Item label="Image" name="url" valuePropName="file" rules={[{required: true, message: "Image requise"}]}>
          <Upload.Dragger
            fileList={fileList}
            accept="image/svg+xml"
            action={`${process.env.REACT_APP_API_URL}/upload`}
            method="PUT"
            headers={{Authorization: `Bearer ${tokenStorage.get()}`}}
            withCredentials
            listType="picture"
            multiple
            onChange={handleFileChange}
            onRemove={file => setFileList(fileList => fileList.filter(f => f !== file))}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Cliquez ou glissez l'image dans cette zone</p>
            <p className="ant-upload-hint">L'image doit être au format SVG</p>
          </Upload.Dragger>
        </Form.Item>
        <Form.Item label="Tags" name="tags" hasFeedback>
          <Input disabled={loading} placeholder="Séparés par des virgules : tag1,tag2,tag…" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const SelectShapesFormItem: FC = () => {
  const [loading, setLoading] = useState(true);
  const [shapes, setShapes] = useState<Shape[]>([]);

  useEffect(() => {
    $shape
      .get()
      .then(setShapes)
      .then(() => setLoading(false));
  }, []);

  return (
    <Form.Item label="Shapes" name="shapeIds" hasFeedback>
      <Select mode="multiple" disabled={loading}>
        {shapes.map(({id, url}) => (
          <Select.Option key={id} value={id}>
            <img src={`${process.env.REACT_APP_API_URL}/public/${url}`} style={{width: "1rem"}} />
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default EditShapeForm;
