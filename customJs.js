// ==UserScript==
// @name        ### CUSTOM JS v0.4.8 ###
// @version     0.4.8
// @namespace   Violentmonkey Scripts
// @match       *://*/*
// @run-at      document-start
// @grant       none
// @author      oar/scopp
// @downloadURL http://scopz.github.io/custom-front-js-mods/customJs.js
// @updateURL   http://scopz.github.io/custom-front-js-mods/customJs.js
// ==/UserScript==

/*
 * oar.onload(callback)
 *   send callback to be executed DOMContentLoaded
 *
 * oar.onkeydebug()
 *   show keyboard events to console
 *
 * oar.onkey('shift+ctrl+alt', keyCode, callback)
 *   sets a hotkey action. keyCode can be key (string) or keyCode (numeric)
 *
 * oar.checkInsert(callback(element))
 *   each time a new element is inserted by using appendChild or insertBefore is sent to the callback
 *
 * oar.getCursorPosition()
 *   returns current cursor position
 *
 * oar.lastContextMenuPosition -> [number, number]
 *   is the position of the last (or current) opened contextMenu
 *
 * oar.contextMenu(position, dataArray, toggle = false)
 *   position can be undefined or [x, y, scroll?]
 *   if toggle and the context menu is opened, it'll closed and nothing else will be done
 *
 *   USAGE EXAMPLE:
 *     oar.contextMenu([50, 50], [
 *          { type: 'separator' },
 *          { type: 'title', name: 'TITLE' },
 *          {
 *            name: 'FOLDER',
 *            type: 'folder',
 *            style: 'font-weight: bold'
 *            options: [
 *              {
 *                name: "LINK",
 *                type: 'link',
 *                target: '_blank',
 *                link: 'https://www.google.com'
 *              },
 *              {
 *                name: "FUNCTION",
 *                function: () => alert('function call')
 *              }
 *            ]
 *          },
 *          {
 *            name: "CHECKED",
 *            toggle: () => true,
 *            disableFastToggle: true,
 *            function: newValue => testChecked = newValue
 *          }
 *        ], [testChecked])
 *
 * oar.isContextMenuOpened()
 *   returns true if the context menu is opened
 *
 * oar.closeContextMenu()
 *   closes context menu if opened
 *
 * oar.menus.sharedX
 *   there are 3 shared contextual menus (X can be 1, 2 or 3)
 *   these menus can be opened with F1,F2,F3 or shift+ctrl+1,2,3
 *
 * oar.showMessage(text, color, options = {})
 *   good can be true (for success), false (for errors), or any css color
 *   options can be:
 *     blackText -> true to make the text black (white by default)
 *     fontSize -> string with css fontSize (13px by default)
 *     width -> number in pixels (300 by default)
 *     time -> timeout time in milliseconds (3500 by default)
 *
 * oar.slideAnimation(up = true, color = '#000A', time = 250, fadeTime = 250)
 *   Starts an animatio that will fill all screen.
 *   Mostly used to enable or disable a feature.
 */

const oar = window.oar = unsafeWindow.oar = {};

(() => {
  'use strict';

  oar.onload = function(callback) {
    document.addEventListener("DOMContentLoaded", callback);
  }

  oar.onkey = function(modificators, hotkey, callback) {
    window.addEventListener('keydown', ev => {
      if (
        (ev.key?.toLowerCase() === hotkey || ev.keyCode === hotkey) &&
        (modificators.indexOf('ctrl') >= 0? ev.ctrlKey : true) &&
        (modificators.indexOf('shift') >= 0? ev.shiftKey : true) &&
        (modificators.indexOf('alt') >= 0? ev.altKey : true)
      ) callback(ev);
    }, true);
  }

  oar.onkeydebug = () => window.addEventListener('keydown', console.log, true);

  const currentCursorPosition = [0, 0];
  oar.getCursorPosition = () => [...currentCursorPosition];

  window.addEventListener('mousemove', ev => {
    currentCursorPosition[0] = ev.clientX;
    currentCursorPosition[1] = ev.clientY;
  }, true);

  const appendChildOriginal = HTMLElement.prototype.appendChild;
  const insertBeforeOriginal = HTMLElement.prototype.insertBefore;
  const insertChecks = [];

  oar.checkInsert = function(callback) {
    insertChecks.push(callback);
    if (insertChecks.length == 1) {
      HTMLElement.prototype.appendChild = function(element) {
        insertChecks.forEach(a => a(element));
        appendChildOriginal.apply(this, arguments);
      }

      HTMLElement.prototype.insertBefore = function(element) {
        insertChecks.forEach(a => a(element));
        insertBeforeOriginal.apply(this, arguments);
      }
    }
  }

  oar.removeCheckInsert = function(callback) {
    const idx = insertChecks.indexOf(callback);
    if (idx >= 0) {
      insertChecks.splice(idx, 1);

      if (insertChecks.length == 0) {
        HTMLElement.prototype.appendChild = appendChildOriginal;
        HTMLElement.prototype.insertBefore = insertBeforeOriginal;
      }
    }
  }

})();

// ########################
// ######## CONTEXTUAL MENU
// ########################
((win, doc) => {
  const DELAY_TIME = 240;
  const X_POSITION = 10;
  const MAIN_ELEMENT_ID = 'oar_contextual-menu';

  function createElement(tag, id, parent){
    const element = doc.createElement(tag);
    if (id) {
      if (id.startsWith('#')) element.id = id.substr(1);
      else                    element.className = id;
    }
    if (parent) parent.appendChild(element);
    return element;
  }

  let contMenuContainer;

  function contextMenuInit(parent = doc.body) {
    contMenuContainer?.parentNode.removeChild(contMenuContainer);
    contMenuContainer = createElement('div', '#'+MAIN_ELEMENT_ID, parent);

    const css = `#${MAIN_ELEMENT_ID}, .contextual-folder { position: fixed; visibility: hidden; background-color: #e7e7e7; border: 1px solid #999; width: 211px; padding: 3px; box-shadow: 0px 0px 10px -5px black; z-index: 99999999; box-sizing: initial; }
      .cm-item { display: block; color: #000; text-decoration: none; border: 1px solid transparent; padding: 7px; font-size: 13px; font-family: "Open Sans",Tahoma,Geneva,sans-serif,segoe ui; cursor: default; line-height: normal; -webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none; }
      .cm-item:hover { text-decoration: none; color: #000; }
      .cm-item.folder { background-image:url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAHCAYAAAAvZezQAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAAAFlJREFUeNpMyKERwkAQAMBNMpEY5ou4rwGfEqADJL3QABqVLlLD1YGMOgTDwMoVEfeImKtKVRlxw7P3foAhIsrHhvPo54THf2y4fGPFkpmvqbV2xDUzd3gPAGHaFk4OS4BwAAAAAElFTkSuQmCC'); background-repeat: no-repeat; background-position: 198px center; }
      .cm-item:hover,.cm-item.active { background-color: #ccc; border-color: #999; }
      .cm-item-title { color: #555; font-family: "Open Sans",Tahoma,Geneva,sans-serif,segoe ui; padding: 3px 5px 0px; font-size: 10px; font-weight: bold; }
      .cm-toggle-checkbox{ float:right; margin: 2px 5px 0 0;}
      #${MAIN_ELEMENT_ID} hr { border: solid #ccc; border-width: 0 0 1px 0; margin: 2px 1px; }
      #${MAIN_ELEMENT_ID} > a,.contextual-folder > a { color: #000 }`;

    const el = doc.createElement('style');
    el.type = 'text/css';
    el.innerText = css;
    document.head.appendChild(el);
  }

  function setCMContent(array){
    while (contMenuContainer.firstChild){
      contMenuContainer.removeChild(contMenuContainer.firstChild);
    }

    addCMContent(contMenuContainer, array);
  }

  function showCM(x, y){
    oar.lastContextMenuPosition = [x, y];

    // Adjust coords
    const cmw = contMenuContainer.offsetWidth;
    const cmh = contMenuContainer.offsetHeight;

    let ww = doc.body.offsetWidth;
    let wh = win.innerHeight;

    x -= X_POSITION;
    if (x < 0) x = 0;

    if ((x + cmw) > ww) x = ww - cmw;
    if ((y + cmh) > wh) y -= cmh;

    contMenuContainer.style.top = y + 'px';
    contMenuContainer.style.left = x + 'px';
    contMenuContainer.style.visibility = 'visible';

    win.addEventListener('mousedown', function(event){
      if (event.target.classList[0] != 'cm-item' && event.target.classList[0] != 'cm-toggle-checkbox'){
        hideCM();
      }
    });
  }

  let closeFolderTimer;
  function addCMContent(root, array){
    let showTimeout = undefined;

    let lastIsSeparator = true;
    let pendingSeparator = false;


    function closeSubFolders() {
      const folders = [...root.getElementsByClassName('contextual-folder')];
      const anyFolderIsVisible = folders.some(folder => folder.style.visibility != 'hidden')

      if (anyFolderIsVisible) {
        clearTimeout(showTimeout);
        closeFolderTimer = setTimeout(() => {
          folders.forEach(f => f.style.visibility = 'hidden');
        }, DELAY_TIME);
      }
    }

    array
      .filter(entry => !entry.condition || entry.condition())
      .forEach(entry => {
        if (entry.type == 'separator'){
          if (!lastIsSeparator) {
            lastIsSeparator = true;
            pendingSeparator = true;
          }
          return;
        }
        if (pendingSeparator) {
          pendingSeparator = false;
          createElement('hr', false, root);
        }
        lastIsSeparator = false;

        if (entry.type == 'title'){
          const elementRoot = createElement('div', 'cm-item-title', root);
          elementRoot.textContent = entry.name;
          if (entry.style) elementRoot.setAttribute('style', entry.style);

        } else if (entry.type == 'folder'){
          const elementRoot = createElement('div', 'cm-item folder', root);
          const title = createElement('span', 'cm-title', elementRoot);
          title.textContent = entry.name;
          if (entry.style) title.setAttribute('style', entry.style);
          title.style.pointerEvents = 'none';

          const subFolderElement = createElement('div', 'contextual-folder', root);

          const showSubFolder = () => {
            clearTimeout(closeFolderTimer);
            clearTimeout(showTimeout);

            [...root.getElementsByClassName('contextual-folder')]
              .filter(folder => folder != subFolderElement)
              .forEach(folder => folder.style.visibility = 'hidden');

            showCMFolder(elementRoot.offsetLeft, elementRoot.offsetTop, subFolderElement);
            return false;
          };

          elementRoot.onclick = elementRoot.oncontextmenu = showSubFolder;

          elementRoot.onmouseenter = ev => {
            clearTimeout(closeFolderTimer);
            showTimeout = setTimeout(showSubFolder, DELAY_TIME);
          };
          elementRoot.onmouseleave = ev => {
            clearTimeout(showTimeout);
            showTimeout = undefined;
          };

          subFolderElement.style.position = 'absolute';
          subFolderElement.style.left = '209px';
          subFolderElement.style.top = `${elementRoot.offsetTop - 3}px`;
          subFolderElement.style.visibility = 'hidden';

          subFolderElement.onmouseenter = ev => elementRoot.classList.add('active');
          subFolderElement.onmouseleave = ev => elementRoot.classList.remove('active');

          addCMContent(subFolderElement, entry.options);

        } else if (entry.type == 'link') {
          const elementRoot = createElement('a', 'cm-item', root);
          const title = createElement('span', 'cm-title', elementRoot);
          title.textContent = entry.name;
          if (entry.style) title.setAttribute('style', entry.style);
          title.style.pointerEvents = 'none';

          elementRoot.href = entry.link;
          elementRoot.target = entry.target;
          elementRoot.onclick = hideCM;
          elementRoot.onmouseenter = closeSubFolders

        } else if (entry.toggle) {
          const elementRoot = createElement('div', 'cm-item', root);
          const title = createElement('span', 'cm-title', elementRoot);
          title.textContent = entry.name;
          if (entry.style) title.setAttribute('style', entry.style);
          title.style.pointerEvents = 'none';

          const checkbox = createElement('input', 'cm-toggle-checkbox', elementRoot);
          checkbox.type = 'checkbox';
          checkbox.style.pointerEvents = 'none';
          checkbox.checked = entry.toggle();

          function action(button) {
            checkbox.checked = !checkbox.checked;
            if('context' in entry)
              entry.function.call(entry.context, checkbox.checked, button);
            else
              entry.function(checkbox.checked, button);
          }

          elementRoot.onclick = () => {
            hideCM();
            action(1);
            return false;
          };
          elementRoot.onauxclick = () => {
            if (entry.disableFastToggle) {
              hideCM();
            }
            action(3);
            return false;
          };
          elementRoot.oncontextmenu = ev => ev.preventDefault() ? false : false;
          elementRoot.onmouseenter = closeSubFolders

        } else {
          const elementRoot = createElement('div', 'cm-item', root);
          const title = createElement('span', 'cm-title', elementRoot);
          title.textContent = entry.name;
          if (entry.style) title.setAttribute('style', entry.style);
          title.style.pointerEvents = 'none';

          function action(button) {
            hideCM();
            if('context' in entry)
              entry.function.call(entry.context, button);
            else
              entry.function(button);
          }

          elementRoot.onclick = ev => {
            ev.preventDefault();
            action(1)
            return false;
          };
          elementRoot.onauxclick = ev => {
            ev.preventDefault();
            action(3)
            return false;
          };

          elementRoot.oncontextmenu = ev => ev.preventDefault() ? false : false;
          elementRoot.onmouseenter = closeSubFolders
        }
      });
  }

  function showCMFolder(cmx, cmy, folder){
    const ww = doc.body.offsetWidth;
    const wh = win.innerHeight;
    const w = folder.offsetWidth;
    const h = folder.offsetHeight;

    let x = folder.offsetLeft;
    if (cmx > x) x = 209;

    let y = folder.offsetTop;
    if ((cmy - 10) > y) y += h - 28;

    const folderPos = folder.getBoundingClientRect();
    const absx = folderPos.x + 1;
    const absy = folderPos.y + 1;

    folder.style.left = (absx + w) > ww ? '-211px': '209px';
    folder.style.top = (absy + h) > wh ? (cmy - h + 25) + 'px': (cmy - 3) + 'px';

    folder.style.visibility = 'visible';
  }

  function hideCM(){
    contMenuContainer.style.visibility = 'hidden';
    [...contMenuContainer.getElementsByClassName('contextual-folder')]
      .forEach(folder => folder.style.visibility = 'hidden');
  }


  oar.onload(ev => contextMenuInit());
  oar.contextMenu = function(position, dataArray, toggle = false) {
    if (toggle) {
      if (contMenuContainer.style.visibility == 'visible') {
        hideCM();
        return;
      }
    }
    if (!dataArray.length) return;
    const [x, y, scroll] = position?.length ? position : oar.getCursorPosition();

    setCMContent(dataArray);
    showCM(x, y + (scroll? window.scrollY : 0));
  }

  oar.isContextMenuOpened = () => contMenuContainer.style.visibility == 'visible';
  oar.closeContextMenu = () => hideCM();

  oar.menus = { shared1: [], shared2: [], shared3: [] };
  oar.onkey('shift+ctrl', 49, () => oar.contextMenu(undefined, oar.menus.shared1, true)); // 1
  oar.onkey('shift+ctrl', 50, () => oar.contextMenu(undefined, oar.menus.shared2, true)); // 2
  oar.onkey('shift+ctrl', 51, () => oar.contextMenu(undefined, oar.menus.shared3, true)); // 3

  oar.onkey('', 112, () => oar.contextMenu(undefined, oar.menus.shared1, true)); // F1
  oar.onkey('', 113, () => oar.contextMenu(undefined, oar.menus.shared2, true)); // F2
  oar.onkey('', 114, () => oar.contextMenu(undefined, oar.menus.shared3, true)); // F3

})(window, document);


// ########################
// ############### MESSAGES
// ########################
((win, doc) => {
  'use strict';

  const MAIN_ELEMENT_ID = 'oar_message-container';
  const DEFAULT_TIME = 3500;
  const PADDING = 10;
  const BOTTOM_MARGIN = 10;
  const WIDTH = 300;

  const messages = [];
  let messageContainer;

  function messageInit() {
    messageContainer?.parentNode.removeChild(messageContainer);
    messageContainer = doc.createElement('div');
    messageContainer.id = MAIN_ELEMENT_ID;
    doc.body.appendChild(messageContainer);

    const css = `#${MAIN_ELEMENT_ID} .message { font-family: "Open Sans",Tahoma,Geneva,sans-serif,segoe ui; z-index: 99999999; position:fixed; bottom:0; transition: right 0.3s, bottom 0.5s; padding: 10px 14px; background-color:#444; box-shadow: 0px 0px 6px -2px #000; border:solid #444; border-width:1px 0 1px 1px; } #${MAIN_ELEMENT_ID} .message span{ color: white; font-size: 13px; } #${MAIN_ELEMENT_ID} .message.good { border-color: #0C7B19; background-color: #60BC38; } #${MAIN_ELEMENT_ID} .message.bad { border-color: #7B0C0C; background-color: #C83838; }`;
    const el = doc.createElement('style');
    el.type = 'text/css';
    el.innerText = css;
    document.head.appendChild(el);
  }

  function showMessage(text, good, options = {}) {
    const msg = doc.createElement('div');
    const span = doc.createElement('span');

    msg.classList.add('message');
    span.innerHTML = text;
    if (good !== undefined) {
      if (typeof good === 'boolean') {
        msg.classList.add(good? 'good' : 'bad');
      } else if (typeof good === 'string') {
        msg.style.backgroundColor = good;
        msg.style.borderColor = '#000';
      }
    }
    if (options?.blackText) {
      span.style.color = 'black';
    }
    if (options?.fontSize) {
      span.style.fontSize = options.fontSize;
    }
    const messageWidth = options?.width ?? WIDTH;

    msg.style.bottom = calcBottom();
    msg.style.right = `-${messageWidth}px`;
    msg.style.minWidth = `${messageWidth}px`;
    messages.push(msg);

    msg.delete = () => {
      const idx = messages.indexOf(msg);
      if (idx >= 0) {
        messages.splice(idx, 1);
        msg.style.right = `-${msg.offsetWidth}px`;
        reCalc();
        msg.ontransitionend = ev => {
          if (ev.propertyName == 'right')
            messageContainer?.removeChild(msg);
        };
      }
    };

    messageContainer?.appendChild(msg);
    msg.appendChild(span);

    setTimeout(msg.delete, options?.time ?? DEFAULT_TIME);
    msg.onmouseover = msg.delete;

    if (msg.offsetHeight > 0) {
      msg.style.right = '0px';
    }
  }

  function calcBottom() {
    return messages
      .map(m => m.offsetHeight)
      .reduce((sum, e) => sum + e, BOTTOM_MARGIN + messages.length * PADDING) + 'px';
  }

  function reCalc() {
    let bottom = BOTTOM_MARGIN;

    messages.forEach(message => {
      message.style.bottom = bottom + 'px';
      bottom += message.offsetHeight + PADDING;
    });
  }

  oar.onload(ev => messageInit());
  oar.showMessage = showMessage;
})(window, document);


// #############################
// ##### SLIDE UP/DOWN ANIMATION
// #############################
(() => {
  function animateElement(color) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.left = overlay.style.right = overlay.style.bottom = 0;
    overlay.style.height = '100%';
    overlay.style.opacity = 1;
    overlay.style.backgroundColor = color;
    overlay.style.zIndex = '999999999999999';

    document.body.appendChild(overlay);
    overlay.ontransitionend = e => {
      const propertyValue = overlay.style[e.propertyName];
      if (propertyValue == 0 || propertyValue == '0px') {
        document.body.removeChild(overlay);
      }
    }

    return overlay;
  }

  function animateUp(color = '#000A', time = 250, fadeTime = 250) {
    const overlay = animateElement(color);
    overlay.style.height = 0;
    overlay.style.transition = `height ${time/1000}s, opacity ${fadeTime/1000}s ${time/1000}s`;

    setTimeout(() => {
      overlay.style.height = '100%';
      overlay.style.opacity = 0;
    }, 10);
  }


  function animateDown(color = '#000A', time = 250, fadeTime = 250) {
    const overlay = animateElement(color);
    overlay.style.opacity = 0;
    overlay.style.transition = `height ${time/1000}s ${fadeTime/1000}s, opacity ${fadeTime/1000}s`;

    setTimeout(() => {
      overlay.style.height = 0;
      overlay.style.opacity = 1;
    }, 10);
  }

  oar.slideAnimation = function(up = true, color = '#000A', time = 250, fadeTime = 250) {
    up? animateUp(color, time, fadeTime) : animateDown(color, time, fadeTime)
  }

})();