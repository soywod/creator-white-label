import React, {FC, useEffect, useState, useRef} from "react";
import Form, {FormInstance} from "antd/lib/form";
import Input from "antd/lib/input";
import InputNumber, {InputNumberProps} from "antd/lib/input-number";
import Modal from "antd/lib/modal";
import Select from "antd/lib/select";

import $discount from "./service";
import Discount from "./model";

type EditDiscountFormProps = {
  discount?: Discount;
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

export const EditDiscountForm: FC<EditDiscountFormProps> = ({discount, onClose: close}) => {
  const [loading, setLoading] = useState(false);
  const form = useRef<FormInstance>(null);
  const createMode = Boolean(discount && discount.id === 0);

  function submit() {
    if (form.current) {
      form.current.submit();
    }
  }

  function save(discount: Discount) {
    setLoading(true);
    $discount
      .set(discount)
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
      title={createMode ? "Ajouter une remise" : "Modifier une remise"}
      visible={discount !== undefined}
    >
      <Form ref={form} onFinish={save} layout="vertical" initialValues={discount}>
        <Form.Item hidden name="id">
          <Input onPressEnter={submit} />
        </Form.Item>
        <Form.Item label="Montant (%)" name="amount" hasFeedback rules={[{required: true, message: "Montant requis"}]}>
          <InputNumber step={1} disabled={loading} style={{width: "100%"}} formatter={numberFmt} />
        </Form.Item>
        <Form.Item label="Quantité" name="quantity" hasFeedback rules={[{required: true, message: "Quantité requise"}]}>
          <InputNumber step={1} disabled={loading} style={{width: "100%"}} formatter={numberFmt} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const SelectDiscountsFormItem: FC = () => {
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  useEffect(() => {
    $discount
      .get()
      .then(setDiscounts)
      .then(() => setLoading(false));
  }, []);

  return (
    <Form.Item label="Remises" name="discountIds" hasFeedback>
      <Select mode="multiple" disabled={loading}>
        {discounts.map(({id, quantity, amount}) => (
          <Select.Option key={id} value={id}>
            {amount}% ({quantity} ex.)
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default EditDiscountForm;
