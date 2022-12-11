import React, {FC, useCallback, useEffect, useState} from "react";
import {useHistory} from "react-router";
import {PlusOutlined, DeleteOutlined, EditOutlined} from "@ant-design/icons";
import Button from "antd/lib/button";
import Popconfirm from "antd/lib/popconfirm";
import Table from "antd/lib/table";
import Typography from "antd/lib/typography";

import $fixation from "./service";
import Fixation from "./model";

export const FixationListPage: FC = () => {
  const [loading, setLoading] = useState(true);
  const [fixations, setFixations] = useState<Fixation[]>([]);
  const history = useHistory()

  const fetchFixations = useCallback(() => {
    $fixation
      .get()
      .then(setFixations)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFixations();
  }, [fetchFixations]);

  function deleteFixation(id: number) {
    setLoading(true)
    $fixation.del(id).then(() => $fixation.get()).then(fetchFixations)
  }

  return (
    <>
      <Typography.Title level={1} style={{display: "flex", alignItems: "center"}}>
        Fixations
      </Typography.Title>
      <Table
        bordered
        dataSource={fixations}
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
                <Button type="primary" size="small" onClick={() => history.push(`/fixation/edit`)}>
                  <PlusOutlined />
                  Ajouter
                </Button>
              </>
            ),
            dataIndex: "actions",
            align: "center",
            width: "10rem",
            render: (_, fixation) => (
              <>
                <Button type="link" onClick={() => history.push(`/fixation/edit/${fixation.id}`)}>
                  <EditOutlined />
                </Button>
                <Popconfirm
                  title="Êtes-vous sûr de vouloir supprimer cette fixation ?"
                  placement="topRight"
                  okText="Oui"
                  cancelText="Non"
                  onConfirm={() => deleteFixation(fixation.id)}
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
    </>
  );
};

export default FixationListPage;
