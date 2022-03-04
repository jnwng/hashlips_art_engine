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
  symbol: "PARCL",
  seller_fee_basis_points: 300, // Define how much % you want from secondary market sales 1000 = 10%
  external_url: "https://nft.parcl.co",
  // TODO(jon): Figure out the new collection spec
  // Deprecated
  collection: {
    name: "Orca",
    family: "Orcanauts",
  },
  creators: [
    // {
    //   // Cori's address
    //   address: "BPbS1AC4KW5SBiz8M2AgPtWXTzR1ekBwMLLQLcwdvZnE",
    //   share: 0,
    // },
    // {
    //   // Jon's address
    //   address: "5dNGzQh9sonyFUcTHrH6wiCczokUMSc79miMEysyVYjK",
    //   share: 0,
    // },
    // {
    //   // Secondary sales wallet
    //   address: "E3G6ujBGbusExBAPL5hg62xu5ncWeVh9CLjU9qbusVvs",
    //   share: 100,
    // },
  ],
};

const regionSelector = (dna) => {
  switch (dna.region) {
    case "New York":
      return "new-york.png";
    case "Los Angeles":
      return "los-angeles.png";
    case "Miami":
      return "miami.png";
    case "Phoenix":
      return "phoenix.png";
  }
};

const regionStoriesSelector = (dna) => {
  const {
    stories: { variant: stories },
    region: { variant: region },
  } = dna;
  const buildingMaterial = dna["building-material"].variant
    .toLowerCase()
    .replace(" ", "-");
  switch (region) {
    case "New York":
      return `new-york-${stories}-${buildingMaterial}.png`;
    case "Phoenix":
      return `phoenix-${stories}-${buildingMaterial}.png`;
    case "Miami":
      return `miami-${stories}-${buildingMaterial}.png`;
    case "Los Angeles":
      return `los-angeles-${stories}-${buildingMaterial}.png`;
  }
};

// If you have selected Solana then the collection starts from 0 automatically
const layerConfigurations = [
  {
    growEditionSizeTo: 25,
    layersOrder: [
      {
        name: "region",
        displayName: "Region",
        options: { metadataOnly: true },
      },
      {
        name: "stories",
        displayName: "Stories",
        options: { metadataOnly: true },
      },
      {
        name: "background",
        displayName: "Background",
        options: { bypassDNA: true },
      },
      { name: "shadow", displayName: "Shadow", options: { artworkOnly: true } },
      {
        name: "background-region",
        displayName: "Background (Region)",
        options: {
          artworkOnly: true,
          artworkVariant: {
            background: regionSelector,
          },
        },
      },
      {
        name: "building-material",
        displayName: "Building Material",
        options: {
          artworkVariant: {
            "Dark Gray": regionStoriesSelector,
            "Light Gray": regionStoriesSelector,
            Tan: regionStoriesSelector,
          },
        },
      },
      {
        name: "roof-fence-back",
        displayName: "Roof Fence (Back)",
        options: { artworkOnly: true },
        // Needs variants
      },
      { name: "driveway", displayName: "Driveway" },
      {
        name: "fence-back",
        displayName: "Fence (Back)",
        options: { artworkOnly: true },
      },
      { name: "balcony", displayName: "Balcony" },
      { name: "vehicle", displayName: "Vehicle" },
      { name: "water-feature", displayName: "Water Feature" },
      { name: "pool-accessory", displayName: "Pool Accessory" },
      { name: "patio-back", displayName: "Patio (Back)" },
      { name: "patio", displayName: "Patio" },
      {
        name: "fence-front",
        displayName: "Fence (Front)",
        options: { artworkOnly: true },
      },
      {
        name: "roof-fence-front",
        displayName: "Roof Fence (Front)",
        options: { artworkOnly: true },
      },
      {
        name: "roof",
        displayName: "Roof",
        options: {
          artworkVariant: {
            helicopter: regionSelector,
          },
        },
      },
    ],
    // Had to rename "background" -> "bg", "hat" -> "hats"
    // Awkwardly, trait is matched on the slug, but variant is matched on display name
    invalidCombinations: [
      ...["Bike", "Vespa", "Camry", "Porsche", "Tesla"].map((vehicle) => {
        return [
          {
            trait: "driveway",
            variant: "2",
          },
          {
            trait: "vehicle",
            variant: vehicle,
          },
        ];
      }),
      ...["Bike", "Vespa", "Camry", "Porsche", "Tesla"].map((vehicle) => {
        return [
          {
            trait: "driveway",
            variant: "Waterfront",
          },
          {
            trait: "pool-accessory",
            variant: vehicle,
          },
        ];
      }),
      ...["Bike", "Vespa", "Camry", "Porsche", "Tesla"].map((vehicle) => {
        return [
          {
            trait: "driveway",
            variant: "Luxury Waterfront",
          },
          {
            trait: "pool-accessory",
            variant: vehicle,
          },
        ];
      }),
      ...["Swan", "Pineapple", "Diving Board", "Duck"].map((poolAccessory) => {
        return [
          {
            trait: "water-feature",
            variant: "Fountain",
          },
          {
            trait: "pool-accessory",
            variant: poolAccessory,
          },
        ];
      }),
      ...["roof-fence", "roof-fence-back"].map((trait) => {
        return [
          {
            trait: "stories",
            variant: "2",
          },
          {
            trait,
            variant: "Fence",
          },
        ];
      }),
      ...["Sunbed", "TV"].map((balcony) => {
        return [
          {
            trait: "stories",
            variant: "2",
          },
          {
            trait: "balcony",
            variant: balcony,
          },
        ];
      }),
    ],

    layeringExceptions: [],
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
