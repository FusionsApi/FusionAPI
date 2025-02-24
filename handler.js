// handler.js
import fs from "fs";
import path from "path";

const SWAGG = {
  "openapi": "3.0.0",
  "servers": [
    {
      "url": "http://localhost:3012/api"
    }
  ],
  "paths": {},
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  }
};

const loadPlugins = async (app) => {
  const pluginsDir = path.join(process.cwd(), "plugin");
  const files = fs.readdirSync(pluginsDir);
  
  const pluginPromises = files.map(async (file) => {
    if (file.endsWith(".js")) {
      const pluginPath = `./plugin/${file}`;
      try {
        const plugin = await import(pluginPath);
        if (plugin.default && plugin.default.command && plugin.default.method) {
          const commands = Array.isArray(plugin.default.command)
            ? plugin.default.command
            : [plugin.default.command];
          const method = plugin.default.method.toLowerCase();

          commands.forEach((command) => {
            switch (method) {
              case "get":
                app.get(`/api/${plugin.default.category}/${command}`, plugin.default);
                break;
              case "post":
                app.post(`/api/${plugin.default.category}/${command}`, plugin.default);
                break;
              case "put":
                app.put(`/api/${plugin.default.category}/${command}`, plugin.default);
                break;
              case "delete":
                app.delete(`/api/${plugin.default.category}/${command}`, plugin.default);
                break;
              default:
                console.error(`Metode tidak didukung: ${method} untuk plugin ${file}`);
                return;
            }

            let DocPath = SWAGG.paths[`/${plugin.default.category}/${command}`] = {};
            DocPath[method] = {
              "summary": plugin.default.docs.desc,
              "tags": [ plugin.default.tags.toUpperCase() ],
              "security": [
                {
                  "bearerAuth": []
                }
              ],
              "parameters": plugin.default.docs.parameters,
              "responses": {
                "401": {
                  "description": "Unauthorized"
                }
              }
            };

            console.log(`Plugin loaded: /api/${plugin.default.category}/${command} (${method.toUpperCase()}) from ${pluginPath}`);
          });
        } else {
          console.error(`Plugin ${file} tidak memiliki command atau method yang valid.`);
        }
      } catch (err) {
        console.error(`Gagal memuat plugin ${file}:`, err);
      }
    }
  });

  await Promise.all(pluginPromises);
  fs.writeFileSync('html/docs/docs.json', JSON.stringify(SWAGG, null, 2));
  console.log('Dokumentasi Swagger berhasil dirender');
};

export default loadPlugins;