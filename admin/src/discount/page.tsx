import React, {FC, useCallback, useEffect, useState} from "react";
import Typography from "antd/lib/typography";
import Table from "antd/lib/table";
import Button from "antd/lib/button";
import Popconfirm from "antd/lib/popconfirm";
import {PlusOutlined, DeleteOutlined, EditOutlined} from "@ant-design/icons";

import Discount from "./model";
import $discount from "./service";
import EditDiscountForm from "./form";

export const DiscountPage: FC = () => {
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [editedDiscount, editDiscount] = useState<Discount | undefined>();

  const fetchDiscounts = useCallback(() => {
    $discount
      .get()
      .then(setDiscounts)
      .finally(() => setLoading(false));
  }, [])

  function handleEditDiscountFormClose(fetchNeeded: boolean) {
    editDiscount(undefined);

    if (fetchNeeded) {
      setLoading(true)
      fetchDiscounts()
    }
  }

  useEffect(() => {
    fetchDiscounts()
  }, [fetchDiscounts]);

  function deleteDiscount(id: number) {
    setLoading(true)
    $discount.del(id).then(() => $discount.get()).then(fetchDiscounts)
  }

  return (
    <>
      <Typography.Title level={1}>Remises</Typography.Title>
      <Table
        bordered
        dataSource={discounts}
        loading={loading}
        pagination={false}
        rowKey="id"
        columns={[
          {
            title: <strong>Montant (%)</strong>,
            dataIndex: "amount",
          },
          {
            title: <strong>Quantité</strong>,
            dataIndex: "quantity",
          },
          {
            title: () => (
              <>
                <Button type="primary" size="small" onClick={() => editDiscount(new Discount())}>
                  <PlusOutlined />
                  Ajouter
                </Button>
              </>
            ),
            dataIndex: "actions",
            align: "center",
            width: "10rem",
            render: (_, discount) => (
              <>
                <Button type="link" onClick={() => editDiscount(discount)}>
                  <EditOutlined />
                </Button>
                <Popconfirm
                  title="Êtes-vous sûr de vouloir supprimer cette remise ?"
                  placement="topRight"
                  okText="Oui"
                  cancelText="Non"
                  onConfirm={() => deleteDiscount(discount.id)}
                >
                  <Button type="link" danger>
                    <DeleteOutlined />
                  </Button>
                </Popconfirm>
              </>
            ),
          },
        ]}
      />
      <EditDiscountForm discount={editedDiscount} onClose={handleEditDiscountFormClose} />
    </>
  );
};

export default DiscountPage;
