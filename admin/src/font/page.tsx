import React, {FC, useCallback, useEffect, useState} from "react";
import Typography from "antd/lib/typography";
import Table from "antd/lib/table";
import Button from "antd/lib/button";
import Popconfirm from "antd/lib/popconfirm";
import {PlusOutlined, DeleteOutlined, EditOutlined} from "@ant-design/icons";

import Font from "./model";
import $font from "./service";
import EditFontForm from "./form";

export const FontPage: FC = () => {
  const [loading, setLoading] = useState(true);
  const [fonts, setFonts] = useState<Font[]>([]);
  const [editedFont, editFont] = useState<Font | undefined>();

  const fetchFonts = useCallback(() => {
    $font
      .get()
      .then(setFonts)
      .finally(() => setLoading(false));
  }, [])

  function deleteFont(id: number) {
    setLoading(true)
    $font.del(id).then($font.get).then(fetchFonts)
  }

  function handleEditFontFormClose(fetchNeeded: boolean) {
    editFont(undefined);

    if (fetchNeeded) {
      setLoading(true)
      fetchFonts()
    }
  }

  useEffect(() => {
    fetchFonts()
  }, [fetchFonts]);

  return (
    <>
      <Typography.Title level={1}>Polices</Typography.Title>
      <Table
        bordered
        dataSource={fonts}
        loading={loading}
        pagination={false}
        rowKey="id"
        columns={[
          {
            title: <strong>Nom</strong>,
            dataIndex: "name",
          },
          {
            title: () => (
              <>
                <Button type="primary" size="small" onClick={() => editFont(new Font())}>
                  <PlusOutlined />
                  Ajouter
                </Button>
              </>
            ),
            dataIndex: "actions",
            align: "center",
            width: "10rem",
            render: (_, font) => (
              <>
                <Button type="link" onClick={() => editFont(font)}>
                  <EditOutlined />
                </Button>
                <Popconfirm
                  title="Êtes-vous sûr de vouloir supprimer cette police ?"
                  placement="topRight"
                  okText="Oui"
                  cancelText="Non"
                  onConfirm={() => deleteFont(font.id)}
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
      <EditFontForm font={editedFont} onClose={handleEditFontFormClose} />
    </>
  );
};

export default FontPage;
