import {FC} from "react";
import {RouteProps, Route, Redirect} from "react-router-dom";
import Spin from "antd/lib/spin";

import useAuth from "./hook";

export const PrivateRoute: FC<RouteProps> = props => {
  const {auth} = useAuth();

  if (auth.type === "not-initialized") {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (auth.type === "not-authenticated") {
    return <Redirect to={{pathname: "/sign-in", state: {referer: window.location.pathname}}} />;
  }

  return <Route {...props} />;
};

export default PrivateRoute;
