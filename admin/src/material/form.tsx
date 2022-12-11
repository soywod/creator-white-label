import React, {FC, useEffect, useRef, useState} from "react";
import ReactQuill, {Quill} from "react-quill";
import {UploadOutlined} from "@ant-design/icons";
import Col from "antd/lib/col";
import Slider from "antd/lib/slider";
import Form, {FormInstance} from "antd/lib/form";
import Image from "antd/lib/image";
import Input from "antd/lib/input";
import InputNumber from "antd/lib/input-number";
import Modal from "antd/lib/modal";
import Row from "antd/lib/row";
import Select from "antd/lib/select";
import Upload from "antd/lib/upload";

import tokenStorage from "../auth/token-storage";
import {SelectFixationsFormItem} from "../fixation/form";
import {SelectShapesFormItem} from "../shape/form";
import {SelectDimensionsFormItem} from "../dimension/form";
import {SelectDiscountsFormItem} from "../discount/form";
import {SelectBadgesFormItem} from "./badge/form";
import Material from "./model";
import $material from "./service";

type EditAppFormProps = {
  material?: Material;
  onClose: (fetchNeeded: boolean) => void;
};

export const EditMaterialForm: FC<EditAppFormProps> = ({material, onClose: close}) => {
  const [loading, setLoading] = useState(false);
  const form = useRef<FormInstance>(null);
  const createMode = Boolean(material && material.id === 0);

  function submit() {
    if (form.current) {
      form.current.submit();
    }
  }

  function save(material: Material) {
    setLoading(true);
    $material
      .set(material)
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
      title={createMode ? "Ajouter un matériau" : "Modifier un matériau"}
      visible={material !== undefined}
    >
      <Form ref={form} onFinish={save} layout="vertical" initialValues={material}>
        <Form.Item hidden name="id">
          <Input onPressEnter={submit} />
        </Form.Item>
        <Form.Item label="Titre" name="title" rules={[{required: true, message: "Titre requis."}]}>
          <Input autoFocus disabled={loading} onPressEnter={submit} />
        </Form.Item>
        <Form.Item label="Description" name="description" rules={[{required: true, message: "Titre requis."}]}>
          <Input.TextArea disabled={loading} />
        </Form.Item>
        <Form.Item label="Plus d'info" name="more">
          <ReactQuill
            theme="snow"
            modules={{
              toolbar: {
                container: [
                  [{header: [1, 2, false]}],
                  ["bold", "italic", "underline", "strike", "blockquote"],
                  [{list: "ordered"}, {list: "bullet"}, {indent: "-1"}, {indent: "+1"}],
                  ["link", "image"],
                  ["clean"],
                ],
                handlers: {
                  image: function () {
                    const input = document.createElement("input");
                    input.setAttribute("type", "file");
                    input.addEventListener("change", () => {
                      if (input.files && 0 in input.files) {
                        const file = input.files[0];
                        const body = new FormData();
                        body.append("file", file);
                        fetch(`${process.env.REACT_APP_API_URL}/upload`, {
                          method: "PUT",
                          headers: {Authorization: `Bearer ${tokenStorage.get()}`},
                          credentials: "include",
                          body,
                        })
                          .then(res => res.json())
                          .then(res => {
                            const editor: Quill = (this as any).quill;
                            const range = editor.getSelection();
                            editor.insertEmbed(
                              range ? range.index : 0,
                              "image",
                              `${process.env.REACT_APP_API_URL}/public/${res[file.name]}`,
                            );
                          });
                      }
                    });
                    input.click();
                  },
                },
              },
            }}
          />
        </Form.Item>
        <Form.Item
          label="Aperçu"
          name="preview"
          valuePropName="file"
          rules={[{required: true, message: "Aperçu requis."}]}
        >
          <Upload.Dragger
            maxCount={1}
            action={`${process.env.REACT_APP_API_URL}/upload`}
            method="PUT"
            headers={{Authorization: `Bearer ${tokenStorage.get()}`}}
            withCredentials
            onChange={({file}) =>
              file.status === "done" && form.current?.setFieldsValue({preview: file.response[file.name]})
            }
            listType="picture"
            onRemove={() => form.current?.resetFields(["preview"])}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Glissez l'image dans cette zone</p>
            <p className="ant-upload-hint">L'image doit être au format PNG</p>
          </Upload.Dragger>
        </Form.Item>
        {material && material.id > 0 && (
          <Image
            src={`${process.env.REACT_APP_API_URL}/public/${material.preview}`}
            alt=""
            width={200}
            wrapperStyle={{marginBottom: "1rem"}}
          />
        )}
        <Form.Item
          label="Fond"
          name="background"
          valuePropName="file"
          rules={[{required: true, message: "Fond requis."}]}
        >
          <Upload.Dragger
            accept=".jpg,.jpeg,"
            maxCount={1}
            action={`${process.env.REACT_APP_API_URL}/upload`}
            method="PUT"
            headers={{Authorization: `Bearer ${tokenStorage.get()}`}}
            withCredentials
            onChange={({file}) =>
              file.status === "done" && form.current?.setFieldsValue({background: file.response[file.name]})
            }
            listType="picture"
            onRemove={() => form.current?.resetFields(["background"])}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Glissez l'image dans cette zone</p>
            <p className="ant-upload-hint">L'image doit être au format JPEG</p>
          </Upload.Dragger>
        </Form.Item>
        {material && material.id > 0 && (
          <Image
            src={`${process.env.REACT_APP_API_URL}/public/${material.background}`}
            alt=""
            width={200}
            wrapperStyle={{marginBottom: "1rem"}}
          />
        )}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Longueur min. (mm)"
              name="minWidth"
              rules={[{required: true, message: "Longueur min. requise"}]}
            >
              <InputNumber min={0} step={1} disabled={loading} style={{width: "100%"}} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Longueur max. (mm)"
              name="maxWidth"
              rules={[{required: true, message: "Longueur max. requise"}]}
            >
              <InputNumber min={0} step={1} disabled={loading} style={{width: "100%"}} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Hauteur min. (mm)"
              name="minHeight"
              rules={[{required: true, message: "Hauteur min. requise"}]}
            >
              <InputNumber min={0} step={1} disabled={loading} style={{width: "100%"}} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Hauteur max. (mm)"
              name="maxHeight"
              rules={[{required: true, message: "Hauteur max. requise"}]}
            >
              <InputNumber min={0} step={1} disabled={loading} style={{width: "100%"}} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Montant fixe (€)"
              name="fixedPrice"
              rules={[{required: true, message: "Montant fixe requis"}]}
            >
              <InputNumber min={0} step={1} disabled={loading} style={{width: "100%"}} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Montant surface (€/m²)"
              name="surfacePrice"
              rules={[{required: true, message: "Montant surface requise"}]}
            >
              <InputNumber min={0} step={1} disabled={loading} style={{width: "100%"}} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Poids (kg/m²)" name="weight" rules={[{required: true, message: "Poids requis"}]}>
              <InputNumber min={0} step={0.1} disabled={loading} style={{width: "100%"}} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Transparence (%)"
              name="transparency"
              rules={[{required: true, message: "Transparence requise"}]}
            >
              <Slider min={0} step={1} max={100} disabled={loading} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label="Délai de fabrication (j)"
          name="manufacturingTime"
          rules={[{required: true, message: "Délai de fabrication requis"}]}
        >
          <InputNumber min={0} step={1} disabled={loading} style={{width: "100%"}} />
        </Form.Item>
        <SelectFixationsFormItem />
        <SelectShapesFormItem />
        <SelectDimensionsFormItem />
        <SelectDiscountsFormItem />
        <SelectBadgesFormItem />
      </Form>
    </Modal>
  );
};

export const SelectMaterialsFormItem: FC = () => {
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    $material
      .get()
      .then(setMaterials)
      .then(() => setLoading(false));
  }, []);

  return (
    <Form.Item label="Materials" name="materialIds" hasFeedback>
      <Select mode="multiple" disabled={loading}>
        {materials.map(({id, title}) => (
          <Select.Option key={id} value={id}>
            {title}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default EditMaterialForm;
