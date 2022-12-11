import React, {FC, useEffect, useState} from "react";
import Form from "antd/lib/form";
import Select from "antd/lib/select";

import $fixation from "./service";
import Fixation from "./model";

export const SelectFixationsFormItem: FC = () => {
  const [loading, setLoading] = useState(true);
  const [fixations, setFixations] = useState<Fixation[]>([]);

  useEffect(() => {
    $fixation
      .get()
      .then(setFixations)
      .then(() => setLoading(false));
  }, []);

  return (
    <Form.Item label="Fixations" name="fixationIds" hasFeedback>
      <Select mode="multiple" disabled={loading}>
        {fixations.map(({id, name}) => (
          <Select.Option key={id} value={id}>
            {name}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
};
