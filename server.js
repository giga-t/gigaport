const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3333;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "application/javascript",
  ".mjs": "application/javascript", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".avif": "image/avif", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".otf": "font/otf", ".eot": "application/vnd.ms-fontobject",
  ".mp4": "video/mp4", ".webm": "video/webm",
  ".bin": "application/octet-stream",
};

// Path rewrites: map original Vercel paths to downloaded asset structure
const REWRITES = [
  [/^\/assets\/(index-[^/]+\.css)/, "/assets/css/$1"],
  [/^\/assets\/(index-[^/]+\.js)/, "/assets/js/$1"],
  [/^\/Images\/(.*)/, "/assets/images/$1"],
  [/^\/fonts\/Chillax_Complete\/Fonts\/WEB\/css\/chillax\.css/, "/assets/css/chillax.css"],
  [/^\/fonts\/Chillax_Complete\/Fonts\/WEB\/fonts\/(.*)/, "/assets/fonts/$1"],
  [/^\/Acorn%20Font\/(.*)/, "/assets/fonts/$1"],
  [/^\/Acorn Font\/(.*)/, "/assets/fonts/$1"],
];

const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split("?")[0]);

  // Apply path rewrites
  for (const [pattern, replacement] of REWRITES) {
    if (pattern.test(url)) {
      url = url.replace(pattern, replacement);
      break;
    }
  }

  let filePath = path.join(ROOT, url);

  // Path traversal protection — ensure resolved path stays within ROOT
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(ROOT))) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  if (url.endsWith("/")) filePath = path.join(filePath, "index.html");
  if (!path.extname(filePath)) {
    const withHtml = filePath + ".html";
    const asDir = path.join(filePath, "index.html");
    if (fs.existsSync(withHtml)) filePath = withHtml;
    else if (fs.existsSync(asDir)) filePath = asDir;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": mime,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "Cache-Control": "no-cache",
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  const url = "http://localhost:" + PORT;
  console.log("\n  Serving at: " + url + "\n");
  // Auto-open browser (using execFile to avoid shell injection)
  const { execFile } = require("child_process");
  const cmd = process.platform === "darwin" ? "open" :
              process.platform === "win32" ? "start" : "xdg-open";
  if (process.platform === "win32") {
    execFile("cmd", ["/c", "start", url]);
  } else {
    execFile(cmd, [url]);
  }
});
