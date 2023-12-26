// version 2.2.1

const doc = document;

export function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, id?: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const element = doc.createElement(tagName);
  if (id) {
    if (id.startsWith('#')) element.id = id.substring(1);
    else element.className = id;
  }
  parent?.appendChild(element);
  return element;
}

export function getElementById<T extends HTMLElement>(id: string): T | undefined {
  return doc.getElementById(id) as T;
}

export function querySelectorAll(selector: string, parent: ParentNode | HTMLElement | Document = doc): HTMLElement[] {
  return [...parent.querySelectorAll(selector)] as HTMLElement[];
}

export function querySelector<T extends HTMLElement>(selector: string, parent: ParentNode | HTMLElement | Document = doc): T | undefined {
  return parent.querySelector<T>(selector) ?? undefined;
}

export function getElementsByClassName(className: string, parent: HTMLElement | Document = doc): HTMLElement[] {
  return [...parent.getElementsByClassName(className)] as HTMLElement[];
}

export function getElementsByTagName<K extends keyof HTMLElementTagNameMap>(tagName: K, parent: HTMLElement | Document = doc): HTMLElementTagNameMap[K][] {
  return [...parent.getElementsByTagName(tagName)];
}

export function hasClass(element: HTMLElement, ...classes: string[]): boolean {
  return keepArrayPositiveValues(classes).every(c => element.classList.contains(c));
}

export function addClass(element: HTMLElement, ...classes: string[]) {
  keepArrayPositiveValues(classes).forEach(c => element.classList.add(c));
}

export function removeClass(element: HTMLElement, ...classes: string[]) {
  keepArrayPositiveValues(classes).forEach(c => element.classList.remove(c));
}

export function toggleClass(element: HTMLElement, ...classes: (string | boolean)[]) {
  const lastIndex = classes.length - 1;

  const filteredClasses = classes
    .filter(cls => typeof cls === 'string')
    .map(cls => cls as string)
    .filter(noBlanks => noBlanks);

  if (lastIndex >= 0 && typeof classes[lastIndex] == 'boolean') {
    const enable = classes[lastIndex] as boolean;
    filteredClasses.forEach(c => element.classList.toggle(c, enable ? true : false));

  } else {
    filteredClasses.forEach(c => element.classList.toggle(c));
  }
}

export function also<T>(object: T, callbackFn: (object: T) => void): T {
  callbackFn(object);
  return object;
}

export function pipe<T, R>(object: T, callbackFn: (object: T) => R): R {
  return callbackFn(object);
}

export function generateFromTemplate(id: string): HTMLElement | undefined {
  const temp = getElementById<HTMLTemplateElement>(id);
  return temp?.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
}

export function isNumeric(value?: string): boolean {
  if (value) {
    if (!value.match(/^[\d\.]+$/)) return false;
    const float = parseFloat(value);
    return !isNaN(float) && isFinite(float);
  }
  return false;
}

export interface AjaxOptions extends RequestInit {
  json?: boolean
}

export function ajax(urlStr: string, params?: any, options: AjaxOptions = {}): Promise<Response> {
  if (!params) {
    return fetch(urlStr, options);
  }

  const url = new URL(urlStr, location.origin);
  const method = options.method || 'GET';

  if (method == 'GET') {
    url.search = new URLSearchParams(params).toString();

  } else if (method == 'POST' || method == 'DELETE' || method == 'PUT') {
    options.body = typeof params === 'string' ? params : JSON.stringify(params);

    if (options.json ?? true) {
      options.headers = {
        'Content-Type': 'application/json; charset=UTF-8' // 'application/x-www-form-urlencoded; charset=UTF-8'
      };
    }
  }
  return fetch(url, options);
}

export function redirectPost(url: string, data: { [key: string]: string }) {
  const form = createElement('form');
  form.action = url;
  form.method = 'POST';
  form.style.display = 'none';

  Object.entries(data).forEach(([key, value]) => {
    const input = createElement('input', undefined, form);
    input.name = key;
    input.value = value;
    input.type = 'hidden';
  });

  doc.body.appendChild(form);

  form.submit();
}


// Cookies
const cookieCache: { [key: string]: string } = {};
export function cookieSet(cookieName: string, cookieValue: string, expirationDays: number) {
  const d = new Date();
  d.setTime(d.getTime() + (expirationDays * 86400000)); // 24*60*60*1000
  const expires = 'expires=' + d.toUTCString();
  cookieCache[cookieName] = cookieValue;
  cookieValue = ('' + cookieValue).replace(/\;/g, '_{.,}_');
  doc.cookie = cookieName + '=' + cookieValue + '; ' + expires;
}

export function cookieGet(cookieName: string): string {
  if (cookieCache[cookieName] != undefined) {
    return cookieCache[cookieName];
  }
  const allCookies = doc.cookie.split(';');
  for (const cookie of allCookies) {
    let trimCookie = cookie;
    while (trimCookie.charAt(0) == ' ') trimCookie = trimCookie.substring(1);

    if (trimCookie.indexOf(cookieName + '=') != -1) {
      cookieCache[cookieName] = trimCookie.substring(cookieName.length + 1, trimCookie.length)
        .replace(/_{\.,}_/g, ';');
      return cookieCache[cookieName];
    }
  }
  return '';
}

export function cookieDelete(cookieName: string) {
  doc.cookie = cookieName + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  delete cookieCache[cookieName];
}

// LocalStorage
export function localStorageSet(key: string, value: any) {
  localStorage.setItem(key,
    typeof value == 'string'
      ? value
      : JSON.stringify(value)
  );
}

export function localStorageGet(name: string, json = false): any | undefined {
  const value = localStorage.getItem(name);
  return value
    ? (json ? JSON.parse(value) : value)
    : undefined;
}

export function localStorageDelete(name: string) {
  localStorage.removeItem(name);
}

// Support functions
function keepArrayPositiveValues<T>(array: T[]): T[] {
  return array.filter(Boolean);
}
