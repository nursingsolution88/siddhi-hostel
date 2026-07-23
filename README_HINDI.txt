SIDDHI HOSTEL — GITHUB PAGES + GOOGLE SHEETS VERSION

इस version में Student Login नहीं है।

यह कैसे काम करता है:
1. Website GitHub Pages पर चलेगी।
2. Students और Payments का data Google Sheet में save होगा।
3. Google Apps Script automatic email reminders भेजेगा।
4. Due date पर student को email जाएगा।
5. 3 दिन overdue होने पर दूसरा email जाएगा।
6. रोज सुबह owner को due summary जाएगी।
7. CSV export और receipt print website में उपलब्ध है।

A. GOOGLE SHEET बनाएं

1. Google Drive खोलें।
2. New > Google Sheets.
3. नाम रखें: Siddhi Hostel Data.
4. Sheet URL में /d/ और /edit के बीच वाला भाग Sheet ID है।
   Example:
   https://docs.google.com/spreadsheets/d/ABC123XYZ/edit
   Sheet ID = ABC123XYZ

B. APPS SCRIPT SETUP

1. Google Sheet में Extensions > Apps Script खोलें।
2. default code हटाएं।
3. google-apps-script/Code.gs का पूरा code paste करें।
4. CONFIG में:
   SPREADSHEET_ID में Sheet ID डालें।
   OWNER_EMAIL में अपनी email डालें।
5. Project Settings में timezone Asia/Kolkata रखें।
6. ऊपर function list से setup चुनें और Run करें।
7. Permissions Allow करें।
8. Deploy > New deployment > Web app.
9. Execute as: Me.
10. Who has access: Anyone.
11. Deploy करें और Web App URL copy करें।

C. GITHUB PAGES SETUP

1. GitHub में नया repository बनाएं, जैसे siddhi-hostel.
2. github-pages/index.html upload करें।
3. index.html में:
   const APPS_SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
   इसकी जगह Apps Script Web App URL paste करें।
4. Repository Settings > Pages.
5. Source: Deploy from a branch.
6. Branch: main और folder /root select करें।
7. Save करें।
8. कुछ मिनट बाद GitHub Pages URL मिलेगा।

IMPORTANT

- Google Sheet manually edit भी कर सकते हैं, लेकिन column headings न बदलें।
- Sheet में Students और Payments tabs setup() अपने आप बनाएगा।
- Apps Script time trigger exact 8:00 पर नहीं, लगभग 8–9 बजे के बीच चल सकता है।
- Email Google account quota के अधीन है।
- Apps Script URL public रहता है; यह version छोटे private hostel use के लिए है।
- Student Login जानबूझकर नहीं रखा गया है।
