# Healthcare Quality Intelligence

BY EMMANUEL KUH

Healthcare Quality Intelligence is a premium red-and-blue healthcare analytics console that uses public CMS hospital datasets to compare hospital quality and 30-day readmission pressure.

## Live Data Sources

- CMS Hospital General Information, dataset `xubh-q36u`
- CMS Hospital Readmissions Reduction Program, dataset `9n3s-kdb3`

The app can run in one HTML file and fetch CMS metadata/CSV resources directly in the browser. For the most reliable live mode, run the included Node proxy server. No API key is required.

## Features

- Live CMS API refresh button
- State, city, ZIP, hospital, and county search
- Hospital quality score cards
- Dynamic Excess Readmission Risk Index
- Regional readmission benchmark
- Stressed facility flagging
- Responsive dark-mode healthcare analytics UI




The HTML still tries direct CMS metadata/CSV fetches when no server is present. If the browser or CMS blocks direct fetches, the app falls back to sample data. To keep live mode on GitHub Pages, deploy `server.js` somewhere public and set this near the top of the HTML script:

```html
<script>
  window.HEALTHCARE_API_BASE = "https://your-healthcare-backend-url";
</script>
```

## Run the Live Node Server

```powershell
cd outputs\healthcare-quality-intelligence
npm start
```

Open:


http://127.0.0.1:4185/


For phone testing on the same Wi-Fi, replace `127.0.0.1` with your laptop IPv4 address and keep port `4185`.

Credit: Healthcare Quality Intelligence - Designed and developed by Emmanuel Kuh.
