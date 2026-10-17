/* Validation rules. The same rules are repeated on the server in backend/apps-script/Code.gs. */
window.HPValidate = (function () {
  var cfg = window.HP_CONFIG, loc = window.HP_LOCATIONS, committees = window.HP_COMMITTEES;

  function faculty(data) {
    for (var i = 0; i < cfg.FACULTIES.length; i++) if (cfg.FACULTIES[i].name === data.faculty) return cfg.FACULTIES[i];
    return null;
  }
  function deptRequired(data) {
    var f = faculty(data);
    return !!f && !!data.year && parseInt(data.year, 10) >= f.deptFromYear;
  }
  function departmentsFor(data) { var f = faculty(data); return f ? f.departments : []; }

  function trim(v) { return (v == null ? "" : String(v)).trim(); }
  function stripZeros(v) { return trim(v).replace(/[\s-]/g, "").replace(/^0+/, ""); }

  var rules = {
    fullName: function (v) {
      v = trim(v);
      if (!v) return "Enter your full name.";
      if (v.split(/\s+/).length < 2) return "Enter at least first and last name.";
      if (!/^[\p{L}][\p{L} .'-]{1,79}$/u.test(v)) return "Use letters only.";
      return "";
    },
    dob: function (v) {
      if (!v) return "Choose your date of birth.";
      var d = new Date(v + "T00:00:00");
      if (isNaN(d)) return "Enter a valid date.";
      var now = new Date(), age = now.getFullYear() - d.getFullYear();
      var m = now.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
      if (age < 16 || age > 45) return "Age must be between 16 and 45.";
      return "";
    },
    email: function (v) {
      v = trim(v);
      if (!v) return "Enter your email address.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v)) return "Enter a valid email, like name@example.com.";
      return "";
    },
    gender: function (v) { return cfg.GENDERS.indexOf(v) >= 0 ? "" : "Choose an option."; },
    country: function (v) { return loc.COUNTRY_NAMES.indexOf(v) >= 0 ? "" : "Choose a country from the list."; },
    governorate: function (v, d) {
      v = trim(v);
      if (!v) return "Enter your governorate or state.";
      if (d.country === "Egypt" && !loc.EGYPT[v]) return "Choose a governorate from the list.";
      return "";
    },
    city: function (v, d) {
      v = trim(v);
      if (!v) return "Enter your city or district.";
      if (d.country === "Egypt" && (!loc.EGYPT[d.governorate] || loc.EGYPT[d.governorate].indexOf(v) < 0)) return "Choose a city from the list.";
      return "";
    },
    faculty: function (v) { return faculty({ faculty: v }) ? "" : "Choose your faculty."; },
    year: function (v) { return cfg.YEARS.indexOf(v) >= 0 ? "" : "Choose your academic year."; },
    department: function (v, d) {
      if (!deptRequired(d)) return "";
      return departmentsFor(d).indexOf(v) >= 0 ? "" : "Choose your department.";
    },
    callingCode: function (v) { return loc.CALLING_CODES.indexOf(v) >= 0 ? "" : "Choose a code."; },
    phone: function (v, d) {
      var n = stripZeros(v);
      if (!n) return "Enter your phone number.";
      if (!/^\d+$/.test(n)) return "Use digits only.";
      if (d.callingCode === "+20") return /^1[0125]\d{8}$/.test(n) ? "" : "Egyptian mobile numbers have 10 digits after +20, like 1012345678.";
      return /^\d{6,12}$/.test(n) ? "" : "Enter 6 to 12 digits.";
    },
    academicId: function (v) {
      v = trim(v);
      if (!v) return "Enter your academic ID.";
      return /^[A-Za-z0-9-]{4,20}$/.test(v) ? "" : "Use 4 to 20 letters, numbers or dashes.";
    },
    nationalId: function (v) {
      v = trim(v);
      if (!v) return "Enter your national ID.";
      return /^\d{14}$/.test(v) ? "" : "National ID has 14 digits.";
    },
    committee: function (v) {
      return committees.some(function (c) { return c.id === v; }) ? "" : "Choose a committee.";
    }
  };

  var STEP_FIELDS = {
    personal: ["fullName", "dob", "email", "gender", "country", "governorate", "city"],
    academic: ["faculty", "year", "department", "callingCode", "phone", "academicId", "nationalId", "committee"]
  };

  function skillsError(state) {
    var c = committees.filter(function (x) { return x.id === state.data.committee; })[0];
    if (!c) return "Choose a committee first.";
    if (state.skillsFor !== c.id) return "Choose your skills.";
    var valid = state.skills.filter(function (s) { return c.skills.some(function (k) { return k.name === s; }); });
    if (valid.length < cfg.MIN_SKILLS) return "Choose at least " + cfg.MIN_SKILLS + " skill" + (cfg.MIN_SKILLS > 1 ? "s" : "") + ".";
    return "";
  }

  function validateStep(step, state) {
    var errors = {};
    if (step === "committee") { var e = skillsError(state); if (e) errors.skills = e; return errors; }
    (STEP_FIELDS[step] || []).forEach(function (k) {
      var msg = rules[k](state.data[k], state.data);
      if (msg) errors[k] = msg;
    });
    return errors;
  }

  function validateAll(state) {
    var order = ["personal", "academic", "committee"];
    for (var i = 0; i < order.length; i++) {
      var e = validateStep(order[i], state);
      if (Object.keys(e).length) return { step: order[i], errors: e };
    }
    return null;
  }

  return { rules: rules, validateStep: validateStep, validateAll: validateAll, deptRequired: deptRequired, departmentsFor: departmentsFor, stripZeros: stripZeros };
})();
