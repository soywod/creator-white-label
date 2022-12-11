import React, {FC, useEffect, useRef, useState} from "react";
import Modal, {Styles} from "react-modal";
import cn from "classnames";

import {useAsyncContext} from "../async";
import {ModalProps} from "../modal";
import {useOrderContext} from "../order";
import {ReactComponent as IconInfo} from "./info.svg";
import {BadgeComponent} from "./badge";
import {Product, hasMore, fetchProducts} from ".";
import cs from "./modal.module.scss";

const modalStyles: Styles = {
  overlay: {
    zIndex: 100,
    display: "grid",
    justifyItems: "center",
    alignItems: "center",
  },
  content: {
    padding: 0,
    inset: 0,
    borderRadius: "0.5rem",
    borderColor: "#d6d6d6",
    display: "flex",
    justifyContent: "center",
    width: "100%",
    maxWidth: "64rem",
    maxHeight: "90vh",
    position: "relative",
  },
};

export const ProductModal: FC<ModalProps> = props => {
  const Footer = props.footer;
  const handleClose = props.onClose || (() => {});
  const [_, setLoading] = useAsyncContext();
  const abortCtrl = useRef<AbortController>();
  const [products, setProducts] = useState<Product[]>([]);
  const [order, setOrder] = useOrderContext();
  const [more, setMore] = useState<string>();

  async function fetchData(evt?: React.FormEvent<HTMLFormElement>) {
    evt && evt.preventDefault();
    setLoading(true);

    try {
      abortCtrl.current = new AbortController();
      const {signal} = abortCtrl.current;
      setProducts(await fetchProducts(signal));
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err.message);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function changeProduct(product: Product) {
    return (evt: React.MouseEvent) => {
      evt.preventDefault();
      setOrder({product});
    };
  }

  return (
    <>
      <div className={cs.container}>
        <h2 className={cs.title}>Choisissez votre produit</h2>
        <div className={cs.grid}>
          {products.map(product => (
            <a
              key={product.id}
              href="#product"
              onClick={changeProduct(product)}
              className={cn(cs.item, {[cs.active]: order && order.product && order.product.id === product.id})}
            >
              <div className={cs.itemImgContainer}>
                <img
                  className={cs.itemImg}
                  src={process.env.REACT_APP_API_URL + "/public/" + product.preview}
                  alt={product.title}
                />
                <div className={cs.itemBadges}>
                  {product.badgeIds.map(id => (
                    <BadgeComponent key={id} id={id} />
                  ))}
                </div>
              </div>
              <div className={cs.itemContent}>
                <h3 className={cs.itemTitle}>{product.title}</h3>
                {product.description && (
                  <p
                    className={cs.itemInfo}
                    dangerouslySetInnerHTML={{__html: product.description.replaceAll(/\r?\n/g, "</br>")}}
                  />
                )}
              </div>
              {hasMore(product) && (
                <button className={cs.itemMore} onClick={() => setMore(product.more)}>
                  <IconInfo className={cs.itemMoreIcon} />
                  Plus d'info
                </button>
              )}
            </a>
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
                Produit : <strong>{order.product.title}</strong>
              </span>
            )}
            <button className={cs.footerSubmit} onClick={handleClose}>
              Valider
            </button>
          </>
        )}
      </div>
      <Modal isOpen={more !== undefined} onRequestClose={() => setMore(undefined)} style={modalStyles}>
        <div dangerouslySetInnerHTML={{__html: String(more)}} />
      </Modal>
    </>
  );
};

export default ProductModal;
