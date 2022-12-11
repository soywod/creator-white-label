import React, {FC} from "react";
import {BrowserRouter as Router, Route, Switch, Redirect, useHistory} from "react-router-dom";
import Layout from "antd/lib/layout";
import Menu from "antd/lib/menu";
import Typography from "antd/lib/typography";
import ConfigProvider from "antd/lib/config-provider";
import {
  AppstoreOutlined,
  BuildOutlined,
  FontSizeOutlined,
  FormatPainterOutlined,
  GatewayOutlined,
  LogoutOutlined,
  PercentageOutlined,
  StarOutlined,
  ToolOutlined,
  UserOutlined,
  LayoutOutlined,
} from "@ant-design/icons";
import frFR from "antd/lib/locale/fr_FR";

import useAuth from "./auth/hook";
import PrivateRoute from "./auth/private-route";
import SignIn from "./auth/sign-in";
import {AppPage} from "./application";
import {UserPage} from "./user";
import {MaterialPage} from "./material";
import {DimensionPage} from "./dimension";
import {DiscountPage} from "./discount";
import {PictoPage} from "./picto";
import {ShapePage} from "./shape";
import {FontPage} from "./font";
import {TemplateListPage, TemplateEditPage} from "./template";
import {FixationListPage, FixationEditPage} from "./fixation";

const withLayout = (Component: React.ComponentType) => () => {
  const history = useHistory();
  const path = history.location.pathname;
  const {signOut} = useAuth();

  const selectedKeys = (() => {
    if (path.startsWith("/app")) return ["/app"];
    if (path.startsWith("/user")) return ["/user"];
    if (path.startsWith("/material")) return ["/material"];
    if (path.startsWith("/fixation")) return ["/fixation"];
    if (path.startsWith("/dimension")) return ["/dimension"];
    if (path.startsWith("/shape")) return ["/shape"];
    if (path.startsWith("/discount")) return ["/discount"];
    if (path.startsWith("/font")) return ["/font"];
    if (path.startsWith("/template")) return ["/template"];
    return [path];
  })();

  return (
    <Layout>
      <Layout.Sider breakpoint="md" collapsedWidth={0} style={{minHeight: "100vh"}}>
        <Menu
          theme="dark"
          mode="inline"
          onClick={evt => history.push(evt.key.toString())}
          selectedKeys={selectedKeys}
          style={{flex: 1}}
        >
          <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
            <Typography.Title
              level={4}
              style={{
                margin: "1rem 0",
                fontFamily: "Avenir Next",
                fontSize: "2.25rem",
                fontWeight: 100,
                color: "#ffffff",
                textShadow:
                  "0 0 1px #0098e6, 0 0 2px #0098e6, 0 0 3px #0098e6, 0 0 4px #0098e6, 0 0 8px #0098e6, 0 0 16px #0098e6",
              }}
            >
              Creator
            </Typography.Title>
          </div>
          <Menu.Item key="/app" icon={<AppstoreOutlined />}>
            Applications
          </Menu.Item>
          <Menu.Item key="/user" icon={<UserOutlined />}>
            Utilisateurs
          </Menu.Item>
          <Menu.Item key="/material" icon={<FormatPainterOutlined />}>
            Matériaux
          </Menu.Item>
          <Menu.Item key="/shape" icon={<BuildOutlined />}>
            Formes
          </Menu.Item>
          <Menu.Item key="/dimension" icon={<GatewayOutlined />}>
            Dimensions
          </Menu.Item>
          <Menu.Item key="/fixation" icon={<ToolOutlined />}>
            Fixations
          </Menu.Item>
          <Menu.Item key="/discount" icon={<PercentageOutlined />}>
            Remises
          </Menu.Item>
          <Menu.Item key="/picto" icon={<StarOutlined />}>
            Pictogrammes
          </Menu.Item>
          <Menu.Item key="/font" icon={<FontSizeOutlined />}>
            Polices
          </Menu.Item>
          <Menu.Item key="/template" icon={<LayoutOutlined />}>
            Templates
          </Menu.Item>
        </Menu>
        <Menu theme="dark" mode="inline">
          <Menu.Item icon={<LogoutOutlined />} onClick={signOut}>
            Se déconnecter
          </Menu.Item>
        </Menu>
      </Layout.Sider>
      <Layout.Content style={{overflow: "hidden", padding: "1rem"}}>
        <Component />
      </Layout.Content>
    </Layout>
  );
};

export const App: FC = () => {
  return (
    <ConfigProvider locale={frFR}>
      <Router>
        <Switch>
          <Route path="/sign-in" component={SignIn} />
          <PrivateRoute path="/app" component={withLayout(AppPage)} />
          <PrivateRoute path="/user" component={withLayout(UserPage)} />
          <PrivateRoute path="/material" component={withLayout(MaterialPage)} />
          <PrivateRoute path="/dimension" component={withLayout(DimensionPage)} />
          <PrivateRoute path="/discount" component={withLayout(DiscountPage)} />
          <PrivateRoute path="/picto" component={withLayout(PictoPage)} />
          <PrivateRoute path="/shape" component={withLayout(ShapePage)} />
          <PrivateRoute path="/fixation/edit/:id?" component={withLayout(FixationEditPage)} />
          <PrivateRoute path="/fixation" component={withLayout(FixationListPage)} />
          <PrivateRoute path="/font" component={withLayout(FontPage)} />
          <PrivateRoute path="/template/edit/:id?" component={TemplateEditPage} />
          <PrivateRoute path="/template" component={withLayout(TemplateListPage)} />
          <Redirect to="/app" />
        </Switch>
      </Router>
    </ConfigProvider>
  );
};

export default App;
