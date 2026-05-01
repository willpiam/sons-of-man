import express, { Router } from "express";

const router = Router();

const BLOCKFROST_CONFIG = {
  mainnet: {
    baseUrl: "https://cardano-mainnet.blockfrost.io/api/v0",
    projectIdEnv: "BLOCKFROST_PROJECT_ID",
  },
  preview: {
    baseUrl: "https://cardano-preview.blockfrost.io/api/v0",
    projectIdEnv: "BLOCKFROST_PREVIEW_PROJECT_ID",
  },
};

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

router.use(express.raw({ type: "*/*", limit: "2mb" }));

function getBlockfrostConfig(network) {
  const config = BLOCKFROST_CONFIG[network];
  if (!config) {
    throw new Error("Unsupported Blockfrost network.");
  }

  const projectId = process.env[config.projectIdEnv];
  if (!projectId) {
    throw new Error(`Missing ${config.projectIdEnv}.`);
  }

  return { ...config, projectId };
}

function buildTargetUrl(baseUrl, path, originalUrl) {
  const queryIndex = originalUrl.indexOf("?");
  const query = queryIndex >= 0 ? originalUrl.slice(queryIndex) : "";
  return `${baseUrl}/${path}${query}`;
}

function copyResponseHeaders(blockfrostResponse, res) {
  blockfrostResponse.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      res.setHeader(key, value);
    }
  });
}

router.all("/:network/*", async (req, res) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  let config;
  try {
    config = getBlockfrostConfig(req.params.network);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const targetUrl = buildTargetUrl(config.baseUrl, req.params[0] || "", req.originalUrl);
  const headers = {
    project_id: config.projectId,
  };

  if (req.method === "POST" && req.headers["content-type"]) {
    headers["content-type"] = req.headers["content-type"];
  }

  try {
    const blockfrostResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method === "POST" ? req.body : undefined,
    });

    copyResponseHeaders(blockfrostResponse, res);
    const body = Buffer.from(await blockfrostResponse.arrayBuffer());
    return res.status(blockfrostResponse.status).send(body);
  } catch (error) {
    return res.status(502).json({ error: error.message || "Blockfrost proxy request failed." });
  }
});

export default router;
