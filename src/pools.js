const glob = require("glob");
const path = require("path");
const fs = require("fs");

const jsonFiles = glob.sync(
  path.join("/Users/jnwng/forks/hashlips_art_engine/json-backup/*.json")
);

console.info(jsonFiles.length);

const filteredFiles = jsonFiles.filter((file) =>
  ["68", "419"].some((special) => !file.includes(`${special}.json`))
);

const pools = [];
for (const file of filteredFiles) {
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));

  const hasPool = data.attributes.find((attr) => attr.value === "Pool");
  if (hasPool) {
    console.log(data.attributes);
    const edition = file.match(/\d+/)[0];
    pools.push(edition);
  }
}

console.log(pools);
fs.writeFileSync("./pools.json", JSON.stringify(pools));
