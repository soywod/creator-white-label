import React, {FC, Fragment, useCallback, useEffect, useRef, useState} from "react";
import Modal, {Styles} from "react-modal";
import YouTube from "react-youtube";
import cn from "classnames";

import {useAsyncContext} from "../async";
import {useOrderContext} from "../order";
import {ModalProps} from "../modal";
import Fixation from "./model";
import api from "./api";
import cs from "./modal.module.scss";

const modalStyles: Styles = {
  overlay: {
    zIndex: 100,
  },
  content: {
    padding: 0,
    display: "flex",
    borderRadius: "0.5rem",
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};

export const FixationModal: FC<ModalProps> = props => {
  const Footer = props.footer;
  const [_, setLoading] = useAsyncContext();
  const abortCtrl = useRef<AbortController>();
  const [fixations, setFixations] = useState<Fixation[]>([]);
  const [videoVisible, showVideo] = useState<string | null>(null);
  const [order, setOrder] = useOrderContext();

  const fetchFixations = useCallback(
    async (evt?: React.FormEvent<HTMLFormElement>) => {
      evt && evt.preventDefault();
      setLoading(true);

      try {
        abortCtrl.current = new AbortController();
        const {signal} = abortCtrl.current;
        await api
          .fetchFixations(signal)
          .then(fixations =>
            fixations.filter(fixation => {
              if (!order.product) return false;
              return order.product.fixationIds.includes(fixation.id);
            }),
          )
          .then(setFixations);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err.message);
        }
      }

      setLoading(false);
    },
    [setLoading, order.product],
  );

  useEffect(() => {
    fetchFixations();
  }, [fetchFixations]);

  function changeFixation(fixation: Fixation) {
    return (evt: React.MouseEvent) => {
      evt.preventDefault();
      setOrder({fixation});
    };
  }

  return (
    <>
      <div>
        <h2 className={cs.title}>Choisissez votre fixation</h2>
        <div className={cs.grid}>
          {fixations.map(fixation => (
            <Fragment key={fixation.id}>
              <div className={cs.itemContainer}>
                <button
                  onClick={changeFixation(fixation)}
                  className={cn(cs.item, {[cs.active]: order && order.fixation && order.fixation.id === fixation.id})}
                >
                  <div className={cs.itemImgContainer}>
                    <img
                      className={cs.itemImg}
                      src={process.env.REACT_APP_API_URL + "/public/" + fixation.previewUrl}
                      alt={fixation.name}
                    />
                  </div>
                  <div className={cs.itemContent}>
                    <h3 className={cs.itemTitle}>{fixation.name}</h3>
                  </div>
                </button>
                {fixation.videoUrl ? (
                  <button className={cs.itemMore} onClick={() => showVideo(fixation.videoUrl)}>
                    Vidéo
                  </button>
                ) : (
                  <span />
                )}
              </div>
              {fixation.videoUrl && (
                <Modal isOpen={Boolean(videoVisible)} onRequestClose={() => showVideo(null)} style={modalStyles}>
                  <YouTube
                    containerClassName={cs.video}
                    videoId={fixation.videoUrl}
                    onReady={evt => evt.target.playVideo()}
                  />
                </Modal>
              )}
            </Fragment>
          ))}
        </div>
      </div>
      <div className={cs.footer}>
        {Footer ? (
          <Footer />
        ) : (
          <>
            {order && order.product && (
              <span className={cs.footerProduct}>
                Fixation : <strong>{order.fixation ? order.fixation.name : "Aucune"}</strong>
              </span>
            )}
            <button className={cs.footerSubmit} onClick={props.onClose}>
              Valider
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default FixationModal;
