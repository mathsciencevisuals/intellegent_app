"use client";

import { ReactNode, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const HEADER_ACTIONS_SLOT_ID = "workspace-tab-header-actions";

type WorkspaceTabHeaderActionsProps = {
  children: ReactNode;
};

export function WorkspaceTabHeaderActions({
  children,
}: WorkspaceTabHeaderActionsProps) {
  const slot = useSyncExternalStore(
    () => () => {},
    () => document.getElementById(HEADER_ACTIONS_SLOT_ID),
    () => null
  );

  if (!slot) {
    return null;
  }

  return createPortal(children, slot);
}

export { HEADER_ACTIONS_SLOT_ID };
