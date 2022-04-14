const glob = require("glob");
const path = require("path");
const fs = require("fs");

const jsonFiles = glob.sync(path.join(__dirname, "../build/json/*.json"));

console.info(jsonFiles.length);

const filteredFiles = jsonFiles.filter((file) =>
  ["68", "419"].some((special) => !file.includes(`${special}.json`))
);

for (const file of filteredFiles) {
  console.info(file);
  const data = fs.readFileSync(file, "utf-8");

  const edition = file.match(/\d+/)[0];
  console.info({ edition });

  const newData = data.replace(/image\.png/g, `${edition}.png`);
  console.info({ newData });

  fs.writeFileSync(file, JSON.stringify(JSON.parse(newData), null, 2));
}
