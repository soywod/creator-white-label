import React, {FC, useCallback, useEffect, useState} from "react";
import Typography from "antd/lib/typography";
import Table from "antd/lib/table";
import Button from "antd/lib/button";
import Popconfirm from "antd/lib/popconfirm";
import {PlusOutlined, DeleteOutlined, EditOutlined} from "@ant-design/icons";

import Material from "./model";
import $material from "./service";
import EditMaterialForm from "./form";
import Badge from "./badge/model";
import $badge from "./badge/service";
import EditBadgeForm from "./badge/form";

export const MaterialPage: FC = () => {
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [editedMaterial, editMaterial] = useState<Material | undefined>();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [editedBadge, editBadge] = useState<Badge | undefined>();

  const fetchMaterials = useCallback(() => {
    $material
      .get()
      .then(setMaterials)
      .finally(() => setLoading(false));
  }, []);

  function deleteMaterial(id: number) {
    setLoading(true);
    $material.del(id).then($material.get).then(fetchMaterials);
  }

  function handleEditMaterialFormClose(fetchNeeded: boolean) {
    editMaterial(undefined);

    if (fetchNeeded) {
      setLoading(true);
      fetchMaterials();
    }
  }

  const fetchBadges = useCallback(() => {
    $badge
      .get()
      .then(setBadges)
      .finally(() => setLoading(false));
  }, []);

  function deleteBadge(id: number) {
    setLoading(true);
    $badge.del(id).then($badge.get).then(fetchBadges);
  }

  function handleEditBadgeFormClose(fetchNeeded: boolean) {
    editBadge(undefined);

    if (fetchNeeded) {
      setLoading(true);
      fetchBadges();
    }
  }

  useEffect(() => {
    fetchMaterials();
    fetchBadges();
  }, [fetchMaterials, fetchBadges]);

  return (
    <>
      <Typography.Title level={1}>Matériaux</Typography.Title>
      <Table
        bordered
        dataSource={materials}
        loading={loading}
        pagination={false}
        rowKey="id"
        columns={[
          {
            title: <strong>Aperçu</strong>,
            dataIndex: "preview",
            render: (_, material) => (
              <img
                src={`${process.env.REACT_APP_API_URL}/public/${material.preview}`}
                alt={material.title}
                height={100}
              />
            ),
          },
          {
            title: <strong>Nom</strong>,
            dataIndex: "title",
            render: (_, material) => (
              <>
                {material.title} (<code>#{material.id}</code>)
              </>
            ),
          },
          {
            title: () => (
              <>
                <Button type="primary" size="small" onClick={() => editMaterial(new Material())}>
                  <PlusOutlined />
                  Ajouter
                </Button>
              </>
            ),
            dataIndex: "actions",
            align: "center",
            width: "10rem",
            render: (_, material) => (
              <>
                <Button type="link" onClick={() => editMaterial(material)}>
                  <EditOutlined />
                </Button>
                <Popconfirm
                  title="Êtes-vous sûr de vouloir supprimer ce matériau ?"
                  placement="topRight"
                  okText="Oui"
                  cancelText="Non"
                  onConfirm={() => deleteMaterial(material.id)}
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
      <br />
      <Typography.Title level={2}>Badges</Typography.Title>
      <Table
        bordered
        dataSource={badges}
        loading={loading}
        pagination={false}
        rowKey="id"
        columns={[
          {
            title: <strong>Icône</strong>,
            dataIndex: "iconUrl",
            render: (_, badge) => (
              <img src={`${process.env.REACT_APP_API_URL}/public/${badge.iconUrl}`} alt={badge.name} height={64} />
            ),
          },
          {
            title: <strong>Nom</strong>,
            dataIndex: "name",
          },
          {
            title: () => (
              <>
                <Button type="primary" size="small" onClick={() => editBadge(new Badge())}>
                  <PlusOutlined />
                  Ajouter
                </Button>
              </>
            ),
            dataIndex: "actions",
            align: "center",
            width: "10rem",
            render: (_, badge) => (
              <>
                <Button type="link" onClick={() => editBadge(badge)}>
                  <EditOutlined />
                </Button>
                <Popconfirm
                  title="Êtes-vous sûr de vouloir supprimer ce badge ?"
                  placement="topRight"
                  okText="Oui"
                  cancelText="Non"
                  onConfirm={() => deleteBadge(badge.id)}
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
      <EditMaterialForm material={editedMaterial} onClose={handleEditMaterialFormClose} />
      <EditBadgeForm badge={editedBadge} onClose={handleEditBadgeFormClose} />
    </>
  );
};

export default MaterialPage;
