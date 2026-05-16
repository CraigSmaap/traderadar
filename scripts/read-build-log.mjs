import { createGunzip } from "zlib";
import { get } from "https";
import { readFileSync } from "fs";

const raw = readFileSync(process.env.TEMP + "/build.json", "utf8");
const match = raw.match(/https:\/\/storage\.googleapis[^"]*/);
if (!match) { console.log("No URL found"); process.exit(1); }
const url = match[0];

get(url, (res) => {
  const chunks = [];
  res.on("data", (d) => chunks.push(d));
  res.on("end", () => {
    const buf = Buffer.concat(chunks);
    try {
      const text = require("zlib").gunzipSync(buf).toString("utf8");
      text.split("\n").slice(-100).forEach((l) => console.log(l));
    } catch {
      buf.toString("utf8").split("\n").slice(-100).forEach((l) => console.log(l));
    }
  });
});
