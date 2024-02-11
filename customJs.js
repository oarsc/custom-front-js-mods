// ==UserScript==
// @name        ### CUSTOM JS v0.1 ###
// @version     0.1
// @namespace   Violentmonkey Scripts
// @match       *://*/*
// @run-at      document-start
// @grant       none
// @author      oar/scopp
// @downloadURL http://scopz.github.io/custom-front-js-mods/customJs.js
// @updateURL   http://scopz.github.io/custom-front-js-mods/customJs.js
// ==/UserScript==

const oar = window.oar = {};
(() => {
  'use strict';

  oar.onload = function(callback) {
    if (callback) document.addEventListener("DOMContentLoaded", callback);
  }
})();