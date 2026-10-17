/**
 * Registration backend (Google Apps Script web app).
 *
 * Deploy as: Execute as "Me", access "Anyone". The web app URL is public, so the
 * protections below live here: server-side validation, duplicate handling, rate
 * limiting, a honeypot field and a per-application token for the PDF.
 * No secrets go in the website's JavaScript. Keep the Sheet and Drive folder private.
 */

var CONFIG = {
  SHEET_ID: "1V4YMdcOAxRwaVdm1c2oJzqMHA_UXVbOewSIOLth6yNM",            // ID of the Google Sheet (the long string in its URL)
  SHEET_NAME: "Applications",
  PDF_FOLDER_ID: "",       // Drive folder for PDF copies. Empty = do not store copies.
  COMPANY_NAME: "Hult Prize", // TODO: final company name
  DUPLICATE_POLICY: "reject", // TODO: "reject" blocks a second application with the same email
  MAX_REQUESTS_PER_MINUTE: 30,
  MIN_SKILLS: 1
};

var HEADERS = [
  "Submitted At", "Reference", "Request ID", "Token Hash", "Full Name", "Date of Birth", "Email", "Gender",
  "Country", "Governorate", "City", "Faculty", "Department", "Academic Year", "Phone", "Academic ID",
  "National ID", "Committee", "Skills", "PDF File Link"
];

var FACULTIES = {
  "Faculty of Industry and Energy Technology": {
    fromYear: 1,
    departments: ["Information Technology", "Railway Technology", "Food Manufacturing Technology", "Tractors and Equipment Technology", "Spinning and Weaving Technology"]
  },
  "Faculty of Applied Health Sciences Technology": {
    fromYear: 2,
    departments: ["Medical Laboratory Technology", "Radiology Technology", "Physical Therapy Technology", "Nursing Technology"] // TODO: placeholders
  }
};

// Keep in sync with js/committees.js
var COMMITTEES = {
  "Events Team": ["Event Planning", "Logistics", "Hosting & Moderation", "Budget Tracking"],
  "Experts & Judges Support Team": ["Professional Outreach", "Scheduling", "Hospitality", "Evaluation Support"],
  "Media Team": ["Graphic Design", "Video Editing", "Photography", "Content Writing", "Social Media Management"],
  "Partnerships & Relations Team": ["Sponsorship Outreach", "Negotiation", "Proposal Writing", "Relationship Management"],
  "Startups Team": ["Business Modeling", "Pitch Coaching", "Market Research", "Mentoring"]
};

/* ---------------- entry points ---------------- */

function doPost(e) {
  try {
    if (!rateLimitOk()) return json({ ok: false, error: "Too many requests. Please wait a minute and try again." });
    var body = JSON.parse((e.postData && e.postData.contents) || "{}");
    if (body.action !== "submit") return json({ ok: false, error: "Unknown action." });
    if (body.website) return json({ ok: true, ref: "HP-0000000", pdf: { status: "failed" } }); // honeypot: pretend success

    var clean = validate(body);
    if (clean.error) return json({ ok: false, error: clean.error });
    return json(saveApplication(clean.value));
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: "Server error. Please try again." });
  }
}

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.action !== "pdf" || !p.ref || !p.token) return json({ ok: false, error: "Bad request." });
    var row = findRow("Reference", p.ref);
    if (!row || row.values[3] !== hash(p.token)) return json({ ok: false, error: "Not found." });
    return json({ ok: true, pdf: makePdf(rowToApplication(row.values), p.ref) });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: "Server error." });
  }
}

/* ---------------- saving ---------------- */

function saveApplication(a) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet();

    // A retry of the same request returns the same reference instead of a second row
    var same = findRow("Request ID", a.requestId);
    if (same) return { ok: true, ref: same.values[1], token: "", duplicate: true, pdf: { status: "failed" } };

    if (CONFIG.DUPLICATE_POLICY === "reject" && findRow("Email", a.email)) {
      return { ok: false, error: "An application with this email already exists." };
    }

    var ref = nextReference(sheet);
    var token = Utilities.getUuid();
    sheet.appendRow([
      new Date(), ref, a.requestId, hash(token), safe(a.fullName), safe(a.dob), safe(a.email), safe(a.gender),
      safe(a.country), safe(a.governorate), safe(a.city), safe(a.faculty), safe(a.department), safe(a.year),
      safe(a.phone), safe(a.academicId), safe(a.nationalId), safe(a.committee), safe(a.skills.join(", ")), ""
    ]);
    SpreadsheetApp.flush();

    // The PDF is created only after the row is saved. A PDF failure never loses the registration.
    var pdf = { status: "failed" };
    try {
      pdf = makePdf(a, ref);
      var link = storePdf(pdf);
      if (link) sheet.getRange(sheet.getLastRow(), HEADERS.indexOf("PDF File Link") + 1).setValue(link);
    } catch (pdfErr) {
      console.error("PDF failed: " + pdfErr);
    }
    return { ok: true, ref: ref, token: token, pdf: pdf };
  } finally {
    lock.releaseLock();
  }
}

function nextReference(sheet) {
  var n = Math.max(sheet.getLastRow() - 1, 0) + 1; // header row excluded
  return "HP-" + Utilities.formatDate(new Date(), "UTC", "yyyy") + "-" + ("0000" + n).slice(-4);
}

/* ---------------- PDF ---------------- */

function makePdf(a, ref) {
  var html =
    '<html><body style="font-family:Arial,sans-serif;color:#2b1442;margin:0">' +
    '<div style="background:#4e276d;color:#fff;padding:22px 28px">' +
    '<div style="font-size:13px;letter-spacing:2px;color:#f63a9c;font-weight:bold">' + esc(CONFIG.COMPANY_NAME).toUpperCase() + '</div>' + // TODO: add the official logo here
    '<div style="font-size:22px;font-weight:bold;margin-top:6px">Application for Joining ' + esc(CONFIG.COMPANY_NAME) + '</div></div>' +
    '<div style="padding:22px 28px">' +
    '<p style="margin:0 0 14px"><b>Reference:</b> ' + esc(ref) + ' &nbsp;&nbsp; <b>Submitted:</b> ' + Utilities.formatDate(new Date(), "UTC", "yyyy-MM-dd HH:mm") + ' UTC</p>' +
    section("Personal Information", [["Full Name", a.fullName], ["Date of Birth", a.dob], ["Email", a.email], ["Gender", a.gender],
      ["Location", [a.city, a.governorate, a.country].filter(String).join(", ")]]) +
    section("Academic Information", [["Faculty", a.faculty], ["Academic Year", a.year], ["Department", a.department || "-"],
      ["Phone", a.phone], ["Academic ID", a.academicId], ["National ID", a.nationalId]]) +
    section("Committee", [["Committee", a.committee], ["Skills", (a.skills || []).join(", ")]]) +
    '</div></body></html>';
  var blob = HtmlService.createHtmlOutput(html).getBlob().getAs("application/pdf");
  var filename = "Application-" + ref + ".pdf";
  blob.setName(filename);
  return { status: "ready", filename: filename, base64: Utilities.base64Encode(blob.getBytes()) };
}

function section(title, rows) {
  var h = '<h3 style="color:#4e276d;border-bottom:2px solid #f63a9c;padding-bottom:4px;margin:18px 0 8px">' + title + '</h3><table style="width:100%;border-collapse:collapse">';
  rows.forEach(function (r) {
    h += '<tr><td style="width:32%;padding:5px 0;color:#6e5f82;vertical-align:top">' + esc(r[0]) + '</td><td style="padding:5px 0;font-weight:bold;word-break:break-word">' + esc(r[1]) + '</td></tr>';
  });
  return h + "</table>";
}

function storePdf(pdf) {
  if (!CONFIG.PDF_FOLDER_ID || pdf.status !== "ready") return "";
  var blob = Utilities.newBlob(Utilities.base64Decode(pdf.base64), "application/pdf", pdf.filename);
  return DriveApp.getFolderById(CONFIG.PDF_FOLDER_ID).createFile(blob).getUrl(); // access follows the folder's sharing
}

/* ---------------- validation (mirrors js/form-validation.js) ---------------- */

function validate(b) {
  var v = {
    requestId: str(b.requestId, 80), fullName: str(b.fullName, 80), dob: str(b.dob, 10), email: str(b.email, 120).toLowerCase(),
    gender: str(b.gender, 30), country: str(b.country, 60), governorate: str(b.governorate, 60), city: str(b.city, 60),
    faculty: str(b.faculty, 100), year: str(b.year, 2), department: str(b.department, 100), phone: str(b.phone, 24),
    academicId: str(b.academicId, 20), nationalId: str(b.nationalId, 14), committee: str(b.committee, 80),
    skills: (Array.isArray(b.skills) ? b.skills : []).map(function (s) { return str(s, 60); })
  };
  if (!v.requestId) return fail("Missing request ID.");
  if (v.fullName.split(/\s+/).length < 2 || v.fullName.length < 3) return fail("Enter your full name.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.dob) || isNaN(new Date(v.dob + "T00:00:00Z"))) return fail("Invalid date of birth.");
  var age = (new Date() - new Date(v.dob + "T00:00:00Z")) / 31557600000;
  if (age < 16 || age > 45) return fail("Age must be between 16 and 45.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v.email)) return fail("Invalid email.");
  if (["Female", "Male", "Prefer not to say"].indexOf(v.gender) < 0) return fail("Invalid gender.");
  if (!v.country || !v.governorate || !v.city) return fail("Location is incomplete.");
  var fac = FACULTIES[v.faculty];
  if (!fac) return fail("Invalid faculty.");
  var yr = parseInt(v.year, 10);
  if (!(yr >= 1 && yr <= 4)) return fail("Invalid academic year.");
  if (yr >= fac.fromYear) { if (fac.departments.indexOf(v.department) < 0) return fail("Invalid department."); }
  else v.department = "";
  if (!/^\+\d{1,3} \d{6,12}$/.test(v.phone)) return fail("Invalid phone number.");
  if (!/^[A-Za-z0-9-]{4,20}$/.test(v.academicId)) return fail("Invalid academic ID.");
  if (!/^\d{14}$/.test(v.nationalId)) return fail("Invalid national ID.");
  var allowed = COMMITTEES[v.committee];
  if (!allowed) return fail("Invalid committee.");
  var skills = [];
  v.skills.forEach(function (s) { if (allowed.indexOf(s) >= 0 && skills.indexOf(s) < 0) skills.push(s); });
  if (skills.length !== v.skills.length || skills.length < CONFIG.MIN_SKILLS) return fail("Invalid skills for this committee.");
  v.skills = skills; // names only, no descriptions
  return { value: v };
}
function fail(msg) { return { error: msg }; }
function str(x, max) { return (x == null ? "" : String(x)).trim().slice(0, max); }

/* ---------------- helpers ---------------- */

function getSheet() {
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
  if (sheet.getLastRow() === 0) { sheet.appendRow(HEADERS); sheet.setFrozenRows(1); }
  return sheet;
}
function findRow(header, value) {
  var sheet = getSheet(), last = sheet.getLastRow();
  if (last < 2) return null;
  var col = HEADERS.indexOf(header) + 1;
  var vals = sheet.getRange(2, col, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).toLowerCase() === String(value).toLowerCase()) {
      return { index: i + 2, values: sheet.getRange(i + 2, 1, 1, HEADERS.length).getValues()[0] };
    }
  }
  return null;
}
function rowToApplication(r) {
  return { fullName: r[4], dob: formatDob(r[5]), email: r[6], gender: r[7], country: r[8], governorate: r[9], city: r[10], faculty: r[11],
    department: r[12], year: r[13], phone: r[14], academicId: r[15], nationalId: r[16], committee: r[17],
    skills: String(r[18]).split(", ").filter(String) };
}
function formatDob(v) { return v instanceof Date ? Utilities.formatDate(v, "UTC", "yyyy-MM-dd") : String(v); }
function hash(s) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s)));
}
// A cell that starts with = + - @ would run as a formula, so prefix it with an apostrophe
function safe(v) { v = v == null ? "" : String(v); return /^[=+\-@]/.test(v) ? "'" + v : v; }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function rateLimitOk() {
  var cache = CacheService.getScriptCache(), key = "rl-" + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 90);
  return n <= CONFIG.MAX_REQUESTS_PER_MINUTE;
}
