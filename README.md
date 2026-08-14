# Healthcare Quality Intelligence

BY EMMANUEL KUH

Healthcare Quality Intelligence is a premium red-and-blue healthcare analytics console that uses public CMS hospital datasets to compare hospital quality and 30-day readmission pressure.

## Live Data Sources

- CMS Hospital General Information, dataset `xubh-q36u`
- CMS Hospital Readmissions Reduction Program, dataset `9n3s-kdb3`

The GitHub Pages version runs in one HTML file and fetches CMS Provider Data JSON directly from the public datastore API. No API key, Node server, or backend is required for the static deployment.

## Features

- Live CMS datastore refresh button
- State, city, ZIP, hospital, and county search
- Hospital quality score cards
- Dynamic Excess Readmission Risk Index
- Regional readmission benchmark
- Stressed facility flagging
- Responsive dark-mode healthcare analytics UI
- Browser voice alerts and explanations

## Deploy on GitHub Pages

Upload the files in `healthcare-quality-intelligence-github-upload` to the root of a GitHub repository, then enable GitHub Pages from the repository settings.

Recommended GitHub upload files:

- `index.html`
- `README.md`

## Run the Live Node Server

The static GitHub Pages version does not need this. Use the Node server only for local testing or if you want a proxy later.

```powershell
cd outputs\healthcare-quality-intelligence
npm start
```

Open:

```text
http://127.0.0.1:4185/
```

For phone testing on the same Wi-Fi, replace `127.0.0.1` with your laptop IPv4 address and keep port `4185`.

Credit: Healthcare Quality Intelligence - Designed and developed by Emmanuel Kuh.
