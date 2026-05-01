import "dotenv/config";
import cors from "cors";
import express from "express";
import blockfrostProxyRouter from "./routes/blockfrost-proxy.js";
import oathEventsRouter from "./routes/oath-events.js";

const app = express();
const port = Number.parseInt(process.env.PORT, 10) || 3000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/blockfrost", blockfrostProxyRouter);
app.use("/api", oathEventsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
