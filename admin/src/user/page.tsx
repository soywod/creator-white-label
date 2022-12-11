import React, {FC, useCallback, useEffect, useState} from "react";
import Typography from "antd/lib/typography";
import Table from "antd/lib/table";
import Button from "antd/lib/button";
import Popconfirm from "antd/lib/popconfirm";
import {PlusOutlined, DeleteOutlined, EditOutlined} from "@ant-design/icons";

import User from "./model";
import $user from "./service";
import EditUserForm from "./form";

export const UserPage: FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [editedUser, editUser] = useState<User | undefined>();

  const fetchUsers = useCallback(() => {
    $user
      .get()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [])

  function deleteUser(id: number) {
    setLoading(true)
    $user.del(id).then($user.get).then(fetchUsers)
  }

  function handleEditUserFormClose(fetchNeeded: boolean) {
    editUser(undefined);

    if (fetchNeeded) {
      setLoading(true)
      fetchUsers()
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers]);

  return (
    <>
      <Typography.Title level={1}>Utilisateurs</Typography.Title>
      <Table
        bordered
        dataSource={users}
        loading={loading}
        pagination={false}
        rowKey="id"
        columns={[
          {
            title: <strong>Identifiant</strong>,
            dataIndex: "username",
          },
          {
            title: () => (
              <>
                <Button type="primary" size="small" onClick={() => editUser(new User())}>
                  <PlusOutlined />
                  Ajouter
                </Button>
              </>
            ),
            dataIndex: "actions",
            align: "center",
            width: "10rem",
            render: (_, user) => (
              <>
                <Button type="link" onClick={() => editUser(user)}>
                  <EditOutlined />
                </Button>
                <Popconfirm
                  title="Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
                  placement="topRight"
                  okText="Oui"
                  cancelText="Non"
                  onConfirm={() => deleteUser(user.id)}
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
      <EditUserForm user={editedUser} onClose={handleEditUserFormClose} />
    </>
  );
};

export default UserPage;
