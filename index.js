// index.js
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import loadPlugins from "./handler.js"; // Import fungsi untuk memuat plugin
import chalk from 'chalk';
import checkApikeys from "./component/cekApikey.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json());
app.use("/api", checkApikeys);

const logFile = 'requests.json';
if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, '[]');
}

app.use((req, res, next) => {
  const start = Date.now();
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0];
  }

  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  res.on('finish', () => {
    const duration = Date.now() - start;

    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip
    };

    const statusColor = res.statusCode < 400 ? chalk.green : chalk.red;
    console.log(
      `${chalk.gray(logEntry.timestamp)} | ${chalk.blue(logEntry.method)} | ${chalk.cyan(logEntry.url)} | ${statusColor(logEntry.status)} | ${chalk.yellow(logEntry.duration)} | ${chalk.magenta(logEntry.ip)}`
    );

    fs.readFile(logFile, 'utf8', (err, data) => {
      if (err) return console.error(chalk.red('Gagal membaca file log:'), err);

      let logs = [];
      try {
        logs = JSON.parse(data);
      } catch (parseErr) {
        console.error(chalk.red('Gagal parse file log:'), parseErr);
      }

      logs.push(logEntry);

      fs.writeFile(logFile, JSON.stringify(logs, null, 2), (err) => {
        if (err) console.error(chalk.red('Gagal menulis ke file log:'), err);
      });
    });
  });

  next();
});

app.use(express.static(path.join(__dirname, "html")));

// Route yang sudah ada
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "landing.html"));
});

app.get("/pricing", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "pricing.html"));
});

app.get("/features", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "features.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "about.html"));
});

app.get("/security", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "security.html"));
});

// Memuat plugin dari folderplugin
loadPlugins(app);

// Log semua route yang terdaftar
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`Route terdaftar: ${middleware.route.path} (${Object.keys(middleware.route.methods).join(", ").toUpperCase()})`);
  }
});

const PORT = process.env.PORT || 3058;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});