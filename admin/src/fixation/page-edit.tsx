import React, {FC, Fragment, useEffect, useRef, useState} from "react";
import {useParams} from "react-router";
import {UploadOutlined, SaveFilled, PlusOutlined, DeleteOutlined} from "@ant-design/icons";
import Button from "antd/lib/button";
import Checkbox from "antd/lib/checkbox";
import Col from "antd/lib/col";
import Form, {FormInstance} from "antd/lib/form";
import Image from "antd/lib/image";
import Input from "antd/lib/input";
import InputNumber from "antd/lib/input-number";
import Row from "antd/lib/row";
import Spin from "antd/lib/spin";
import Typography from "antd/lib/typography";
import Upload from "antd/lib/upload";

import $fixation from "./service";
import tokenStorage from "../auth/token-storage";
import {FixationCondition} from "./model";
import Tabs from "antd/lib/tabs";
import Shape from "../shape/model";
import Card from "antd/lib/card";

class FixationForm {
  id: number = 0;
  name: string = "";
  previewUrl: string = "";
  iconUrl: string = "";
  videoUrl: string | null = null;
  price: number = 0;
  diameter: number = 0;
  drillDiameter: number = 0;
  conditions: FixationCondition[][] = [];
}

export const FixationEditPage: FC = () => {
  const [loading, setLoading] = useState(true);
  const form = useRef<FormInstance>(null);
  const [fixation, setFixation] = useState<FixationForm>(new FixationForm());
  const [shapes, setShapes] = useState<Shape[]>([]);
  const fixationId = Number(useParams<{id?: string}>().id) || 0;
  const label = fixationId === 0 ? "Ajouter" : "Modifier";

  useEffect(() => {
    $fixation
      .get(fixationId)
      .then(({fixation, conditions, shapes}) => {
        setFixation({
          ...fixation,
          conditions: shapes.map(shape =>
            conditions
              .filter(c => c.shapeId === shape.id)
              .map(c => ({...c, areaMax: c.areaMax / 100, areaMin: c.areaMin / 100})),
          ),
        });
        setShapes(shapes);
      })
      .finally(() => setLoading(false));
  }, [fixationId]);

  function submit() {
    if (form.current) {
      form.current.submit();
    }
  }

  function save(form: FixationForm) {
    const formConditions = form.conditions.flat();
    const formShapesId = formConditions.map(cond => (cond ? cond.shapeId : 0));
    const shapesId = shapes.map(shape => shape.id).filter(shape => !formShapesId.includes(shape));
    const conditions = fixation.conditions
      .flat()
      .filter(c => shapesId.includes(c.shapeId))
      .concat(formConditions.filter(c => c && c.shapeId > 0))
      .map(c => ({...c, id: 0, fixationId: form.id, areaMin: c.areaMin * 100, areaMax: c.areaMax * 100}));

    $fixation.set({...form, conditions}).catch(() => {});
  }

  return (
    <>
      <Typography.Title level={1} style={{display: "flex", alignItems: "center"}}>
        <span>{label} une fixation</span>
        <span style={{flex: 1, padding: "0 1rem"}}>{loading && <Spin spinning />}</span>
      </Typography.Title>
      {!loading && (
        <Form ref={form} onFinish={save} layout="vertical" initialValues={fixation}>
          <Form.Item hidden name="id">
            <Input />
          </Form.Item>
          <Form.Item label="Nom" name="name" rules={[{required: true, message: "Nom requis"}]}>
            <Input autoFocus disabled={loading} onPressEnter={submit} />
          </Form.Item>
          <Form.Item
            label="Aperçu"
            name="previewUrl"
            valuePropName="file"
            rules={[{required: true, message: "Aperçu requis"}]}
          >
            <Upload.Dragger
              maxCount={1}
              action={`${process.env.REACT_APP_API_URL}/upload`}
              method="PUT"
              headers={{Authorization: `Bearer ${tokenStorage.get()}`}}
              withCredentials
              onChange={({file}) =>
                file.status === "done" && form.current?.setFieldsValue({previewUrl: file.response[file.name]})
              }
              listType="picture"
              onRemove={() => form.current?.resetFields(["previewUrl"])}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Glissez l'image dans cette zone</p>
              <p className="ant-upload-hint">L'image doit être au format PNG</p>
            </Upload.Dragger>
          </Form.Item>
          {fixation && fixation.id > 0 && (
            <Image
              src={`${process.env.REACT_APP_API_URL}/public/${fixation.previewUrl}`}
              alt=""
              width={200}
              wrapperStyle={{marginBottom: "1rem"}}
            />
          )}
          <Form.Item
            label="Icône"
            name="iconUrl"
            valuePropName="file"
            rules={[{required: true, message: "Icône requise"}]}
          >
            <Upload.Dragger
              maxCount={1}
              action={`${process.env.REACT_APP_API_URL}/upload`}
              method="PUT"
              headers={{Authorization: `Bearer ${tokenStorage.get()}`}}
              withCredentials
              onChange={({file}) =>
                file.status === "done" && form.current?.setFieldsValue({iconUrl: file.response[file.name]})
              }
              listType="picture"
              onRemove={() => form.current?.resetFields(["iconUrl"])}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Glissez l'image dans cette zone</p>
              <p className="ant-upload-hint">L'image doit être au format SVG</p>
            </Upload.Dragger>
          </Form.Item>
          {fixation && fixation.id > 0 && (
            <Image
              src={`${process.env.REACT_APP_API_URL}/public/${fixation.iconUrl}`}
              alt=""
              width={200}
              wrapperStyle={{marginBottom: "1rem"}}
            />
          )}
          <Form.Item label="ID Vidéo YouTube" name="videoUrl">
            <Input disabled={loading} onPressEnter={submit} />
          </Form.Item>
          <Form.Item label="Prix (€)" name="price" rules={[{required: true, message: "Prix requis"}]}>
            <InputNumber min={0} step={1} disabled={loading} style={{width: "100%"}} />
          </Form.Item>
          <Form.Item label="Diamètre (mm)" name="diameter" rules={[{required: true, message: "Diamètre requis"}]}>
            <InputNumber min={0} step={1} disabled={loading} style={{width: "100%"}} />
          </Form.Item>
          <Form.Item
            label="Diamètre de perçage (mm)"
            name="drillDiameter"
            rules={[{required: true, message: "Diamètre de perçage requis"}]}
          >
            <InputNumber min={0} step={1} disabled={loading} style={{width: "100%"}} />
          </Form.Item>
          <Tabs type="card" size="large" tabBarStyle={{marginBottom: -1}}>
            {shapes.map((shape, shapeIdx) => (
              <Tabs.TabPane
                key={shape.id}
                tabKey={shape.id.toString()}
                tab={
                  <img
                    src={`${process.env.REACT_APP_API_URL}/public/${shape.url}`}
                    style={{width: "1rem"}}
                    alt="Forme"
                  />
                }
              >
                <Form.List name={["conditions", shapeIdx]}>
                  {(fields, {add, remove}) => (
                    <Card>
                      <Row gutter={16} align="middle">
                        {fields.map((field, fieldIdx) => (
                          <Fragment key={field.key}>
                            <Form.Item
                              {...field}
                              hidden
                              name={[field.name, "shapeId"]}
                              fieldKey={[field.fieldKey, "shapeId"]}
                              initialValue={shape.id}
                            >
                              <Input />
                            </Form.Item>
                            <Col xs={1}>
                              <Button
                                type="primary"
                                shape="circle"
                                size="small"
                                danger
                                onClick={() => remove(fieldIdx)}
                              >
                                <DeleteOutlined />
                              </Button>
                            </Col>
                            <Col xs={5}>
                              <Form.Item
                                {...field}
                                label="Superficie min. incl. (cm²)"
                                name={[field.name, "areaMin"]}
                                fieldKey={[field.fieldKey, "areaMin"]}
                              >
                                <InputNumber disabled={loading} onPressEnter={submit} style={{width: "100%"}} />
                              </Form.Item>
                            </Col>
                            <Col xs={5}>
                              <Form.Item
                                {...field}
                                label="Superficie max. excl. (cm²)"
                                name={[field.name, "areaMax"]}
                                fieldKey={[field.fieldKey, "areaMax"]}
                              >
                                <InputNumber disabled={loading} onPressEnter={submit} style={{width: "100%"}} />
                              </Form.Item>
                            </Col>
                            <Col xs={5}>
                              <Form.Item
                                {...field}
                                label="Distance du bord horiz. (mm)"
                                name={[field.name, "paddingH"]}
                                fieldKey={[field.fieldKey, "paddingH"]}
                              >
                                <InputNumber disabled={loading} onPressEnter={submit} style={{width: "100%"}} />
                              </Form.Item>
                            </Col>
                            <Col xs={5}>
                              <Form.Item
                                {...field}
                                label="Distance du bord vert. (mm)"
                                name={[field.name, "paddingV"]}
                                fieldKey={[field.fieldKey, "paddingV"]}
                              >
                                <InputNumber disabled={loading} onPressEnter={submit} style={{width: "100%"}} />
                              </Form.Item>
                            </Col>
                            <Col xs={3}>
                              <Form.Item label="Positions">
                                <div style={{display: "grid", width: "100%", height: "5rem"}}>
                                  <Form.Item
                                    valuePropName="checked"
                                    name={[field.name, "posTl"]}
                                    fieldKey={[field.fieldKey, "posTl"]}
                                    style={{
                                      gridRow: 1,
                                      gridColumn: 1,
                                      justifySelf: "start",
                                      alignSelf: "start",
                                      margin: 0,
                                    }}
                                  >
                                    <Checkbox disabled={loading} />
                                  </Form.Item>
                                  <Form.Item
                                    valuePropName="checked"
                                    name={[field.name, "posTc"]}
                                    fieldKey={[field.fieldKey, "posTc"]}
                                    style={{
                                      gridRow: 1,
                                      gridColumn: 1,
                                      justifySelf: "center",
                                      alignSelf: "start",
                                      margin: 0,
                                    }}
                                  >
                                    <Checkbox disabled={loading} />
                                  </Form.Item>
                                  <Form.Item
                                    valuePropName="checked"
                                    name={[field.name, "posTr"]}
                                    fieldKey={[field.fieldKey, "posTr"]}
                                    style={{
                                      gridRow: 1,
                                      gridColumn: 1,
                                      justifySelf: "right",
                                      alignSelf: "start",
                                      margin: 0,
                                    }}
                                  >
                                    <Checkbox disabled={loading} />
                                  </Form.Item>
                                  <Form.Item
                                    valuePropName="checked"
                                    name={[field.name, "posCl"]}
                                    fieldKey={[field.fieldKey, "posCl"]}
                                    style={{
                                      gridRow: 1,
                                      gridColumn: 1,
                                      justifySelf: "start",
                                      alignSelf: "center",
                                      margin: 0,
                                    }}
                                  >
                                    <Checkbox disabled={loading} />
                                  </Form.Item>
                                  <Form.Item
                                    valuePropName="checked"
                                    name={[field.name, "posCr"]}
                                    fieldKey={[field.fieldKey, "posCr"]}
                                    style={{
                                      gridRow: 1,
                                      gridColumn: 1,
                                      justifySelf: "end",
                                      alignSelf: "center",
                                      margin: 0,
                                    }}
                                  >
                                    <Checkbox disabled={loading} />
                                  </Form.Item>
                                  <Form.Item
                                    valuePropName="checked"
                                    name={[field.name, "posBl"]}
                                    fieldKey={[field.fieldKey, "posBl"]}
                                    style={{
                                      gridRow: 1,
                                      gridColumn: 1,
                                      justifySelf: "start",
                                      alignSelf: "end",
                                      margin: 0,
                                    }}
                                  >
                                    <Checkbox disabled={loading} />
                                  </Form.Item>
                                  <Form.Item
                                    valuePropName="checked"
                                    name={[field.name, "posBc"]}
                                    fieldKey={[field.fieldKey, "posBc"]}
                                    style={{
                                      gridRow: 1,
                                      gridColumn: 1,
                                      justifySelf: "center",
                                      alignSelf: "end",
                                      margin: 0,
                                    }}
                                  >
                                    <Checkbox disabled={loading} />
                                  </Form.Item>
                                  <Form.Item
                                    valuePropName="checked"
                                    name={[field.name, "posBr"]}
                                    fieldKey={[field.fieldKey, "posBr"]}
                                    style={{
                                      gridRow: 1,
                                      gridColumn: 1,
                                      justifySelf: "end",
                                      alignSelf: "end",
                                      margin: 0,
                                    }}
                                  >
                                    <Checkbox disabled={loading} />
                                  </Form.Item>
                                </div>
                              </Form.Item>
                            </Col>
                          </Fragment>
                        ))}
                        <Col xs={24}>
                          <Button
                            type="dashed"
                            onClick={() => add(new FixationCondition(shape.id))}
                            block
                            icon={<PlusOutlined />}
                          >
                            Ajouter condition
                          </Button>
                        </Col>
                      </Row>
                    </Card>
                  )}
                </Form.List>
              </Tabs.TabPane>
            ))}
          </Tabs>

          <Row justify="end" style={{marginTop: "1rem"}}>
            <Col>
              <Button htmlType="submit" type="primary">
                <SaveFilled />
                Enregistrer
              </Button>
            </Col>
          </Row>
        </Form>
      )}
    </>
  );
};

export default FixationEditPage;
