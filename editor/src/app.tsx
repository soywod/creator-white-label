import React, {FC, Suspense, lazy} from "react";
import "tippy.js/dist/tippy.css";

import {CreatorProps} from "./app.types";
import "./index.scss";

const Loader: FC = () => (
  <div
    style={{
      position: "static",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: "100vw",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <div style={{fontSize: "1rem"}}>Chargement de l'éditeur…</div>
  </div>
);

const LazyApp = lazy(
  () =>
    new Promise<{default: FC<CreatorProps>}>(async resolve => {
      // TODO: import products, dimensions, shapes and fixations
      const app = await import("./app.lazy");
      const initFonts = await import("./font/service").then(m => m.initFonts);
      await initFonts();
      resolve(app);
    }),
);

export const App: FC<CreatorProps> = props => (
  <Suspense fallback={<Loader />}>
    <LazyApp {...props} />
  </Suspense>
);

export default App;
