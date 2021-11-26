"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const { MODE } = require(path.join(basePath, "constants/blend_mode.js"));
const { NETWORK } = require(path.join(basePath, "constants/network.js"));

const network = NETWORK.sol;

// General metadata for Ethereum
const namePrefix = "Orcanauts";
const description = "The most lovable NFTs on Solana";
const baseUri = "ipfs://NewUriToReplace";

const solanaMetadata = {
  symbol: "ORCANAUT",
  seller_fee_basis_points: 300, // Define how much % you want from secondary market sales 1000 = 10%
  external_url: "https://www.orca.so",
  creators: [
    {
      address: "9tZGyDBftfiTjcyvBNFwy9Vq2jM6q1bDLiq4e7uPuRXE",
      share: 100,
    },
  ],
};

// If you have selected Solana then the collection starts from 0 automatically
const layerConfigurations = [
  {
    growEditionSizeTo: 9960,
    layersOrder: [
      { name: "bg", options: { bypassDNA: true } },
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
  numberOfImages: 10,
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
