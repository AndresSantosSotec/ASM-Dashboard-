"use client";

import React from "react";
import { useCan, Action } from "./PermissionsProvider";

interface Props {
  routePath: string;
  action: Action;
  mode?: "hide" | "disable";
  children: React.ReactElement;
}

const IfCan: React.FC<Props> = ({ routePath, action, mode = "hide", children }) => {
  const allowed = useCan(routePath, action);

  if (allowed) return children;
  if (mode === "disable") {
    return React.cloneElement(children, { disabled: true });
  }
  return null;
};

export default IfCan;
