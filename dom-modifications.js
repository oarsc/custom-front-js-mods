// version 2.0.1

(function(htmlElementPrototype){
	htmlElementPrototype.isHidden = function(){
		return this.offsetWidth === 0 && this.offsetHeight === 0;
	};

	htmlElementPrototype.isVisible = function(){
		return !this.isHidden();
	};
	
	htmlElementPrototype.show = function(display){
		if (display == undefined) {
			display = 'revert';
			display = window.CSS?.supports('display', display)? display : '';
		}

		this.style.display = display;
	};

	htmlElementPrototype.hide = function(){
		this.show('none');
	};

	htmlElementPrototype.remove = function() {
		this.parentNode.removeChild(this);
	};

	htmlElementPrototype.previousSiblings = function() {
		const result = [];
		let element = this;
		while (element = element.previousElementSibling)
			result.push(element);
		return result;
	};

	htmlElementPrototype.nextSiblings = function() {
		const result = [];
		let element = this;
		while (element = element.nextElementSibling)
			result.push(element);
		return result;
	};

	htmlElementPrototype.closest = function(selector) {
		if (this == document.body){
			return undefined;
		} else {
			const parent = this.parentNode;
			return parent.matches(selector)? parent : parent.closest(selector);
		}
	};

	htmlElementPrototype.clear = function() {
		while (this.firstChild){ 
			this.removeChild(this.firstChild);
		}
	};

})(HTMLElement.prototype);


(function(domTokenListPrototype){
	const ALL_ELEMENTS_TOKEN = '*';
	
	const originalAdd = domTokenListPrototype.add;
	const originalRemove = domTokenListPrototype.remove;
	const originalToggle = domTokenListPrototype.toggle;
	const originalReplace = domTokenListPrototype.replace;

	function manageCallback(self, originalAction, args) {
		const listeners = self.onChangeListeners;
		originalAction = originalAction.bind(self, ...args);

		if (listeners && Object.keys(listeners).length) {
			function callListeners(element, value) {
				listeners[ALL_ELEMENTS_TOKEN]?.forEach(f => f(element, value));
				listeners[element]?.forEach(f => f(value));
			}

			const initialClass = [...self];
			originalAction();

			initialClass.filter(element => !self.contains(element))
				.forEach(element => callListeners(element, false));

			self.forEach(element => {
				if (initialClass.indexOf(element) < 0)
					callListeners(element, true);
			});

		} else {
			originalAction();
		}
	}

	domTokenListPrototype.add = function() {     manageCallback(this, originalAdd,     arguments); };
	domTokenListPrototype.remove = function() {  manageCallback(this, originalRemove,  arguments); };
	domTokenListPrototype.toggle = function() {  manageCallback(this, originalToggle,  arguments); };
	domTokenListPrototype.replace = function() { manageCallback(this, originalReplace, arguments); };

	domTokenListPrototype.onAnyChange = function(callback) {
		this.onChange(ALL_ELEMENTS_TOKEN,callback);
	};

	domTokenListPrototype.onChange = function(element, callback) {
		if (!this.onChangeListeners) {
			this.onChangeListeners = {};
		}
		if (!this.onChangeListeners[element]?.push(callback)) {
			this.onChangeListeners[element] = [callback];
		}
	};

})(DOMTokenList.prototype);


(function(arrayPrototype){
	arrayPrototype.peek = function(fun) {
		this.forEach(fun);
		return this;
	};

	arrayPrototype.unique = function() {
		return this.filter((element, index, array) => array.indexOf(element) == index);
	};

	arrayPrototype.clear = function() {
		return this.splice(0, this.length);
	};
	
	arrayPrototype.red = function(funct, ...args) {
		return this.reduce(function(acc) {
			funct.apply(this, arguments);
			return acc;
		}, ...args);
	};
})(Array.prototype);
