import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/message", (_req, res) => {
  res.json({ message: "Hello from NodeJS backend via GitOps!" });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
