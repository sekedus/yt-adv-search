/* Clear ("×") buttons for text inputs (T-0012 rev 7).
 *
 * Mirrors the built-in cancel button of `input[type="search"]` without
 * changing the input type: each `input[type="text"]` gets a wrapper span
 * plus a button that clears the value and re-fires input/change so the
 * page state (URL sync, settings dirty guard) stays consistent.
 *
 * Layout/size rules live in styles.css next to each input context
 * (.search-panel, .filtergrid, .resolve-row, .settings).
 */
(function () {
  "use strict";

  function syncOne(inp, btn) {
    var hide = inp.value === "" || inp.disabled || inp.readOnly;
    /* Hiding a focused control can trigger Chrome's blocked aria-hidden
     * warning (and drop focus). Keep the × exposed while visible and move
     * focus to the input before hiding it. */
    if (hide && document.activeElement === btn) {
      try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); }
    }
    btn.hidden = hide;
  }

  function makeClearable(inp) {
    var wrap = document.createElement("span");
    wrap.className = "inputclear";
    inp.parentNode.insertBefore(wrap, inp);
    wrap.appendChild(inp);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "clrbtn";
    btn.tabIndex = -1;
    btn.setAttribute("aria-label", "Clear");
    btn.title = "Clear";
    btn.textContent = "\u00d7";
    wrap.appendChild(btn);

    btn.addEventListener("click", function () {
      if (inp.value === "") return;
      inp.value = "";
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      inp.dispatchEvent(new Event("change", { bubbles: true }));
      inp.focus();
      syncOne(inp, btn);
    });
    inp.addEventListener("input", function () { syncOne(inp, btn); });
    inp.addEventListener("change", function () { syncOne(inp, btn); });
    syncOne(inp, btn);
  }

  function enhance() {
    var inputs = document.querySelectorAll('input[type="text"]');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].closest(".inputclear")) continue;
      makeClearable(inputs[i]);
    }
  }

  /* Pages call this after setting text inputs programmatically
   * (URL restore, Reset) so the × reflects the new value. */
  function syncAll() {
    var wraps = document.querySelectorAll(".inputclear");
    for (var i = 0; i < wraps.length; i++) {
      var inp = wraps[i].querySelector('input[type="text"]');
      var btn = wraps[i].querySelector(".clrbtn");
      if (inp && btn) syncOne(inp, btn);
    }
  }

  window.syncInputClear = syncAll;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhance);
  } else {
    enhance();
  }
})();
