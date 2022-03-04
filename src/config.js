"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const { MODE } = require(path.join(basePath, "constants/blend_mode.js"));
const { NETWORK } = require(path.join(basePath, "constants/network.js"));

const network = NETWORK.sol;

// General metadata for Ethereum
const namePrefix = "Orcanauts";
const description =
  "As the Orca ecosystem has grown, new creatures have been sighted emerging from deep within. 10,000 unique Orcanauts are now roaming free! Just like our podmates, each one of these little explorers is unique… and it’s looking for a forever friend with whom to navigate the deep sea of DeFi.";
const baseUri = "ipfs://NewUriToReplace";

const solanaMetadata = {
  symbol: "ORCANAUT",
  seller_fee_basis_points: 300, // Define how much % you want from secondary market sales 1000 = 10%
  external_url: "https://orcanauts.orca.so",
  collection: {
    name: "Orca",
    family: "Orcanauts",
  },
  creators: [
    {
      // Cori's address
      address: "BPbS1AC4KW5SBiz8M2AgPtWXTzR1ekBwMLLQLcwdvZnE",
      share: 0,
    },
    {
      // Jon's address
      address: "5dNGzQh9sonyFUcTHrH6wiCczokUMSc79miMEysyVYjK",
      share: 0,
    },
    {
      // Secondary sales wallet
      address: "E3G6ujBGbusExBAPL5hg62xu5ncWeVh9CLjU9qbusVvs",
      share: 100,
    },
  ],
};

// If you have selected Solana then the collection starts from 0 automatically
const layerConfigurations = [
  {
    // Modify for number of customs
    growEditionSizeTo: 29,
    layersOrder: [
      // { name: "bg", options: { bypassDNA: true } },
      { name: "bg" },
      { name: "body" },
      { name: "hats" },
      {
        name: "mouth",
        options: {
          getFilename: (filename, dna) =>
            dna["mouth"].variant === "grin"
              ? `../../variants/grin-${dna["body"].variant}.png`
              : filename,
        },
      },
      { name: "eyes" },
      { name: "accessory" },
    ],
    // Had to rename "background" -> "bg", "hat" -> "hats"
    invalidCombinations: [
      [
        { trait: "bg", variant: "sol-season" },
        { trait: "accessory", variant: "spaceship" },
      ],
      [
        { trait: "eyes", variant: "snorkel" },
        { trait: "hats", variant: "headphones" },
      ],
      [
        { trait: "eyes", variant: "snorkel" },
        { trait: "hats", variant: "astronaut" },
      ],
    ],

    layeringExceptions: [
      {
        exception: {
          trait: "hats",
          variant: "astronaut",
        },
        layers: [
          { name: "bg" },
          { name: "body" },
          { name: "mouth" },
          { name: "eyes" },
          { name: "hats" },
          { name: "accessory" },
        ],
      },
      {
        exception: {
          trait: "hats",
          variant: "flower",
        },
        layers: [
          { name: "bg" },
          { name: "body" },
          { name: "mouth" },
          { name: "eyes" },
          { name: "hats" },
          { name: "accessory" },
        ],
      },
      {
        exception: {
          trait: "eyes",
          variant: "snorkel",
        },
        layers: [
          { name: "bg" },
          { name: "body" },
          { name: "mouth" },
          { name: "hats" },
          { name: "eyes" },
          { name: "accessory" },
        ],
      },
    ],
  },
];

const shuffleLayerConfigurations = false;

const debugLogs = false;

const format = {
  width: 888,
  height: 888,
};

const gif = {
  export: false,
  repeat: 0,
  quality: 100,
  delay: 500,
};

const text = {
  only: false,
  color: "#ffffff",
  size: 20,
  xGap: 40,
  yGap: 40,
  align: "left",
  baseline: "top",
  weight: "regular",
  family: "Courier",
  spacer: " => ",
};

const pixelFormat = {
  ratio: 2 / 128,
};

const background = {
  generate: true,
  brightness: "80%",
  static: false,
  default: "#000000",
};

const extraMetadata = {};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000;

const preview = {
  thumbPerRow: 100,
  thumbWidth: 180,
  imageRatio: format.height / format.width,
  imageName: "preview.png",
};

const preview_gif = {
  numberOfImages: 24,
  order: "ASC", // ASC, DESC, MIXED
  repeat: 0,
  quality: 100,
  // delay: 250,
  delay: 500,
  imageName: "preview.gif",
};

module.exports = {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  pixelFormat,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
  preview_gif,
};
