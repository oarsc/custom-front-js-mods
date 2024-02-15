// ==UserScript==
// @name        ### CUSTOM JS v0.2.3 ###
// @version     0.2.3
// @namespace   Violentmonkey Scripts
// @match       *://*/*
// @run-at      document-start
// @grant       none
// @author      oar/scopp
// @downloadURL http://scopz.github.io/custom-front-js-mods/customJs.js
// @updateURL   http://scopz.github.io/custom-front-js-mods/customJs.js
// ==/UserScript==

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

})();

// ########################
// ######## CONTEXTUAL MENU
// ########################
((win, doc) => {
  const DELAY_TIME = 240;
  const X_POSITION = 10;

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
    contMenuContainer = createElement('div', '#contextual-menu', parent);

    const css = `#contextual-menu,.contextual-folder{ position: fixed; visibility: hidden; background-color: #e7e7e7; /*#f0f0f0*/ border: 1px solid #999; /*#979797*/ width: 211px; padding: 3px; /*2px;*/ box-shadow: 0px 0px 10px -5px black; /*3px 3px 2px rgba(0,0,0,0.5);*/ z-index: 90; } .cm-item{ display: block; color: #000; text-decoration: none; border: 1px solid transparent; padding: 7px; /*1px 7px 2px;*/ font-size: 13px; /*12px;*/ font-family: "Open Sans",Tahoma,Geneva,sans-serif,segoe ui; /*segoe ui;*/ cursor: default; -webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none; } .cm-item:hover{ text-decoration: none; color: #000; } .cm-item.folder{ background-image:url('data:image/png;base64,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'); background-repeat: no-repeat; background-position: 198px center; } .cm-item:hover,.cm-item.active{ background-color: #ccc; /*#d1e2f2;*/ border-color: #999; /*#78aee5;*/ } .cm-toggle-checkbox{ float:left; float:right; margin-right:5px; margin-left:0px;} #contextual-menu,.contextual-folder hr{ border: solid #ccc; /*#d7d7d7;*/ border-width: 0 0 1px 0; margin: 2px 1px; /*1px 1px 2px;*/ }.contextual-folder > a{color: #000}`;
    const el = doc.createElement('style');
    el.type = 'text/css';
    el.innerText = css;
    document.head.appendChild(el);
  }

  function setCMContent(array, toggleArray){
    while (contMenuContainer.firstChild){
      contMenuContainer.removeChild(contMenuContainer.firstChild);
    }

    addCMContent(contMenuContainer, array, toggleArray);
  }

  function showCM(x,y){
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

    /*
    let backup = win.onmousedown;
    win.onmousedown = function(event){
      if (event.target.classList[0] != 'cm-item'){
        hideCM();
        win.onmousedown = backup;
      }
    };*/

    win.addEventListener('mousedown', function(event){
      if (event.target.classList[0] != 'cm-item' && event.target.classList[0] != 'cm-toggle-checkbox'){
        hideCM();
      }
    });
  }

  let closeFolderTimer;
  function addCMContent(root, array, toggleArray){
    let toggleCount = 0;
    let tout = undefined;

    array.forEach(function(entry) {
      if (entry.type=='separator'){
        createElement('hr', false, false, root);
        return;
      }

      if (entry.type=='folder'){

        const di = createElement('div', 'cm-item folder', root);
        const contextFolder = createElement('div', 'contextual-folder', root);

        const showContext = function(){
          clearTimeout(closeFolderTimer);
          clearTimeout(tout);

          [...root.getElementsByClassName('contextual-folder')]
            .filter(folder => folder != contextFolder)
            .forEach(folder => folder.style.visibility = 'hidden');

          showCMFolder(di.offsetLeft,di.offsetTop,contextFolder);
          return false;
        };

        contextFolder.style.position='absolute';
        contextFolder.style.left='209px';
        contextFolder.style.top=(di.offsetTop-3)+'px';
        contextFolder.style.visibility='hidden';

        contextFolder.onmouseenter = ev => di.classList.add('active');
        contextFolder.onmouseleave = ev => di.classList.remove('active');

        di.onclick = showContext;
        di.oncontextmenu = showContext;

        di.onmouseenter = ev => {
          clearTimeout(closeFolderTimer);
          tout=setTimeout(showContext,DELAY_TIME);
        };
        di.onmouseleave = ev => {
          clearTimeout(tout);
          tout = undefined;
        };

        const spanname = createElement('span', 'cm-title', di);
        spanname.textContent = entry.name;
        spanname.style.pointerEvents = 'none';

        addCMContent(contextFolder, entry.options);

      } else if (entry.type=='link') {
        const di = createElement('a', 'cm-item');
        const spanname = createElement('span', 'cm-title', di);
        di.href = entry.link;

        spanname.textContent = entry.name;
        spanname.style.pointerEvents = 'none';

        di.onclick = ev => hideCM();
        //di.onmousedown = function(e){console.log(e.buttons); if (e.buttons>3) hideCM();};
        di.onmouseenter = function(){
          let folders = [...root.getElementsByClassName('contextual-folder')];
          for (let folder of folders) {
            if (folder.style.visibility != 'hidden'){
              clearTimeout(tout);
              closeFolderTimer = setTimeout(function(){
                folders.forEach(f => f.style.visibility = 'hidden');
              }, DELAY_TIME);
              break;
            }
          }
        };
        root.appendChild(di);

      } else {
        let fun = (button) => {
          return function(event) {
            event.preventDefault();
            hideCM();
            if('context' in entry)
              entry.function.call(entry.context, button);
            else
              entry.function(button);
            return false;
          };
        };
        let fun2 = fun;

        const di = createElement('div', 'cm-item');
        const spanname = createElement('span', 'cm-title', di);

        spanname.textContent = entry.name;
        spanname.style.pointerEvents = 'none';

        if (entry.toggled){
          const checkbox = createElement('input', 'cm-toggle-checkbox');
          checkbox.type='checkbox';
          checkbox.style.pointerEvents = 'none';
          checkbox.checked = toggleArray[toggleCount++];

          di.appendChild(checkbox);

          fun = (button) => {
            return function() {
              checkbox.checked = !checkbox.checked;
              hideCM();
              if('context' in entry)
                entry.function.call(entry.context,checkbox.checked, button);
              else
                entry.function(checkbox.checked, button);
              return false;
            };
          };

          fun2 = (button) => {
            return function() {
              checkbox.checked = !checkbox.checked;
              if('context' in entry)
                entry.function.call(entry.context,checkbox.checked, button);
              else
                entry.function(checkbox.checked, button);
              return false;
            };
          };
        }

        di.onclick = fun(1);
        di.oncontextmenu = ev => ev.preventDefault() ? false : false;
        di.onauxclick = fun2(3);
        //di.onmousedown = function(e){console.log(e.buttons); if (e.buttons>3) hideCM();};
        di.onmouseenter = function(){
          let folders = [...root.getElementsByClassName('contextual-folder')];
          for (let folder of folders) {
            if (folder.style.visibility != 'hidden'){
              clearTimeout(tout);
              closeFolderTimer = setTimeout(function(){
                folders.forEach(f => f.style.visibility = 'hidden');
              }, DELAY_TIME);
              break;
            }
          }
        };
        root.appendChild(di);
      }
    });
  }

  function showCMFolder(cmx,cmy,folder){
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
  oar.contextMenu = function(position, dataArray, toggleArray) {
    if (!dataArray.length) return;
    const [x, y, noScroll] = position?.length ? position : oar.getCursorPosition();

    setCMContent(dataArray, toggleArray);
    showCM(x, y - (noScroll? 0 : window.scrollY));
  }
  /* EXAMPLE:
  let testChecked = true;
  oar.onkey('', 'a', () => {

    oar.contextMenu([50, 50], [
      {
        name: 'FOLDER',
        type: 'folder',
        options: [
          {
            name: "LINK",
            type: 'link',
            link: 'https://www.google.com'
          },
          {
            name: "FUNCTION",
            function: () => alert('function call')
          }
        ]
      },
      {
        name: "CHECKED",
        toggled: true,
        function: newValue => testChecked = newValue
      }
    ], [testChecked])

  });
  */
  oar.menus = { shared1: [], shared2: [], shared3: [] };
  oar.onkey('shift+ctrl', 49, () => oar.contextMenu(undefined, oar.menus.shared1)); // 1
  oar.onkey('shift+ctrl', 50, () => oar.contextMenu(undefined, oar.menus.shared2)); // 2
  oar.onkey('shift+ctrl', 51, () => oar.contextMenu(undefined, oar.menus.shared3)); // 3
})(window, document);

