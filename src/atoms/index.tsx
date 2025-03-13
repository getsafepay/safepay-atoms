import React, { FC, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { loadIndexStylesAndJsChunks } from '../styles';
import { SafepayAtom, SafepayAtomFunctions } from '../types/atoms';

const CardAtom = lazy(() => import('./CardCaptureIframe'));
const PayerAuthentication = lazy(() => import('./PayerAuthenticationIframe'));

// Types for container elements
type Container = HTMLElement | ShadowRoot;
type ContainerWithSafepayAtom = Container & {
  safepayAtom?: {
    previousRender: React.ReactElement | null;
  };
};

/**
 * Renders a React component within a specified container, optionally merging properties from a previous render.
 *
 * @param {React.ReactElement} element - The React element to be rendered
 * @param {ContainerWithSafepayAtom} container - The DOM element or Shadow Root where the React element will be rendered
 * @param {Object} props - Optional properties to merge with previous render properties
 *
 * @example
 * const container = document.getElementById('my-container');
 * renderReactComponent(<MyComponent />, container, { someProperty: 'value' });
 */
function renderReactComponent(
  element: React.ReactElement,
  container: ContainerWithSafepayAtom,
  props: { [key: string]: any } = {}
): void {
  // Initialize or get existing safepayAtom
  const safepayAtom = container.safepayAtom || {
    previousRender: null,
  };

  // Merge previous and new props
  const filteredProps = Object.fromEntries(Object.entries(props).filter(([_, value]) => value !== undefined));
  const combinedProps = { ...safepayAtom.previousRender?.props, ...filteredProps };
  const componentToRender = React.cloneElement(element, combinedProps);
  const root = createRoot(container!);

  // Render component with StrictMode for better development experience
  root.render(<React.StrictMode>{componentToRender}</React.StrictMode>);

  // Update container's safepayAtom reference
  container.safepayAtom = {
    ...safepayAtom,
    previousRender: componentToRender,
  };
}

/**
 * Initializes a Safepay Atom by creating a container and rendering a React component.
 *
 * @param {FC} Component - The React component to render
 * @param {Object} props - Initial properties for the component
 * @param {string} id - DOM element ID for the container
 * @param {boolean} shadow - Whether to use Shadow DOM for style encapsulation
 * @returns {SafepayAtom} Object containing methods to control the rendered component
 *
 * @example
 * const atom = initializeSafepayAtom(CardAtom, { theme: 'dark' }, 'card-container');
 * atom.render({ theme: 'light' }); // Update props
 * atom.remove(); // Remove from DOM
 */
const initializeSafepayAtom = (
  Component: FC,
  props: { [key: string]: any },
  id: string,
  shadow: boolean = false
): SafepayAtom => {
  // Create or find container element
  let container: HTMLElement;
  if (id) {
    container = document.getElementById(id) || document.createElement('div');
    container.id = id;
  } else {
    container = document.createElement('div');
    document.body.appendChild(container);
  }

  // Setup Shadow DOM if requested
  if (shadow && !container.shadowRoot) {
    container.attachShadow({ mode: 'open' });
  }

  const target = container.shadowRoot || container;

  // Create SafepayAtom instance
  const safepayAtom = {
    remove: () => container.remove(),
    render: (newProps) => {
      renderReactComponent(<Component />, target, { ...props, ...newProps });
    },
  };

  // Initial render
  safepayAtom.render(props);

  return safepayAtom;
};

/**
 * Main export object containing all Safepay Atom functionality
 */
export const safepayAtomFunctions: SafepayAtomFunctions = {
  cardAtom: (props, id) => initializeSafepayAtom(CardAtom, props, id),
  payerAuthentication: (props, id) => initializeSafepayAtom(PayerAuthentication, props, id),
  components: {
    CardAtom,
    PayerAuthentication,
  },
  styleChunks: {},
  jsChunkImports: {},
};

// Attach to window and load styles
window.atoms = safepayAtomFunctions;
loadIndexStylesAndJsChunks();
