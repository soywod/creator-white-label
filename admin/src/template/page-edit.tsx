import {FC, useEffect, useState} from "react";
import {useParams, useHistory} from "react-router";
import {Link, useLocation} from "react-router-dom";
import notification from "antd/lib/notification";
import {LoadingOutlined} from "@ant-design/icons";

import * as Creator from "creator";
import {CreatorSubmitComponentCallback} from "creator/dist/app.types";
import "creator/dist/creator.esm.css";

import {upload} from "../_shared/upload";
import $template from "./service";
import Template from "./model";
import cs from "./page-edit.module.scss";

export const TemplateEditPage: FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<Template>();
  const templateId = Number(useParams<{id?: string}>().id) || 0;

  const {search} = useLocation();
  const encodedPath = new URLSearchParams(search).get("path") || "";

  useEffect(() => {
    $template.get(templateId).then(setTemplate);
  }, [templateId]);

  function save(onSubmit: CreatorSubmitComponentCallback) {
    return async () => {
      try {
        if (loading) return;
        setLoading(true);
        if (!template) return;
        const {preview, config} = await onSubmit();
        const previewUrl = await fetch(preview)
          .then(res => res.blob())
          .then(blob => new File([blob], "preview.png"))
          .then(file => upload<Record<string, string>>(file))
          .then(res => res["preview.png"]);
        const uploadedConfigName = await upload<Record<string, string>>(new File([config], "config.svg")).then(
          res => res["config.svg"],
        );
        await $template.set({...template, previewUrl, config: uploadedConfigName});
        history.push(`/template?path=${encodedPath}`);
      } catch (err: any) {
        notification.error({message: "Erreur", description: err.message});
      } finally {
        setLoading(false);
      }
    };
  }

  return (
    <div className={cs.container}>
      <Creator.App
        templateId={templateId}
        submitComponent={({onSubmit}) => (
          <div className={cs.submit}>
            <Link className={cs.link} to={`/template?path=${encodedPath}`}>
              Annuler
            </Link>
            <button className={cs.btn} onClick={save(onSubmit)} disabled={loading}>
              {loading && <LoadingOutlined className={cs.btnIcon} />}
              Sauvegarder
            </button>
          </div>
        )}
      />
    </div>
  );
};

export default TemplateEditPage;
