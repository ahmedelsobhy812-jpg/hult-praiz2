/* Step state, saved draft and guarded navigation. */
window.HPNav = (function () {
  var cfg = window.HP_CONFIG;
  var STEPS = ["home", "personal", "academic", "committee", "review", "success"];

  var state = {
    step: "home",
    reached: 0, // highest step index the user may open
    data: { callingCode: "+20" },
    skills: [],
    skillsFor: "",
    requestId: null,
    result: null
  };
  var listener = function () {};

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(cfg.DRAFT_KEY) || "null");
      if (s && s.data) {
        state.data = s.data;
        state.skills = s.skills || [];
        state.skillsFor = s.skillsFor || "";
        state.reached = Math.min(s.reached || 0, 4);
        state.requestId = s.requestId || null;
      }
    } catch (e) {}
  }
  function save() {
    try {
      localStorage.setItem(cfg.DRAFT_KEY, JSON.stringify({
        data: state.data, skills: state.skills, skillsFor: state.skillsFor,
        reached: state.reached, requestId: state.requestId
      }));
    } catch (e) {}
  }
  function clearDraft() { try { localStorage.removeItem(cfg.DRAFT_KEY); } catch (e) {} }

  function index(name) { return STEPS.indexOf(name); }
  function unlock(name) { var i = index(name); if (i > state.reached && i < 5) { state.reached = i; save(); } }

  function canEnter(name) {
    if (name === "home") return true;
    if (name === "success") return !!state.result;
    return index(name) >= 0 && index(name) <= state.reached;
  }

  function go(name, opts) {
    if (!canEnter(name)) name = index(name) > 0 ? STEPS[Math.min(state.reached, 4)] : "home";
    state.step = name;
    if (!(opts && opts.fromHash)) { try { history.replaceState(null, "", "#" + name); } catch (e) {} }
    window.scrollTo(0, 0);
    listener();
  }

  window.addEventListener("hashchange", function () {
    var h = (location.hash || "").replace("#", "");
    if (index(h) >= 0 && h !== state.step) go(h, { fromHash: true });
  });

  return {
    STEPS: STEPS, state: state, load: load, save: save, clearDraft: clearDraft,
    go: go, unlock: unlock, canEnter: canEnter,
    onChange: function (fn) { listener = fn; }
  };
})();
