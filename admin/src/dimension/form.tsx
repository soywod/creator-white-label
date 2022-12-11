import React, {FC, useEffect, useRef, useState} from "react";
import Form, {FormInstance} from "antd/lib/form";
import Input from "antd/lib/input";
import InputNumber, {InputNumberProps} from "antd/lib/input-number";
import Modal from "antd/lib/modal";
import Select from "antd/lib/select";

import Dimension from "./model";
import $dimension from "./service";

type EditDimensionFormProps = {
  dimension?: Dimension;
  onClose: (fetchNeeded: boolean) => void;
};

const numberFmt: InputNumberProps["formatter"] = val => {
  if (val === "0") return "";
  if (typeof val === "string") return val;
  if (val === undefined) return "";
  if (val === 0) return "";
  if (isNaN(val)) return "";
  return String(val);
};

export const EditDimensionForm: FC<EditDimensionFormProps> = ({dimension, onClose: close}) => {
  const [loading, setLoading] = useState(false);
  const form = useRef<FormInstance>(null);
  const createMode = Boolean(dimension && dimension.id === 0);

  function submit() {
    if (form.current) {
      form.current.submit();
    }
  }

  function save(dimension: Dimension) {
    setLoading(true);
    $dimension
      .set(dimension)
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
      title={createMode ? "Ajouter des dimensions" : "Modifier des dimensions"}
      visible={dimension !== undefined}
    >
      <Form ref={form} onFinish={save} layout="vertical" initialValues={dimension}>
        <Form.Item hidden name="id">
          <Input />
        </Form.Item>
        <Form.Item hidden name="pos">
          <Input />
        </Form.Item>
        <Form.Item label="Nom" name="name" hasFeedback rules={[{required: true, message: "Nom requis"}]}>
          <Input autoFocus disabled={loading} onPressEnter={submit} />
        </Form.Item>
        <Form.Item
          label="Longueur (mm)"
          name="width"
          hasFeedback
          rules={[
            {required: true, message: "Longueur requise"},
            {validator: async (_, val) => val < 1 && Promise.reject(new Error("Longueur trop petite"))},
          ]}
        >
          <InputNumber
            step={1}
            formatter={numberFmt}
            onPressEnter={submit}
            disabled={loading}
            style={{width: "100%"}}
          />
        </Form.Item>
        <Form.Item
          label="Hauteur (mm)"
          name="height"
          hasFeedback
          rules={[
            {required: true, message: "Hauteur requise"},
            {validator: async (_, val) => val < 1 && Promise.reject(new Error("Hauteur trop petite"))},
          ]}
        >
          <InputNumber
            step={1}
            formatter={numberFmt}
            onPressEnter={submit}
            disabled={loading}
            style={{width: "100%"}}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const SelectDimensionsFormItem: FC = () => {
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);

  useEffect(() => {
    $dimension
      .get()
      .then(setDimensions)
      .then(() => setLoading(false));
  }, []);

  return (
    <Form.Item label="Dimensions" name="dimensionIds" hasFeedback>
      <Select mode="multiple" disabled={loading}>
        {dimensions.map(({id, name}) => (
          <Select.Option key={id} value={id}>
            {name}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default EditDimensionForm;
