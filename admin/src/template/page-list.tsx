import React, {FC, useEffect, useState} from "react";
import {useLocation} from "react-router";
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
import Template from "./model";
import EditTemplateForm from "./form";
import $template from "./service";
import {decodePath, encodePath} from "./path-utils";
import {useHistory} from "react-router-dom";

const FOLDER_CATEGORY = "template";

export const TemplateListPage: FC = () => {
  const history = useHistory();
  const {search} = useLocation();
  const [loading, setLoading] = useState(true);
  const [templatesTree, setTemplatesTree] = useState<Folder<Template>>(new Folder(FOLDER_CATEGORY));
  const [path, setPath] = useState<Folder<Template>[]>([templatesTree]);
  const [editedTemplate, editTemplate] = useState<Template | undefined>();
  const [editedFolder, editFolder] = useState<Folder<Template> | undefined>();
  const [draggedTemplate, dragTemplate] = useState<Template | undefined>();
  const currFolder = path.length === 0 ? templatesTree : path[path.length - 1];
  const currFolderId = currFolder.id === 0 ? null : currFolder.id;
  const [encodedPath, setEncodedPath] = useState<string | null>(null);

  useEffect(() => {
    $template
      .getFolded()
      .then(tree => setTemplatesTree(tree))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (encodedPath) return;
    const nextEncodedPath = new URLSearchParams(search).get("path");
    if (nextEncodedPath) {
      history.replace({search: undefined});
      setEncodedPath(nextEncodedPath);
    }
  }, [history, encodedPath]);

  useEffect(() => {
    setPath(decodePath(templatesTree, encodedPath));
  }, [templatesTree, encodedPath]);

  function unstackPath() {
    setPath(path => {
      if (path.length === 1) return [templatesTree];
      path.pop();
      return [...path];
    });
  }

  function stackPath(folder: Folder<Template>) {
    return () => setPath(path => [...path, folder]);
  }

  function truncatePath(idx: number) {
    return () => setPath(path => (idx === 0 ? [templatesTree] : path.slice(0, idx + 1)));
  }

  function handleEditFormClose(fetchNeeded: boolean) {
    editTemplate(undefined);
    editFolder(undefined);

    if (fetchNeeded) {
      setLoading(true);
      $template
        .getFolded()
        .then(tree => {
          setTemplatesTree(tree);
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

  function drop(folderId: number, template?: Template) {
    return (evt: React.DragEvent<HTMLButtonElement>) => {
      if (template) {
        evt.preventDefault();
        setLoading(true);
        $template.set({...template, folderId}).then(() => handleEditFormClose(true));
      }
    };
  }

  return (
    <>
      <Typography.Title level={1} style={{display: "flex", alignItems: "center", marginBottom: 0}}>
        <span>Templates</span>
        <span style={{flex: 1, padding: "0 1rem"}}>{loading && <Spin spinning />}</span>
        <Button type="default" size="small" onClick={() => editFolder(new Folder("template", currFolderId))}>
          <PlusOutlined />
          Dossier
        </Button>
        <Button
          type="primary"
          size="small"
          onClick={() => editTemplate(new Template(currFolderId))}
          style={{marginLeft: "1rem"}}
        >
          <PlusOutlined />
          Template
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
          .reduce<Folder<Template>[]>((folders, node) => {
            if (isFolder(node)) folders.push(node.folder);
            return folders;
          }, [])
          .map(folder => (
            <Col key={folder.id} sm={4} style={{marginBottom: 16}}>
              <Button
                size="large"
                onClick={stackPath(folder)}
                onDragOver={dragOver}
                onDrop={drop(folder.id, draggedTemplate)}
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
          .reduce<Template[]>((folders, node) => {
            if (!isFolder(node)) folders.push(node.item);
            return folders;
          }, [])
          .map(template => (
            <Col key={template.id} sm={4}>
              <Card
                draggable
                onDragStart={() => dragTemplate(template)}
                onDragEnd={() => dragTemplate(undefined)}
                hoverable
                cover={
                  <img
                    draggable={false}
                    alt="Aperçu"
                    src={`${process.env.REACT_APP_API_URL}/public/${template.previewUrl}`}
                    style={{padding: "1rem"}}
                  />
                }
                onClick={() => editTemplate(template)}
                bodyStyle={{padding: "0 1rem 0.75rem 1rem"}}
                style={{borderColor: "#d9d9d9", height: "100%"}}
              >
                <h3>{template.name}</h3>
                {template.tags.split(",").map(
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
      <EditTemplateForm template={editedTemplate} encodedPath={encodePath(path)} onClose={handleEditFormClose} />
    </>
  );
};

export default TemplateListPage;
