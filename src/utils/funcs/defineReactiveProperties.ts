/**
 * Enhances a custom HTMLElement class by defining reactive properties. This function takes a class,
 * a list of property names, and an optional property name used for triggering re-renders. It defines
 * getter and setter for each property in the list. When a property's setter is called, it updates the
 * property's value and optionally triggers a render method on the specified render property.
 *
 * This approach is useful for creating web components with properties that, when changed, automatically
 * update the component's rendering or state. The reactive properties are prefixed with an underscore (_)
 * for internal storage, while the getters and setters use the property's original name.
 *
 * @param {new () => T} cls - The class of the custom HTMLElement to be enhanced with reactive properties.
 * @param {string[]} properties - An array of property names that should become reactive.
 * @param {string | undefined} renderProperty - The name of the property on the class instance that, if present,
 * will be called with the new property value to trigger a render or state update. Defaults to "_drop".
 *
 * @example
 * class MyComponent extends HTMLElement {
 *   constructor() {
 *     super();
 *     // Initial setup
 *   }
 *
 *   _drop = {
 *     render: (props: Record<string, unknown>) => {
 *       // Render logic based on props
 *     }
 *   };
 * }
 *
 * // Define reactive properties 'foo' and 'bar' for MyComponent
 * defineReactiveProperties(MyComponent, ['foo', 'bar']);
 *
 * const myComponentInstance = new MyComponent();
 * myComponentInstance.foo = 'new value'; // Automatically triggers _drop.render({ foo: 'new value' })
 */
export function defineReactiveProperties<T extends HTMLElement>(
  cls: new () => T,
  properties: string[],
  renderProperty: string | undefined = "_drop"
): void {
  properties.forEach((prop) => {
    // Define a private property for internal use
    Object.defineProperty(cls.prototype, `_${prop}`, {
      writable: true,
      value: undefined,
    });

    // Define the public getter and setter for the property
    Object.defineProperty(cls.prototype, prop, {
      get: function (this: T) {
        return this[`_${prop}`];
      },
      set: function (this: T, value: unknown) {
        this[`_${prop}`] = value;
        // Trigger render/update if the specified renderProperty exists
        if (this[renderProperty]) {
          (this[renderProperty] as any).render({ [prop]: value });
        }
      },
    });
  });
}
