import React, { FC, LazyExoticComponent, lazy } from "react";
import { createRoot } from "react-dom/client";
import { loadIndexStylesAndJsChunks } from "../styles";

const CardLink = lazy(() => import("./CardLinkIframe"));

type Container = HTMLElement | ShadowRoot;
type ContainerWithSafepayDrop = Container & {
  safepayDrop?: {
    previousRender: React.ReactElement | null;
  };
};

function renderReactComponent(
  element: React.ReactElement,
  container: ContainerWithSafepayDrop,
  props: { [key: string]: any } | undefined = {}
): void {
  const safepayDrop = container.safepayDrop || {
    previousRender: null,
  };
  const combinedProps = { ...safepayDrop.previousRender?.props, ...props };
  const componentToRender = React.cloneElement(element, combinedProps);
  const root = createRoot(container!);

  root.render(
    <React.StrictMode>
      <React.Suspense fallback={<div />}>{componentToRender}</React.Suspense>
    </React.StrictMode>
  );

  container.safepayDrop = {
    ...safepayDrop,
    previousRender: componentToRender,
  };
}

export interface SafepayDrop {
  remove: () => void;
  render: (newProps: any) => void;
}

const initializeSafepayDrop = (
  Component: LazyExoticComponent<FC>,
  props: { [key: string]: any },
  id: string,
  shadow: boolean = false
): SafepayDrop => {
  let container: HTMLElement;

  if (id) {
    container = document.getElementById(id) || document.createElement("div");
    container.id = id;
  } else {
    container = document.createElement("div");
    document.body.appendChild(container);
  }

  if (shadow && !container.shadowRoot) {
    container.attachShadow({ mode: "open" });
  }

  const target = container.shadowRoot || container;

  const safepayDrop = {
    remove: () => container.remove(),
    render: (newProps) => {
      renderReactComponent(<Component />, target, { ...props, ...newProps });
    },
  };

  safepayDrop.render(props);

  return safepayDrop;
};

export interface StyleChunks {
  index?: HTMLStyleElement;
  SeamlessIframe?: HTMLStyleElement;
  CardLink?: HTMLStyleElement;
}

export interface JSChunks {
  index?: string[];
  SeamlessIframe?: string[];
  CardLink?: string[];
}

export interface SafepayDropFunctions {
  cardLink: (props: { [key: string]: any }, id: string) => SafepayDrop;
  captureContext: string;
  styleChunks: StyleChunks;
  jsChunkImports: JSChunks;
}

export const safepayDropFunctions: SafepayDropFunctions = {
  cardLink: (props, id) => initializeSafepayDrop(CardLink, props, id),
  captureContext: "",
  styleChunks: {},
  jsChunkImports: {},
};

window.drops = safepayDropFunctions;
loadIndexStylesAndJsChunks();
