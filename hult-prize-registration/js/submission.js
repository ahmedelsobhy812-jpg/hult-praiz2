/* Sends the application to the Apps Script backend and handles the PDF.
   With no ENDPOINT_URL it runs in demo mode and sends nothing. */
window.HPSubmit = (function () {
  var cfg = window.HP_CONFIG;

  function uuid() {
    try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return "r-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function post(body) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, cfg.REQUEST_TIMEOUT_MS);
    // text/plain avoids a CORS preflight, which Apps Script does not answer
    return fetch(cfg.ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) { clearTimeout(timer); return res.json(); },
            function (err) { clearTimeout(timer); throw err; });
  }

  function payloadFrom(state) {
    var d = state.data;
    return {
      action: "submit",
      requestId: state.requestId,
      website: "", // honeypot, must stay empty
      fullName: d.fullName.trim(), dob: d.dob, email: d.email.trim().toLowerCase(), gender: d.gender,
      country: d.country, governorate: d.governorate.trim(), city: d.city.trim(),
      faculty: d.faculty, year: d.year, department: window.HPValidate.deptRequired(d) ? d.department : "",
      phone: d.callingCode + " " + window.HPValidate.stripZeros(d.phone),
      academicId: d.academicId.trim(), nationalId: d.nationalId.trim(),
      committee: window.HP_COMMITTEES.filter(function (c) { return c.id === d.committee; })[0].name,
      skills: state.skills.slice() // names only
    };
  }

  function submit(state) {
    if (!state.requestId) state.requestId = uuid();
    var payload = payloadFrom(state);

    if (!cfg.ENDPOINT_URL) {
      return wait(1100).then(function () {
        return { ok: true, demo: true, ref: "HP-DEMO-" + state.requestId.slice(-5).toUpperCase().replace(/[^A-Z0-9]/g, "0"), token: "", pdf: { status: "demo" } };
      });
    }

    var attempt = 0;
    function run() {
      return post(payload).catch(function (err) {
        if (attempt++ < cfg.SUBMIT_RETRIES) return wait(1200 * attempt).then(run); // same requestId, so no duplicate rows
        throw new Error("We could not reach the server. Check your connection and try again.");
      });
    }
    return run().then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "The server rejected the application.");
      return res;
    });
  }

  function fetchPdf(ref, token) {
    if (!cfg.ENDPOINT_URL) return Promise.resolve({ status: "demo" });
    var url = cfg.ENDPOINT_URL + (cfg.ENDPOINT_URL.indexOf("?") < 0 ? "?" : "&") +
      "action=pdf&ref=" + encodeURIComponent(ref) + "&token=" + encodeURIComponent(token);
    return fetch(url).then(function (r) { return r.json(); }).then(function (res) {
      return res && res.ok && res.pdf ? res.pdf : { status: "failed" };
    }, function () { return { status: "failed" }; });
  }

  function download(pdf) {
    var bin = atob(pdf.base64), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    var a = document.createElement("a");
    a.href = url; a.download = pdf.filename || "application.pdf";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  return { submit: submit, fetchPdf: fetchPdf, download: download };
})();
