export function defineReactiveProperties<T extends HTMLElement>(
  cls: new () => T,
  properties: string[],
  renderProperty: string | undefined = "_drop"
): void {
  properties.forEach((prop) => {
    Object.defineProperty(cls.prototype, `_${prop}`, {
      writable: true,
      value: undefined,
    });

    Object.defineProperty(cls.prototype, prop, {
      get: function (this: T) {
        return this[`_${prop}`];
      },
      set: function (this: T, value: unknown) {
        this[`_${prop}`] = value;
        if (this[renderProperty]) {
          (this[renderProperty] as any).render({ [prop]: value });
        }
      },
    });
  });
}
