import express from "express";
import client from "prom-client";

const app = express();
const port = process.env.PORT || 3000;
const version = process.env.VERSION || "v1";
const errorRate = Number.parseFloat(process.env.ERROR_RATE || "0");

client.collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["route", "method", "status"],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["route", "method", "status"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

app.use((req, res, next) => {
  const endTimer = httpRequestDurationSeconds.startTimer();

  res.on("finish", () => {
    const route = req.route?.path || req.path || "unknown";
    const labels = {
      route,
      method: req.method,
      status: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    endTimer(labels);
  });

  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/message", (_req, res) => {
  if (Math.random() < errorRate) {
    res.status(500).json({
      error: "Injected backend error",
      version,
    });
    return;
  }

  res.json({
    message: "Hello from NodeJS backend via GitOps!",
    version,
  });
});

app.get("/api/version", (_req, res) => {
  res.json({ version });
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(port, () => {
  console.log(
    `Backend listening on port ${port} with VERSION=${version} ERROR_RATE=${errorRate}`,
  );
});
