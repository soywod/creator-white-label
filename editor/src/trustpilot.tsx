import React, {FC, useEffect, useState} from "react";
import cn from "classnames";

import cs from "./trustpilot.module.scss";

// https://support.trustpilot.com/hc/en-us/articles/115011421468--Add-a-TrustBox-to-a-single-page-application
const TrustBox: FC = () => {
  // Create a reference to the <div> element which will represent the TrustBox
  const ref = React.useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // If window.Trustpilot is available it means that we need to load the TrustBox from our ref.
    // If it's not, it means the script you pasted into <head /> isn't loaded  just yet.
    // When it is, it will automatically load the TrustBox.
    if (window.Trustpilot) {
      window.Trustpilot.loadFromElement(ref.current, true);
    }
  }, []);

  useEffect(() => {
    window.setTimeout(() => setReady(true), 1000);
  }, []);

  return (
    <div className={cs.container}>
      <div
        ref={ref} // We need a reference to this element to load the TrustBox in the effect.
        className={cn("trustpilot-widget", cs.widget)}
        data-locale="fr-FR"
        data-template-id="5419b732fbfb950b10de65e5"
        data-businessunit-id="5e9005f438243f00017730d4"
        data-style-height="24px"
        data-style-width="100%"
        data-theme="light"
      >
        <a href="https://fr.trustpilot.com/review/pictosigns.com" target="_blank" rel="noopener noreferrer">
          Trustpilot
        </a>
      </div>
      <div className={cn(cs.fader, {[cs.hidden]: ready})}></div>
    </div>
  );
};

export default TrustBox;
