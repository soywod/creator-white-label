import React, {FC, useCallback, useEffect, useRef, useState} from "react";
import {fabric} from "fabric";

import {useCanvas, scaleObjToCanvas} from "../canvas";
import {useAsyncContext} from "../async";
import {ReactComponent as IconSearch} from "./search.svg";
import {DrawerProps} from "../drawer";
import api from "./api";
import Picto from "./model";
import cs from "./drawer.module.scss";

export const PictoDrawer: FC<DrawerProps> = () => {
  const abortCtrl = useRef<AbortController>();
  const [_, setLoading] = useAsyncContext();
  const [search, setSearch] = useState("");
  const [pictos, setPictos] = useState<Picto[]>([]);
  const [suggestion, setSuggestion] = useState<string>();
  const canvas = useCanvas();

  async function fetchPictos(evt?: React.FormEvent<HTMLFormElement>, search?: string) {
    evt && evt.preventDefault();
    setLoading(true);

    try {
      abortCtrl.current = new AbortController();
      const {signal} = abortCtrl.current;
      const q = (search && search.trim()) || "default";
      const res = await api.fetchPictos(signal, q);
      if (res.pictos.length === 0) {
        setSuggestion(res.suggestion);
        setPictos([]);
      } else {
        setSuggestion(undefined);
        setPictos(res.pictos);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err.message);
      }
    }

    setLoading(false);
  }

  function applySuggestion(evt: React.MouseEvent, suggestion?: string) {
    if (suggestion) {
      evt.preventDefault();
      setSearch(suggestion);
      setSuggestion(undefined);
      fetchPictos(undefined, suggestion);
    }
  }

  function loadSvg(url: string) {
    setLoading(true);

    fabric.loadSVGFromURL(
      process.env.REACT_APP_API_URL + "/public/" + url,
      (elements, opts) => {
        if (!canvas) return;
        if (!canvas.clipPath) return;
        const svg = fabric.util.groupSVGElements(elements, opts);
        const canvasCenter = canvas.getVpCenter();
        const overlayBoundingRect = canvas.clipPath.getBoundingRect();
        svg.set({
          originX: "center",
          originY: "center",
          left: canvasCenter.x,
          top: canvasCenter.y,
        });
        if (overlayBoundingRect.width / overlayBoundingRect.height > svg.getScaledWidth() / svg.getScaledHeight()) {
          svg.scaleToWidth(overlayBoundingRect.height / canvas.getZoom() / 2);
        } else {
          svg.scaleToWidth(overlayBoundingRect.width / canvas.getZoom() / 2);
        }
        canvas.add(svg);
        canvas.setActiveObject(svg);
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        setLoading(false);
      },
      undefined,
      {crossOrigin: "anonymous"},
    );
  }

  useEffect(() => {
    fetchPictos();
  }, []);

  return (
    <>
      <form className={cs.search} onSubmit={evt => fetchPictos(evt, search)}>
        <input
          className={cs.searchInput}
          type="text"
          placeholder="Rechercher une icône…"
          value={search}
          onChange={evt => setSearch(evt.target.value.trim())}
        />
        <button className={cs.searchSubmit} type="submit">
          <IconSearch className={cs.searchSubmitIcon} />
        </button>
      </form>
      {suggestion && (
        <span className={cs.suggestion}>
          Essayez avec cette orthographe:{" "}
          <a className={cs.suggestionLink} href="#suggestion" onClick={evt => applySuggestion(evt, suggestion)}>
            {suggestion}
          </a>
        </span>
      )}
      {!suggestion && pictos.length === 0 && (
        <span className={cs.suggestion}>
          Aucun résultat pour cette recherche.
          <a className={cs.suggestionLink} href="#suggestion" onClick={evt => applySuggestion(evt, suggestion)}>
            {suggestion}
          </a>
        </span>
      )}
      <div className={cs.grid}>
        {pictos.map(picto => (
          <button key={picto.id} className={cs.gridItem} onClick={() => loadSvg(picto.url)}>
            <img
              crossOrigin="anonymous"
              src={process.env.REACT_APP_API_URL + "/public/" + picto.url}
              alt=""
              style={{width: "100%"}}
            />
          </button>
        ))}
      </div>
    </>
  );
};

export default PictoDrawer;
