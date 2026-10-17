# Hult Prize Registration

Mobile-size registration site: white background, glass form card, pink and purple.
Plain HTML, CSS and JavaScript on the front end. Google Apps Script and Google Sheets on the back end.

## Run it locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

With `ENDPOINT_URL` empty in `js/config.js` the site runs in **demo mode**. You can click through every step,
but nothing is sent anywhere and the PDF button explains that the backend is not connected.

## Structure

The roadmap suggested separate pages. This build keeps the whole flow in one page (the roadmap allows it),
so the `pages/` folder is not needed. Steps are `home`, `personal`, `academic`, `committee`, `review`, `success`,
and the browser's back button works through `#hash` links.

```
index.html
css/        variables, global, animations, forms, responsive
js/         config, locations, committees, form-validation, navigation, submission, app
assets/     images, icons, fonts (empty: add the official logo here)
backend/apps-script/Code.gs
```

## Connect the Google Sheet and PDF

1. Create a Google Sheet (keep it private). Copy its ID from the URL.
2. Optional: create a private Drive folder for PDF copies and copy its ID.
3. In the Sheet open Extensions > Apps Script, paste `backend/apps-script/Code.gs`, and fill `SHEET_ID` and `PDF_FOLDER_ID` in `CONFIG`.
4. Deploy > New deployment > Web app. Execute as **Me**, access **Anyone**. Copy the web app URL.
5. Paste that URL into `ENDPOINT_URL` in `js/config.js`.
6. Submit a test application and check the new row. The sheet gets one row per application with a reference number,
   timestamp, and the selected skill **names only**.

What the backend does: validates everything again on the server, rejects a second application with the same email
(`DUPLICATE_POLICY`), returns the same reference if the browser retries the same request, saves the row first and
creates the PDF only after the save succeeds, and never loses a registration if the PDF fails.
The PDF button on the success page retries with a private per-application token.

Security notes: no secrets are in the website code. The web app URL is public by design, so the script limits request
rate, has a honeypot field, and escapes spreadsheet formulas. National ID numbers are stored in the sheet, so restrict
who can open it. PDF copies in Drive follow the folder's sharing settings.

## Open decisions from phase 0

Marked `TODO` in the code. Change them in one place:

- Final company name: `COMPANY_NAME` in `js/config.js` and `Code.gs`.
- Official logo: replace the placeholder mark (`LOGO` in `js/app.js`, the header block in `Code.gs`).
- Approved English home page text: `INTRO_TITLE` and `INTRO_TEXT` in `js/config.js`.
- Official faculty and department names. The four Applied Health Sciences departments are **placeholders**.
- Committee definitions and skills in `js/committees.js` are **placeholders**. Keep `Code.gs` in sync.
- Skills rule: `MIN_SKILLS` (now at least one).
- Duplicate registration policy and editing after submit (now: duplicates rejected, no editing).
- Who can see applicants and PDFs, and whether PDFs are also stored in Drive.

## Test checklist (phase 12)

Nothing here is ticked, because these tests have not been run against a live backend.

- [ ] Home page and animation
- [ ] Required fields and error messages
- [ ] Countries, governorates and cities
- [ ] Both faculties, every year and department rule
- [ ] All five committee paths
- [ ] Skills saved as names only
- [ ] Phone and country code
- [ ] Submission to Google Sheets
- [ ] PDF with short and long data
- [ ] Retry and lost connection
- [ ] Phone, tablet and laptop
- [ ] Security and access rights
- [ ] Keyboard use

## Launch (phase 13)

Host the folder on any static host with HTTPS (Netlify, Vercel, GitHub Pages, Cloudflare Pages), run a small real test,
check Sheet and Drive permissions, then open it to everyone.
