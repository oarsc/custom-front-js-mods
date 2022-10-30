// version 2.1.0

export { };

declare global {
  interface HTMLElement {
    isHidden(): boolean;
    isVisible(): boolean;
    show(display?: string): void;
    hide(): void;
    remove(): void;
    previousSiblings(): HTMLElement[];
    nextSiblings(): HTMLElement[];
    closest(selector: string): HTMLElement | undefined;
    clear(): void;
  }

  interface DOMTokenList {
    onAnyChange(callbackFn: (element: string, enabled: boolean) => void): void;
    onChange(element: string, callbackFn: (enabled: boolean) => void): void;
  }

  interface Array<T> {
    peek(callbackFn: (value: T, currentIndex: number, array: Array<T>) => void): Array<T>;
    unique(): Array<T>;
    clear(): Array<T>;
    removeIf(callbackFn: (value: T, currentIndex: number, array: Array<T>) => void): Array<T>;
    red<I>(callbackFn: (previousValue: I, currentValue: T, currentIndex: number, array: Array<T>) => void, initialValue: I): I;
    also(callbackFn: (array: Array<T>) => void): Array<T>;
    let<O>(callbackFn: (array: Array<T>) => O): O;
  }

  interface CSSStyleDeclaration {
    also(callbackFn: (styleDeclaration: CSSStyleDeclaration) => void): CSSStyleDeclaration;
  }
}
