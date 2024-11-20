import React, { FC, LazyExoticComponent, lazy } from "react";
import { createRoot } from "react-dom/client";
import { loadIndexStylesAndJsChunks } from "../styles";

const CardLink = lazy(() => import("./CardLinkIframe"));
const DeviceMetrics = lazy(() => import("./DeviceMetricsIframe"));

type Container = HTMLElement | ShadowRoot;
type ContainerWithSafepayDrop = Container & {
  safepayDrop?: {
    previousRender: React.ReactElement | null;
  };
};

/**
 * Renders a React component within a specified container, optionally merging properties from a previous render.
 * This function is designed to work with containers that are prepared to handle Safepay drops, allowing for
 * the dynamic injection of React components with updated props on subsequent renders. It uses React's strict mode
 * and suspense features to enhance the development experience and handle loading states respectively.
 *
 * @param {React.ReactElement} element - The React element to be rendered. This is typically a JSX element or a component invocation.
 * @param {ContainerWithSafepayDrop} container - The DOM element or container where the React element will be rendered. This container is expected to have a `safepayDrop` property for tracking the previous render state.
 * @param {Object} [props={}] - An optional object containing properties that should be merged with any properties from the element's previous render. This allows for dynamic updating of component props.
 *
 * @example
 * // Define a container element in your HTML
 * const container = document.getElementById('my-container');
 * container.safepayDrop = {}; // Prepare the container for Safepay drops
 *
 * // Define a React component
 * const MyComponent = () => <div>Hello, World!</div>;
 *
 * // Render the component inside the container
 * renderReactComponent(<MyComponent />, container, { additionalProp: 'value' });
 *
 * // Subsequent calls can update the props
 * renderReactComponent(<MyComponent />, container, { additionalProp: 'new value' });
 */
function renderReactComponent(
  element: React.ReactElement,
  container: ContainerWithSafepayDrop,
  props: { [key: string]: any } | undefined = {},
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
    </React.StrictMode>,
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

/**
 * Initializes a Safepay Drop by dynamically injecting a React component into the DOM,
 * optionally within a Shadow DOM to encapsulate the styling and markup. This function
 * creates or selects a container based on the provided ID and then renders the specified
 * React component into this container with the given props. Additional props can be provided
 * on subsequent renders without re-initializing the Safepay Drop.
 *
 * @param {LazyExoticComponent<FC>} Component - The React component to be dynamically injected. This component should be lazy-loaded to leverage React's code-splitting capabilities.
 * @param {Object} props - An object containing initial props for the component. These props can be updated on subsequent renders.
 * @param {string} id - The ID of the container element into which the component should be rendered. If the container does not exist, it will be created.
 * @param {boolean} [shadow=false] - Determines whether the component should be rendered within a Shadow DOM. Using Shadow DOM encapsulates the component's styles and markup, preventing conflicts with the host page.
 *
 * @returns {SafepayDrop} An object representing the Safepay Drop instance, providing methods for removing the component or rendering it with new props.
 *
 * @example
 * // Lazy-load a React component
 * const MyLazyComponent = React.lazy(() => import('./MyComponent'));
 *
 * // Initialize a Safepay Drop
 * const drop = initializeSafepayDrop(MyLazyComponent, { prop1: 'value' }, 'my-container-id');
 *
 * // Update the component's props
 * drop.render({ prop1: 'new value' });
 *
 * // Remove the component from the DOM when it's no longer needed
 * drop.remove();
 */
const initializeSafepayDrop = (
  Component: LazyExoticComponent<FC>,
  props: { [key: string]: any },
  id: string,
  shadow: boolean = false,
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
  DeviceMetrics?: HTMLStyleElement;
}

export interface JSChunks {
  index?: string[];
  SeamlessIframe?: string[];
  CardLink?: string[];
  DeviceMetrics?: string[];
}

export interface SafepayDropFunctions {
  cardLink: (props: { [key: string]: any }, id: string) => SafepayDrop;
  deviceMetrics: (props: { [key: string]: any }, id: string) => SafepayDrop;
  styleChunks: StyleChunks;
  jsChunkImports: JSChunks;
}

export const safepayDropFunctions: SafepayDropFunctions = {
  cardLink: (props, id) => initializeSafepayDrop(CardLink, props, id),
  deviceMetrics: (props, id) => initializeSafepayDrop(DeviceMetrics, props, id),
  styleChunks: {},
  jsChunkImports: {},
};

window.drops = safepayDropFunctions;
loadIndexStylesAndJsChunks();
