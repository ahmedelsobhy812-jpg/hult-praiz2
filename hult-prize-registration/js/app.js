/* Rendering and wiring for every page. Order of scripts: config, locations, committees,
   form-validation, navigation, submission, app. */
(function () {
  var cfg = window.HP_CONFIG, loc = window.HP_LOCATIONS, committees = window.HP_COMMITTEES;
  var V = window.HPValidate, Nav = window.HPNav, Submit = window.HPSubmit;
  var state = Nav.state, root = document.getElementById("app");
  var submitting = false, pendingErrors = null, submitError = "";

  // Low-power devices skip the heavy blur and motion
  try {
    if ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || (navigator.deviceMemory && navigator.deviceMemory <= 2)) {
      document.documentElement.classList.add("lite");
    }
  } catch (e) {}

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function committeeById(id) { return committees.filter(function (c) { return c.id === id; })[0]; }

  /* ---------- small UI builders ---------- */
  var LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="none" stroke="#f63a9c" stroke-width="5"/><circle cx="16" cy="16" r="5" fill="#4e276d"/></svg>'; // TODO: replace with the official logo in assets/images
  function brand() { return '<div class="brand">' + LOGO + '<span>' + esc(cfg.COMPANY_NAME) + '</span></div>'; }

  function progress() {
    var labels = ["Personal", "Academic", "Committee", "Review"], cur = Nav.STEPS.indexOf(state.step);
    return '<ol class="progress" aria-label="Progress">' + labels.map(function (l, i) {
      var n = i + 1, cls = n < cur ? "done" : (n === cur ? "on" : "");
      return '<li class="' + cls + '"' + (n === cur ? ' aria-current="step"' : "") + '>' + l + '</li>';
    }).join("") + '</ol>';
  }

  function field(id, label, control, hint) {
    return '<div class="field" data-field="' + id + '"><label for="' + id + '">' + label + '</label>' + control +
      (hint ? '<div class="hint">' + hint + '</div>' : "") + '<div class="msg" id="msg-' + id + '" role="alert"></div></div>';
  }
  function input(id, type, extra) {
    return '<input id="' + id + '" name="' + id + '" type="' + type + '" value="' + esc(state.data[id]) + '" data-bind ' + (extra || "") + '>';
  }
  function select(id, options, placeholder, extra) {
    var cur = state.data[id];
    return '<select id="' + id + '" name="' + id + '" data-bind ' + (extra || "") + '><option value="">' + esc(placeholder || "Select") + '</option>' +
      options.map(function (o) { return '<option' + (o === cur ? " selected" : "") + '>' + esc(o) + '</option>'; }).join("") + '</select>';
  }

  /* ---------- pages ---------- */
  function homePage() {
    var resume = state.reached > 0 ? '<div class="banner info">Your saved answers are still here. Press the button to continue.</div>' : "";
    return '<div class="page" data-page="home">' + brand() +
      '<div class="glass"><h1 class="title" style="font-size:30px">' + esc(cfg.INTRO_TITLE) + '</h1>' +
      '<p class="lead" style="margin-top:10px;font-size:15.5px">' + esc(cfg.INTRO_TEXT) + '</p>' + resume +
      '<div class="actions"><button class="btn btn-primary" id="start" type="button">Start Registration</button></div></div>' +
      '<footer class="note">About 5 minutes. Your answers are saved on this device while you fill them in.</footer></div>';
  }

  function geoHTML() {
    var d = state.data, egypt = d.country === "Egypt";
    var h;
    if (egypt) {
      var cities = loc.EGYPT[d.governorate] || [];
      h = field("governorate", "Governorate", select("governorate", Object.keys(loc.EGYPT), "Choose governorate", 'autocomplete="address-level1"')) +
          field("city", "City / District", select("city", cities, d.governorate ? "Choose city" : "Choose governorate first", d.governorate ? "" : "disabled"));
    } else {
      h = field("governorate", "Governorate / State", input("governorate", "text", 'autocomplete="address-level1" maxlength="60"')) +
          field("city", "City / District", input("city", "text", 'autocomplete="address-level2" maxlength="60"'));
    }
    return '<div id="geo" class="form" style="margin:0" data-mode="' + (egypt ? "egypt" : "other") + '" data-country="' + esc(d.country || "") + '">' + h + '</div>';
  }

  function personalPage() {
    var today = new Date().toISOString().slice(0, 10);
    return '<div class="page" data-page="personal">' + brand() +
      '<div class="glass"><h2 class="title">Personal Information</h2><p class="lead">Tell us who you are.</p>' +
      '<form class="form" id="form" novalidate>' +
      field("fullName", "Full Name", input("fullName", "text", 'autocomplete="name" maxlength="80"')) +
      field("dob", "Date of Birth", input("dob", "date", 'autocomplete="bday" max="' + today + '"')) +
      field("email", "Email Address", input("email", "email", 'autocomplete="email" inputmode="email" maxlength="120"')) +
      field("gender", "Gender", select("gender", cfg.GENDERS, "Select")) +
      field("country", "Country", input("country", "text", 'list="countries" autocomplete="country-name" placeholder="Start typing to search"') +
        '<datalist id="countries">' + loc.COUNTRY_NAMES.map(function (c) { return '<option value="' + esc(c) + '">'; }).join("") + '</datalist>') +
      geoHTML() + navButtons(false) + '</form></div></div>';
  }

  function deptHTML() {
    var d = state.data;
    if (!V.deptRequired(d)) {
      var note = d.faculty && d.year ? '<div class="hint">First-year students in this faculty do not choose a department.</div>' : "";
      return '<div id="dept">' + note + '</div>';
    }
    return '<div id="dept">' + field("department", "Department", select("department", V.departmentsFor(d), "Choose department")) + '</div>';
  }

  function academicPage() {
    var d = state.data;
    var faculties = cfg.FACULTIES.map(function (f) { return f.name; });
    return '<div class="page" data-page="academic">' + brand() +
      '<div class="glass"><h2 class="title">Academic Information</h2><p class="lead">Your studies, contact number and committee.</p>' +
      '<form class="form" id="form" novalidate>' +
      field("faculty", "Faculty", select("faculty", faculties, "Choose faculty")) +
      field("year", "Academic Year", select("year", cfg.YEARS, "Choose year")) +
      deptHTML() +
      '<div class="field" data-field="phone"><span class="label">Phone Number</span><div class="row">' +
        '<select id="callingCode" name="callingCode" aria-label="Country calling code" data-bind>' +
          loc.CALLING_CODES.map(function (c) { return '<option' + (c === d.callingCode ? " selected" : "") + '>' + c + '</option>'; }).join("") + '</select>' +
        '<input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" aria-label="Phone number" value="' + esc(d.phone) + '" data-bind maxlength="16">' +
      '</div><div class="msg" id="msg-phone" role="alert"></div><div class="msg" id="msg-callingCode" role="alert"></div></div>' +
      field("academicId", "Academic ID", input("academicId", "text", 'maxlength="20" autocomplete="off"')) +
      field("nationalId", "National ID", input("nationalId", "text", 'inputmode="numeric" maxlength="14" autocomplete="off"'), "14 digits") +
      field("committee", "Committee", select("committee", committees.map(function (c) { return c.id; }), "Choose committee").replace(/<option>([a-z]+)<\/option>|<option selected>([a-z]+)<\/option>/g, function (m, a, b) {
        var id = a || b, c = committeeById(id); return '<option value="' + id + '"' + (b ? " selected" : "") + '>' + esc(c.name) + '</option>';
      })) +
      navButtons(true) + '</form></div></div>';
  }

  function committeePage() {
    var c = committeeById(state.data.committee);
    if (!c) return academicPage();
    var chosen = state.skillsFor === c.id ? state.skills : [];
    return '<div class="page" data-page="committee">' + brand() +
      '<div class="glass"><h2 class="title">Choose Your Skills</h2><p class="lead">Select the skills you can bring to this committee.</p>' +
      '<div class="committee-card"><h3>' + esc(c.name) + '</h3><p>' + esc(c.definition) + '</p></div>' +
      '<form id="form" novalidate><div class="skills" role="group" aria-label="Skills">' + c.skills.map(function (s, i) {
        var on = chosen.indexOf(s.name) >= 0;
        return '<label class="skill' + (on ? " on" : "") + '"><input type="checkbox" name="skill" value="' + esc(s.name) + '"' + (on ? " checked" : "") + '>' +
          '<div><b>' + esc(s.name) + '</b><span>' + esc(s.desc) + '</span></div></label>';
      }).join("") + '</div><div class="msg field" style="color:var(--err);font-size:12.5px;margin-top:8px" id="msg-skills" role="alert"></div>' +
      navButtons(true) + '</form></div></div>';
  }

  function reviewPage() {
    var d = state.data, c = committeeById(d.committee) || { name: "" };
    function row(l, v) { return '<div><dt>' + l + '</dt><dd>' + esc(v) + '</dd></div>'; }
    var personal = row("Full Name", d.fullName) + row("Date of Birth", d.dob) + row("Email", d.email) + row("Gender", d.gender) +
      row("Location", [d.city, d.governorate, d.country].filter(Boolean).join(", "));
    var academic = row("Faculty", d.faculty) + row("Academic Year", d.year) + (V.deptRequired(d) ? row("Department", d.department) : "") +
      row("Phone", d.callingCode + " " + V.stripZeros(d.phone)) + row("Academic ID", d.academicId) + row("National ID", d.nationalId);
    var comm = row("Committee", c.name) + row("Skills", state.skills.join(", "));
    function sec(title, step, body) {
      return '<section><header><h3>' + title + '</h3><button type="button" class="btn btn-ghost" data-go="' + step + '">Edit</button></header><dl>' + body + '</dl></section>';
    }
    return '<div class="page" data-page="review">' + brand() +
      '<div class="glass"><h2 class="title">Review Your Application</h2><p class="lead">Check everything, then submit.</p>' +
      '<div class="review">' + sec("Personal", "personal", personal) + sec("Academic", "academic", academic) + sec("Committee", "committee", comm) + '</div>' +
      (submitError ? '<div class="banner err" role="alert">' + esc(submitError) + '</div>' : "") +
      '<div class="actions"><button class="btn btn-ghost" type="button" id="back">Back</button>' +
      '<button class="btn btn-primary" type="button" id="submit">Submit Application</button></div></div></div>';
  }

  function pdfBoxHTML(pdf, busy) {
    if (busy) return '<div class="banner info">Preparing your PDF…</div>';
    if (pdf.status === "ready") return '<button class="btn btn-primary" id="dl" type="button">Download Application PDF</button>';
    if (pdf.status === "demo") return '<button class="btn btn-primary" id="dl" type="button">Download Application PDF</button><div class="banner info" id="demoNote" hidden>Demo mode: the PDF is created by the backend. Add the Apps Script URL in js/config.js to enable it.</div>';
    return '<div class="banner err">We saved your application, but the PDF could not be created.</div><button class="btn btn-pink" id="dl" type="button">Try again</button>';
  }

  function successPage() {
    var r = state.result || {};
    return '<div class="page" data-page="success">' + brand() +
      '<div class="glass success"><div class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
      '<h2 class="title">Registration Successful</h2><p class="lead">Your application has been received. Keep this reference number.</p>' +
      '<div class="ref">' + esc(r.ref) + '</div>' +
      (r.demo ? '<div class="banner info">Demo mode: nothing was sent to a server.</div>' : "") +
      '<div id="pdfbox" style="display:grid;gap:10px;width:100%">' + pdfBoxHTML(r.pdf || { status: "failed" }) + '</div>' +
      '<button class="btn btn-ghost" id="again" type="button" style="width:100%">Start a new application</button></div></div>';
  }

  function navButtons(hasBack) {
    return '<div class="actions">' + (hasBack ? '<button class="btn btn-ghost" type="button" id="back">Back</button>' : "") +
      '<button class="btn btn-primary" type="submit" id="next">Next</button></div>';
  }

  var PAGES = { home: homePage, personal: personalPage, academic: academicPage, committee: committeePage, review: reviewPage, success: successPage };

  /* ---------- errors ---------- */
  function showError(id, msg) {
    var m = document.getElementById("msg-" + id), w = root.querySelector('[data-field="' + id + '"]');
    if (m) m.textContent = msg || "";
    if (w) { w.classList.toggle("bad", !!msg); w.classList.toggle("ok", !msg && !!state.data[id]); }
    var el = document.getElementById(id);
    if (el) el.setAttribute("aria-invalid", msg ? "true" : "false");
  }
  function showErrors(errors) {
    var first = null;
    Object.keys(errors).forEach(function (k) { showError(k, errors[k]); if (!first) first = k; });
    var el = first && (document.getElementById(first) || root.querySelector('[data-field="' + first + '"]'));
    if (el && el.focus) el.focus();
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  function validateOne(id) {
    if (id === "phone" || id === "callingCode") {
      showError("phone", V.rules.phone(state.data.phone, state.data));
      return;
    }
    if (V.rules[id]) showError(id, V.rules[id](state.data[id], state.data));
  }

  /* ---------- wiring ---------- */
  function wireFields() {
    root.querySelectorAll("[data-bind]").forEach(function (el) {
      var id = el.id;
      el.addEventListener("input", function () {
        state.data[id] = el.value; Nav.save();
        var w = root.querySelector('[data-field="' + id + '"]');
        if (w && w.classList.contains("bad")) validateOne(id);
      });
      el.addEventListener("blur", function () { if (el.value) validateOne(id); });
      el.addEventListener("change", function () { onChange(id, el); });
    });
  }

  function onChange(id, el) {
    var d = state.data;
    if (id === "country") {
      var geo = document.getElementById("geo");
      if (loc.COUNTRY_NAMES.indexOf(d.country) >= 0 && geo && geo.dataset.country !== d.country) {
        d.governorate = ""; d.city = "";
        if (!d.callingTouched) d.callingCode = loc.callingCodeFor(d.country);
        Nav.save();
        geo.outerHTML = geoHTML(); wireFields();
      }
      validateOne("country");
    } else if (id === "governorate" && d.country === "Egypt") {
      d.city = ""; Nav.save();
      document.getElementById("geo").outerHTML = geoHTML(); wireFields();
      validateOne("governorate");
    } else if (id === "faculty" || id === "year") {
      if (!V.deptRequired(d) || V.departmentsFor(d).indexOf(d.department) < 0) d.department = "";
      Nav.save();
      document.getElementById("dept").outerHTML = deptHTML(); wireFields();
    } else if (id === "callingCode") {
      d.callingTouched = true; Nav.save();
    } else if (id === "committee") {
      if (state.skillsFor !== d.committee) { state.skills = []; state.skillsFor = ""; }
      Nav.save();
    }
  }

  function wireForm(stepName, nextStep) {
    var form = document.getElementById("form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errors = V.validateStep(stepName, state);
      if (Object.keys(errors).length) { showErrors(errors); return; }
      Nav.unlock(nextStep); Nav.go(nextStep);
    });
  }

  function wire() {
    var step = state.step;
    var back = document.getElementById("back");
    if (back) back.addEventListener("click", function () { Nav.go(Nav.STEPS[Math.max(Nav.STEPS.indexOf(step) - 1, 0)]); });

    if (step === "home") {
      document.getElementById("start").addEventListener("click", function () {
        var page = root.querySelector(".page"), reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
        page.classList.add("leaving");
        setTimeout(function () { Nav.unlock("personal"); Nav.go("personal"); }, reduce ? 0 : 260);
      });
    }
    if (step === "personal") { wireFields(); wireForm("personal", "academic"); }
    if (step === "academic") { wireFields(); wireForm("academic", "committee"); }
    if (step === "committee") {
      var c = committeeById(state.data.committee);
      root.querySelectorAll('input[name="skill"]').forEach(function (cb) {
        cb.addEventListener("change", function () {
          state.skillsFor = c.id;
          state.skills = Array.prototype.map.call(root.querySelectorAll('input[name="skill"]:checked'), function (x) { return x.value; });
          cb.closest(".skill").classList.toggle("on", cb.checked);
          Nav.save();
          document.getElementById("msg-skills").textContent = "";
        });
      });
      var form = document.getElementById("form");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var errors = V.validateStep("committee", state);
        if (errors.skills) { document.getElementById("msg-skills").textContent = errors.skills; return; }
        Nav.unlock("review"); Nav.go("review");
      });
    }
    if (step === "review") {
      root.querySelectorAll("[data-go]").forEach(function (b) { b.addEventListener("click", function () { Nav.go(b.dataset.go); }); });
      document.getElementById("submit").addEventListener("click", doSubmit);
    }
    if (step === "success") wireSuccess();

    if (pendingErrors) { var e = pendingErrors; pendingErrors = null; setTimeout(function () { showErrors(e); }, 30); }
  }

  function doSubmit() {
    if (submitting) return;
    var bad = V.validateAll(state);
    if (bad) { pendingErrors = bad.errors; submitError = ""; Nav.go(bad.step); return; }
    submitting = true; submitError = "";
    var btn = document.getElementById("submit");
    btn.disabled = true; btn.setAttribute("aria-busy", "true");
    btn.innerHTML = '<span class="spinner"></span> Submitting…';
    Submit.submit(state).then(function (res) {
      state.result = res; Nav.clearDraft(); submitting = false; Nav.go("success");
    }).catch(function (err) {
      submitting = false; submitError = err.message || "Something went wrong. Please try again.";
      Nav.save(); render();
    });
  }

  function wireSuccess() {
    var box = document.getElementById("pdfbox");
    function bindDl() {
      var dl = document.getElementById("dl");
      if (!dl) return;
      dl.addEventListener("click", function () {
        var pdf = state.result.pdf || { status: "failed" };
        if (pdf.status === "demo") { var n = document.getElementById("demoNote"); if (n) n.hidden = false; return; }
        if (pdf.status === "ready") { Submit.download(pdf); return; }
        box.innerHTML = pdfBoxHTML(pdf, true);
        Submit.fetchPdf(state.result.ref, state.result.token).then(function (p) {
          state.result.pdf = p; box.innerHTML = pdfBoxHTML(p); bindDl();
          if (p.status === "ready") Submit.download(p);
        });
      });
    }
    bindDl();
    document.getElementById("again").addEventListener("click", function () {
      state.data = { callingCode: "+20" }; state.skills = []; state.skillsFor = ""; state.requestId = null;
      state.result = null; state.reached = 0; Nav.save(); Nav.go("home");
    });
  }

  /* ---------- render ---------- */
  function render() {
    var step = state.step;
    var showProgress = step !== "home" && step !== "success";
    root.innerHTML = (showProgress ? progress() : "") + PAGES[step]();
    wire();
  }

  Nav.load();
  Nav.onChange(render);
  var h = (location.hash || "").replace("#", "");
  if (h && h !== "home" && Nav.canEnter(h)) state.step = h;
  render();
})();
