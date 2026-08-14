const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT || 4185);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const CMS_META_ROOT = "https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items";
const DATASETS = {
  hospitals: "xubh-q36u",
  readmissions: "9n3s-kdb3"
};

const cache = new Map();

function send(response, status, body, headers = {}) {
  response.writeHead(status, {
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
    ...headers
  });
  response.end(body);
}

function sendJson(response, status, payload) {
  send(response, status, JSON.stringify(payload), {
    "content-type": "application/json; charset=utf-8"
  });
}

async function serveFile(response, filePath, contentType) {
  try {
    const body = await fs.readFile(filePath);
    send(response, 200, body, { "content-type": contentType });
  } catch {
    send(response, 404, "Not found", { "content-type": "text/plain; charset=utf-8" });
  }
}

function csvDownloadUrl(metadata) {
  const distribution = Array.isArray(metadata && metadata.distribution) ? metadata.distribution[0] : null;
  const data = distribution && distribution.data ? distribution.data : {};
  const direct = data.downloadURL || data.downloadUrl;
  if (direct) return direct;
  const refs = Array.isArray(data["%Ref:downloadURL"]) ? data["%Ref:downloadURL"] : [];
  const local = refs.find((item) => item && item.data && /^https?:\/\//i.test(item.data.filePath || ""));
  return local && local.data ? local.data.filePath : "";
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value !== "")) rows.push(row);
  if (!rows.length) return [];

  const headers = rows.shift().map((header) => header.trim());
  return rows.map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] == null ? "" : values[index].trim();
    });
    return record;
  });
}

async function fetchDataset(datasetId) {
  const cached = cache.get(datasetId);
  if (cached && Date.now() - cached.createdAt < 6 * 60 * 60 * 1000) return cached.payload;

  const metadataResponse = await fetch(`${CMS_META_ROOT}/${encodeURIComponent(datasetId)}?show-reference-ids=false`, {
    headers: { accept: "application/json" }
  });
  if (!metadataResponse.ok) throw new Error(`CMS metadata ${datasetId} returned ${metadataResponse.status}`);

  const metadata = await metadataResponse.json();
  const downloadUrl = csvDownloadUrl(metadata);
  if (!downloadUrl) throw new Error(`CMS metadata ${datasetId} did not publish a CSV URL`);

  const csvResponse = await fetch(downloadUrl, {
    headers: { accept: "text/csv,*/*" }
  });
  if (!csvResponse.ok) throw new Error(`CMS CSV ${datasetId} returned ${csvResponse.status}`);

  const payload = parseCsv(await csvResponse.text());
  cache.set(datasetId, { createdAt: Date.now(), payload });
  return payload;
}

function value(row, keys, fallback = "") {
  const direct = keys.find((key) => row && row[key] !== undefined && row[key] !== null && row[key] !== "");
  if (direct) return row[direct];
  const normalized = {};
  Object.keys(row || {}).forEach((key) => {
    normalized[key.toLowerCase().replace(/[^a-z0-9]+/g, "")] = row[key];
  });
  for (const key of keys) {
    const found = normalized[key.toLowerCase().replace(/[^a-z0-9]+/g, "")];
    if (found !== undefined && found !== null && found !== "") return found;
  }
  return fallback;
}

function filterByState(rows, state) {
  return state ? rows.filter((row) => value(row, ["State", "state"], "") === state) : rows;
}

async function cmsSnapshot(requestUrl) {
  const selectedState = requestUrl.searchParams.get("state") || "";
  const [hospitals, hrrp] = await Promise.all([
    fetchDataset(DATASETS.hospitals),
    fetchDataset(DATASETS.readmissions)
  ]);

  return {
    live: true,
    sourceMode: "live-proxy",
    source: "CMS Provider Data current CSV resources via local Node proxy",
    refreshedAt: new Date().toLocaleString([], {
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      day: "numeric"
    }),
    datasetIds: DATASETS,
    hospitals: filterByState(hospitals, selectedState),
    hrrp: filterByState(hrrp, selectedState)
  };
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    send(response, 204, "", {
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "content-type"
    });
    return;
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (requestUrl.pathname === "/api/cms") {
    try {
      sendJson(response, 200, await cmsSnapshot(requestUrl));
    } catch (error) {
      sendJson(response, 502, {
        live: false,
        error: error.message
      });
    }
    return;
  }

  if (requestUrl.pathname === "/" || requestUrl.pathname === "/index.html") {
    await serveFile(response, path.join(ROOT, "index.html"), "text/html; charset=utf-8");
    return;
  }

  if (requestUrl.pathname === "/html-code-to-copy-and-paste.txt") {
    await serveFile(response, path.join(ROOT, "html-code-to-copy-and-paste.txt"), "text/plain; charset=utf-8");
    return;
  }

  send(response, 404, "Not found", { "content-type": "text/plain; charset=utf-8" });
});

server.listen(PORT, HOST, () => {
  console.log(`Healthcare Quality Intelligence running at http://127.0.0.1:${PORT}/`);
});
