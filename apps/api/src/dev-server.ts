import { createServer } from "node:http";
import { handler } from "./index.js";
import { logger } from "./lib/logger.js";

const PORT = Number(process.env["API_PORT"] ?? "3001");

const server = createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const rawBody = Buffer.concat(chunks).toString();

  const response = await handler({
    httpMethod: req.method ?? "GET",
    path: req.url ?? "/",
    headers: req.headers as Record<string, string | undefined>,
    body: rawBody || null,
  });

  for (const [key, value] of Object.entries(response.headers)) {
    res.setHeader(key, value);
  }
  res.writeHead(response.statusCode);
  res.end(response.body);
});

server.listen(PORT, () => {
  logger.info(`API dev server running on http://localhost:${PORT}`);
});
