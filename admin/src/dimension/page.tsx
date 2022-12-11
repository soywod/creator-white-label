import React, {FC, useCallback, useEffect, useRef, useState} from "react";
import {DndProvider, useDrag, useDrop} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import Button from "antd/lib/button";
import Popconfirm from "antd/lib/popconfirm";
import Table from "antd/lib/table";
import Typography from "antd/lib/typography";
import notification from "antd/lib/notification";
import {PlusOutlined, DeleteOutlined, EditOutlined} from "@ant-design/icons";
import update from "immutability-helper";

import Dimension from "./model";
import $dimension from "./service";
import EditDimensionForm from "./form";

type DragableBodyRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
};

const DragableBodyRow: FC<DragableBodyRowProps> = ({index, moveRow, style, ...restProps}) => {
  const ref = useRef<HTMLTableRowElement>(null);
  const [{isOver}, drop] = useDrop<any, any, any>({
    accept: "DragableBodyRow",
    collect: monitor => {
      const {index: dragIndex} = (monitor.getItem() as any) || {};
      if (dragIndex === index) {
        return {};
      }
      return {
        isOver: monitor.isOver(),
      };
    },
    drop: item => {
      console.log("drop");
      moveRow(item.index, index);
    },
  });

  const [, drag] = useDrag({
    type: "DragableBodyRow",
    item: {index},
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drop(drag(ref));

  return <tr ref={ref} style={{cursor: "move", background: isOver ? "#feffe6" : "inherit"}} {...restProps} />;
};

export const DimensionPage: FC = () => {
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [editedDimension, editDimension] = useState<Dimension | undefined>();

  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setLoading(true);
      const dragRow = dimensions[dragIndex];
      setDimensions(dimensions => {
        let nextDimensions = update(dimensions, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRow],
          ],
        });

        Promise.all(nextDimensions.map((d, pos) => $dimension.set({...d, pos}, false)))
          .catch(err => {
            notification.error({message: "Erreur", description: err.message});
          })
          .finally(() => setLoading(false));

        return nextDimensions;
      });
    },
    [dimensions],
  );

  const fetchDimensions = useCallback(() => {
    $dimension
      .get()
      .then(setDimensions)
      .finally(() => setLoading(false));
  }, []);

  function deleteDimension(id: number) {
    setLoading(true);
    $dimension.del(id).then($dimension.get).then(fetchDimensions);
  }

  function handleEditDimensionFormClose(fetchNeeded: boolean) {
    editDimension(undefined);

    if (fetchNeeded) {
      setLoading(true);
      fetchDimensions();
    }
  }

  useEffect(() => {
    fetchDimensions();
  }, [fetchDimensions]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Typography.Title level={1}>Dimensions</Typography.Title>
      <Table
        bordered
        dataSource={dimensions}
        loading={loading}
        pagination={false}
        rowKey="id"
        // @ts-ignore
        onRow={(_, index) => ({
          index,
          moveRow,
        })}
        components={{
          body: {
            row: DragableBodyRow,
          },
        }}
        columns={[
          {
            title: <strong>Nom</strong>,
            dataIndex: "name",
          },
          {
            title: <strong>Longueur (mm)</strong>,
            dataIndex: "width",
          },
          {
            title: <strong>Hauteur (mm)</strong>,
            dataIndex: "height",
          },
          {
            title: () => (
              <>
                <Button type="primary" size="small" onClick={() => editDimension(new Dimension())}>
                  <PlusOutlined />
                  Ajouter
                </Button>
              </>
            ),
            dataIndex: "actions",
            align: "center",
            width: "10rem",
            render: (_, dimension) => (
              <>
                <Button type="link" onClick={() => editDimension(dimension)}>
                  <EditOutlined />
                </Button>
                <Popconfirm
                  title="Êtes-vous sûr de vouloir supprimer ces dimensions ?"
                  placement="topRight"
                  okText="Oui"
                  cancelText="Non"
                  onConfirm={() => deleteDimension(dimension.id)}
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
      <EditDimensionForm dimension={editedDimension} onClose={handleEditDimensionFormClose} />
    </DndProvider>
  );
};

export default DimensionPage;
