import React, {FC, useEffect, useState} from "react";
import Tippy from "@tippyjs/react";

import {Badge, fetchBadges} from ".";
import cs from "./component.module.scss";

let badgesCache: Badge[];

export type BadgeComponentProps = {
  id: number;
};

export const BadgeComponent: FC<BadgeComponentProps> = props => {
  const [badge, setBadge] = useState<Badge>();

  useEffect(() => {
    const sig = new AbortController().signal;
    const badges = badgesCache === undefined ? fetchBadges(sig) : Promise.resolve(badgesCache);
    badges.then(badges => {
      setBadge(badges.find(b => b.id === props.id));
      badgesCache = badges;
    });
  }, []);

  if (!badge) {
    return null;
  }

  return (
    <Tippy content={badge.name} placement="right">
      <span className={cs.container}>
        <img className={cs.icon} src={process.env.REACT_APP_API_URL + "/public/" + badge.iconUrl} />
      </span>
    </Tippy>
  );
};

export default BadgeComponent;
