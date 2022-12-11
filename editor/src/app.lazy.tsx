import React, {FC, useEffect} from "react";
import Modal from "react-modal";
import {fabric} from "fabric";

import Nav from "./nav";
import Main from "./main";
import Footer from "./footer";
import customControl from "./custom-control";
import {AsyncContextProvider} from "./async";
import {CanvasContextProvider, CanvasSpinner, PopoverContextProvider} from "./canvas";
import {OrderContextProvider} from "./order";
import {ReactComponent as Logo} from "./logo.svg";
import {CreatorProps} from "./app.types";
import {Stepper} from "./stepper";
import Trustpilot from "./trustpilot";
import smallDeviceWarning from "./small-device-warning.png";

import cs from "./app.module.scss";

Modal.setAppElement("#root");
customControl.registerAll();

// TODO: improve typings
// Sources: https://stackoverflow.com/questions/37117810/how-to-convert-canvas-to-svg-with-embedded-image-base64-in-fabricjs
// @ts-ignore
fabric.Image.prototype.getSvgSrc = function (options) {
  const el = fabric.util.createCanvasElement();
  // @ts-ignore
  el.width = this._element.naturalWidth || this._element.width;
  // @ts-ignore
  el.height = this._element.naturalHeight || this._element.height;
  // @ts-ignore
  el.getContext("2d").drawImage(this._element, 0, 0);
  // @ts-ignore
  return el.toDataURL(options);
};

const Header: FC = () => {
  useEffect(() => {
    const el = document.createElement("script");
    el.src = "https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js";
    el.async = true;
    document.head.append(el);
  }, []);

  return (
    <header className={cs.header}>
      <Logo className={cs.logo} />
      <Trustpilot />
    </header>
  );
};

const App: FC<CreatorProps> = props => {
  const isStepDefined = props.step !== undefined;
  const isTemplateDefined = props.templateId !== undefined;
  const isConfigDefined = props.config !== undefined && Object.keys(props.config).length > 0;

  return (
    <AsyncContextProvider>
      <CanvasContextProvider>
        <PopoverContextProvider>
          <OrderContextProvider templateId={props.templateId} config={props.config} productId={props.productId}>
            <div className={cs.container}>
              <Header />
              <Nav />
              <Main />
              <CanvasSpinner />
              <Footer submitComponent={props.submitComponent} />
              <Stepper step={props.step} enable={isStepDefined || (!isTemplateDefined && !isConfigDefined)} />
            </div>
            <div className={cs.smallDeviceWarning} style={{backgroundImage: `url(${smallDeviceWarning})`}} />
          </OrderContextProvider>
        </PopoverContextProvider>
      </CanvasContextProvider>
    </AsyncContextProvider>
  );
};

export default App;
