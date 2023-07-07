// version 2.2.0

const doc = document;

export function createElement(tag, id, parent){
	const element = doc.createElement(tag);
	if (id) {
		if (id.startsWith('#')) element.id = id.substr(1);
		else element.className = id;
	}
	parent?.appendChild(element);
	return element;
}

export function getElementById(id){
	return doc.getElementById(id);
}

export function querySelectorAll(selector, parent = doc){
	return [...parent.querySelectorAll(selector)];
}

export function querySelector(selector, parent = doc){
	return parent.querySelector(selector);
}

export function getElementsByClassName(className, parent = doc){
	return [...parent.getElementsByClassName(className)];
}

export function getElementsByTagName(tagName, parent = doc) {
	return [...parent.getElementsByTagName(tagName)];
}

export function hasClass(element, ...classes){
	return keepArrayPositiveValues(classes).every(c => element.classList.contains(c));
}

export function addClass(element, ...classes){
	keepArrayPositiveValues(classes).forEach(c => element.classList.add(c));
}

export function removeClass(element, ...classes){
	keepArrayPositiveValues(classes).forEach(c => element.classList.remove(c));
}

export function toggleClass(element, ...classes){
	const lastIndex = classes.length-1;
	if (lastIndex >= 0 && typeof classes[lastIndex] == 'boolean') {
		const enable = classes[lastIndex];
		keepArrayPositiveValues(classes.slice(0, lastIndex))
			.forEach(c => element.classList.toggle(c, enable));
	} else {
		keepArrayPositiveValues(classes).forEach(c => element.classList.toggle(c));
	}
}

export function also(object, callbackFn) {
	callbackFn(object);
	return object;
}

export function pipe(object, callbackFn) {
	return callbackFn(object);
}

export function generateFromTemplate(id){
	const temp = getElementById(id);
	return temp?.content.firstElementChild?.cloneNode(true);
}

export function isNumeric(value) {
	if (value) {
		const float = parseFloat(value);
		return !isNaN(float) && isFinite(float);
	}
	return false;
}

export function ajax(urlStr, params, options = {}) {
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

export function redirectPost(url, data) {
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
const cookieCache = {};
export function cookieSet(cName, cValue, expirationDays){
	const d = new Date();
	d.setTime(d.getTime() + (expirationDays*86400000)); // 24*60*60*1000
	const expires = 'expires='+d.toUTCString();
	cookieCache[cName]=cValue;
	cValue = (''+cValue).replace(/\;/g,'_{.,}_');
	doc.cookie = cName + '=' + cValue + '; ' + expires;
}

export function cookieGet(cName){
	if (cookieCache[cName]!=undefined){
		return cookieCache[cName];
	}
	const name = cName + '=';
	const ca = doc.cookie.split(';');
	for (const c of ca) {
		while (c.charAt(0)==' ') c = c.substring(1);
		if (c.indexOf(name) != -1){
			const cValue = c.substring(name.length,c.length);
			cValue = cValue.replace(/_{\.,}_/g,';');
			cookieCache[cName]=cValue;
			return cValue;
		}
	}
	return '';
}

export function cookieDelete(cName){
	doc.cookie = cName+'=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
	cookieCache[cName]=undefined;
}

// LocalStorage
export function localStorageSet(name, value, json = false){
	if (json) {
		value = JSON.stringify(value);
	}
	localStorage.setItem(name, value);
}

export function localStorageGet(name, json = false){
	const value = localStorage.getItem(name);
	return value
		? (json ? JSON.parse(value) : value)
		: undefined;
}

export function localStorageDelete(name){
	localStorage.removeItem(name);
}

// Support functions
function keepArrayPositiveValues(array) {
	return array.filter(Boolean);
}
