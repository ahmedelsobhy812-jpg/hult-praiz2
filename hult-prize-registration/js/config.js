/* Central settings. Items marked TODO are open decisions from phase 0 of the roadmap. */
window.HP_CONFIG = {
  COMPANY_NAME: "Hult Prize", // TODO: confirm the final company name
  INTRO_TITLE: "Join the organizing team",
  INTRO_TEXT:
    "Apply in a few minutes. Tell us about yourself, choose a committee and the skills you bring, then download your application as a PDF.", // TODO: replace with the approved English text

  // Paste the Apps Script web app URL here after deployment (see README).
  // While empty, the site runs in demo mode: nothing is sent anywhere.
  ENDPOINT_URL: "https://script.google.com/macros/s/AKfycbzNXIoLwFTdTTmQcisrtUyDnXDtglGCnODkhtc5dql2GVm0MLgHQFUCKdzq6ZX_r-K3/exec",

  MIN_SKILLS: 1, // TODO: confirm the skills rule (at least one, or all required)
  REQUEST_TIMEOUT_MS: 20000,
  SUBMIT_RETRIES: 2,
  DRAFT_KEY: "hp-registration-draft-v1",

  // TODO: confirm the official English names. Health department names are placeholders.
  FACULTIES: [
    {
      name: "Faculty of Industry and Energy Technology",
      deptFromYear: 1,
      departments: [
        "Information Technology",
        "Railway Technology",
        "Food Manufacturing Technology",
        "Tractors and Equipment Technology",
        "Spinning and Weaving Technology",
      ],
    },
    {
      name: "Faculty of Applied Health Sciences Technology",
      deptFromYear: 2, // first-year students do not choose a department
      departments: [
        "Medical Laboratory Technology",
        "Radiology Technology",
        "Physical Therapy Technology",
        "Nursing Technology",
      ],
    },
  ],
  YEARS: ["1", "2", "3", "4"],
  GENDERS: ["Female", "Male", "Prefer not to say"],
};
