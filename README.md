# Siddhi Hotel Management Website

## Package contents
- `index.html` – complete dashboard and management UI
- `style.css` – responsive professional design
- `app.js` – booking, room, payment, expense, housekeeping, reports and WhatsApp logic
- `Code.gs` – Google Apps Script backend
- `Siddhi_Hotel_Google_Sheet_Template.xlsx` – Google Sheet import template

## Step 1: Create Google Sheet
1. Open Google Drive.
2. Upload `Siddhi_Hotel_Google_Sheet_Template.xlsx`.
3. Open it with Google Sheets.
4. Copy the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`

## Step 2: Add Apps Script
1. In Google Sheet, open **Extensions → Apps Script**.
2. Delete default code and paste `Code.gs`.
3. Replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` with your actual Sheet ID.
4. Click **Deploy → New deployment → Web app**.
5. Execute as: **Me**
6. Who has access: **Anyone**
7. Deploy and copy the Web App URL.

## Step 3: Run website
For testing, open `index.html`.
Demo login:
- Username: `admin`
- Password: `admin123`

Open **Settings** in the website and paste the Apps Script Web App URL.

## Step 4: Host online
Upload `index.html`, `style.css`, and `app.js` to:
- Netlify
- GitHub Pages
- Vercel

## Important security note
This starter uses a simple demo login stored in JavaScript. For production use, implement Google login or server-side user validation and do not store plain-text passwords in Google Sheets.
