import React, {FC, useCallback, useEffect, useState} from "react";
import Typography from "antd/lib/typography";
import Table from "antd/lib/table";
import Button from "antd/lib/button";
import Popconfirm from "antd/lib/popconfirm";
import {PlusOutlined, DeleteOutlined, EditOutlined} from "@ant-design/icons";

import $app from "./service";
import {Application, emptyApp} from "./model";
import EditAppForm from "./form";

export const AppPage: FC = () => {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<Application[]>([]);
  const [editedApp, editApp] = useState<Application | undefined>();

  const fetchApps = useCallback(() => {
    $app
      .get()
      .then(setApps)
      .finally(() => setLoading(false));
  }, [])

  function handleEditAppFormClose(fetchNeeded: boolean) {
    editApp(undefined);

    if (fetchNeeded) {
      setLoading(true)
      fetchApps()
    }
  }

  useEffect(() => {
    fetchApps()
  }, [fetchApps]);

  return (
    <>
      <Typography.Title level={1}>Applications</Typography.Title>
      <Table
        bordered
        dataSource={apps}
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
                <Button type="primary" size="small" onClick={() => editApp(emptyApp())}>
                  <PlusOutlined />
                  Ajouter
                </Button>
              </>
            ),
            dataIndex: "actions",
            align: "center",
            width: "10rem",
            render: (_, app) => (
              <>
                <Button type="link" onClick={() => editApp(app)}>
                  <EditOutlined />
                </Button>
                <Popconfirm
                  title="Êtes-vous sûr de vouloir supprimer cette application ?"
                  placement="topRight"
                  okText="Oui"
                  cancelText="Non"
                  onConfirm={() => $app.del(app.id)}
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
      <EditAppForm app={editedApp} onClose={handleEditAppFormClose} />
    </>
  );
};

export default AppPage;
