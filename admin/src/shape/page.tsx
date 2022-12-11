import React, {FC, useEffect, useState} from "react";
import {PlusOutlined, SettingOutlined, FolderOutlined, ArrowLeftOutlined, HomeOutlined} from "@ant-design/icons";
import Breadcrumb from "antd/lib/breadcrumb";
import Button from "antd/lib/button";
import Card from "antd/lib/card";
import Col from "antd/lib/col";
import Divider from "antd/lib/divider";
import Row from "antd/lib/row";
import Spin from "antd/lib/spin";
import Tag from "antd/lib/tag";
import Typography from "antd/lib/typography";

import {Folder, EditFolderForm, isFolder} from "../_shared/folder";
import Shape from "./model";
import EditShapeForm from "./form";
import $shape from "./service";

const FOLDER_CATEGORY = "shape";

export const ShapePage: FC = () => {
  const [loading, setLoading] = useState(true);
  const [shapesTree, setShapesTree] = useState<Folder<Shape>>(new Folder("shape"));
  const [path, setPath] = useState<Folder<Shape>[]>([shapesTree]);
  const [editedShape, editShape] = useState<Shape | undefined>();
  const [editedFolder, editFolder] = useState<Folder<Shape> | undefined>();
  const [draggedShape, dragShape] = useState<Shape | undefined>();
  const currFolder = path.length === 0 ? shapesTree : path[path.length - 1];
  const currFolderId = currFolder.id === 0 ? null : currFolder.id;

  useEffect(() => {
    $shape
      .getFolded()
      .then(tree => {
        setShapesTree(tree);
        setPath([tree]);
      })
      .finally(() => setLoading(false));
  }, []);

  function unstackPath() {
    setPath(path => {
      if (path.length === 1) return [shapesTree];
      path.pop();
      return [...path];
    });
  }

  function stackPath(folder: Folder<Shape>) {
    return () => setPath(path => [...path, folder]);
  }

  function truncatePath(idx: number) {
    return () => setPath(path => (idx === 0 ? [shapesTree] : path.slice(0, idx + 1)));
  }

  function handleEditFormClose(fetchNeeded: boolean) {
    editShape(undefined);
    editFolder(undefined);

    if (fetchNeeded) {
      setLoading(true);
      $shape
        .getFolded()
        .then(tree => {
          setShapesTree(tree);
          setPath(path => {
            let newPath = [tree];
            let children = tree.children;

            for (const folder of path.slice(1)) {
              const matchingChild = children.find(node => isFolder(node) && node.folder.id === folder.id);
              if (!isFolder(matchingChild)) break;
              newPath.push(matchingChild.folder);
              children = matchingChild.folder.children;
            }

            return newPath;
          });
        })
        .then(() => setLoading(false));
    }
  }

  function dragOver(evt: React.DragEvent<HTMLButtonElement>) {
    evt.preventDefault();
  }

  function drop(folderId: number, shape?: Shape) {
    return (evt: React.DragEvent<HTMLButtonElement>) => {
      if (shape) {
        evt.preventDefault();
        setLoading(true);
        $shape.set({...shape, folderId}).then(() => handleEditFormClose(true));
      }
    };
  }

  return (
    <>
      <Typography.Title level={1} style={{display: "flex", alignItems: "center", marginBottom: 0}}>
        <span>Formes</span>
        <span style={{flex: 1, padding: "0 1rem"}}>{loading && <Spin spinning />}</span>
        <Button type="default" size="small" onClick={() => editFolder(new Folder("shape", currFolderId))}>
          <PlusOutlined />
          Dossier
        </Button>
        <Button
          type="primary"
          size="small"
          onClick={() => editShape(new Shape(currFolderId))}
          style={{marginLeft: "1rem"}}
        >
          <PlusOutlined />
          Forme
        </Button>
      </Typography.Title>
      <Row style={{marginBottom: "1rem"}}>
        <Col>
          <Button size="small" type="link" onClick={unstackPath}>
            <ArrowLeftOutlined />
          </Button>
        </Col>
        <Col>
          <Breadcrumb>
            {path.map((folder, idx) => (
              <Breadcrumb.Item key={idx}>
                <Button type="link" size="small" onClick={truncatePath(idx)}>
                  {folder.id ? folder.name : <HomeOutlined />}
                </Button>
                {folder.id > 0 && (
                  <Button type="link" size="small" onClick={() => editFolder(folder)} style={{marginLeft: "-0.5rem"}}>
                    <SettingOutlined />
                  </Button>
                )}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        {currFolder.children
          .reduce<Folder<Shape>[]>((folders, node) => {
            if (isFolder(node)) folders.push(node.folder);
            return folders;
          }, [])
          .map(folder => (
            <Col key={folder.id} sm={4} style={{marginBottom: 16}}>
              <Button
                size="large"
                onClick={stackPath(folder)}
                onDragOver={dragOver}
                onDrop={drop(folder.id, draggedShape)}
                style={{width: "100%"}}
              >
                <FolderOutlined />
                {folder.name}
              </Button>
            </Col>
          ))}
      </Row>
      <Divider style={{margin: "0.5rem 0 1.5rem 0"}} />
      <Row gutter={[16, 16]}>
        {currFolder.children
          .reduce<Shape[]>((folders, node) => {
            if (!isFolder(node)) folders.push(node.item);
            return folders;
          }, [])
          .map(shape => (
            <Col key={shape.id} sm={4}>
              <Card
                draggable
                onDragStart={() => dragShape(shape)}
                onDragEnd={() => dragShape(undefined)}
                hoverable
                cover={
                  <img
                    draggable={false}
                    alt="Aperçu"
                    src={`${process.env.REACT_APP_API_URL}/public/${shape.url}`}
                    style={{padding: "1rem"}}
                  />
                }
                onClick={() => editShape(shape)}
                bodyStyle={{padding: "0 1rem 0.75rem 1rem"}}
                style={{borderColor: "#d9d9d9", height: "100%"}}
              >
                {shape.tags.split(",").map(
                  tag =>
                    tag && (
                      <Tag key={tag} style={{marginBottom: "0.25rem"}}>
                        {tag}
                      </Tag>
                    ),
                )}
              </Card>
            </Col>
          ))}
      </Row>
      <EditFolderForm folder={editedFolder} category={FOLDER_CATEGORY} onClose={handleEditFormClose} />
      <EditShapeForm shape={editedShape} onClose={handleEditFormClose} />
    </>
  );
};

export default ShapePage;
