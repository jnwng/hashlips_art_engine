"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const { MODE } = require(path.join(basePath, "constants/blend_mode.js"));
const { NETWORK } = require(path.join(basePath, "constants/network.js"));

const network = NETWORK.sol;

// General metadata for Ethereum
const namePrefix = "Parcl HOA";
const description =
  "A unique collection of 7,777 homes that make up the Parcl Homeowners Association (HOA).";
const baseUri = "ipfs://NewUriToReplace";

const solanaMetadata = {
  symbol: "PARCL",
  seller_fee_basis_points: 300, // Define how much % you want from secondary market sales 1000 = 10%
  external_url: "https://hoa.parcl.co",
  // TODO(jon): Figure out the new collection spec
  // Deprecated
  collection: {
    name: "Parcl",
    family: "Homeowners Association",
  },
  creators: [
    {
      // Parcl CB address
      address: "2frUDE47uesZXBebA4cw5QQNuLNuFnFbwNp8eFxUo52d",
      share: 100,
    },
    {
      // Jon's address
      address: "5dNGzQh9sonyFUcTHrH6wiCczokUMSc79miMEysyVYjK",
      share: 0,
    },
  ],
};

const regionSelector = (dna) => {
  switch (dna.region.variant) {
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

const helicopterSelector = (dna) => {
  const {
    stories: { variant: stories },
    region: { variant: region },
  } = dna;
  switch (region) {
    case "New York":
      return "helicopter-new-york.png";
    case "Los Angeles":
      return "helicopter-los-angeles.png";
    case "Miami":
      return `helicopter-miami-${stories}.png`;
    case "Phoenix":
      return "helicopter-phoenix.png";
  }
};

const solarPanelsSelector = (dna) => {
  const {
    stories: { variant: stories },
    region: { variant: region },
  } = dna;
  switch (region) {
    case "New York":
      return "solar-panels-new-york.png";
    case "Los Angeles":
      return `solar-panels-los-angeles-${stories}.png`;
    case "Miami":
      return "solar-panels-miami.png";
    case "Phoenix":
      return `solar-panels-phoenix-${stories}.png`;
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

const regionSpecificSelector =
  (trait, regions = []) =>
  (dna) => {
    const {
      region: { variant: region },
      [trait]: { variant },
    } = dna;
    if (regions.includes(region)) {
      return `${variant.toLowerCase()}-${region
        .toLowerCase()
        .replace(" ", "-")}.png`;
    }
  };

// If you have selected Solana then the collection starts from 0 automatically
const layerConfigurations = [
  {
    growEditionSizeTo: 7777,
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
            None: regionSelector,
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
        options: {
          artworkOnly: true,
          artworkVariant: {
            Fence: regionSpecificSelector("roof-fence-back", [
              "Phoenix",
              "Miami",
            ]),
          },
        },
      },
      {
        name: "driveway",
        displayName: "Driveway",
      },
      {
        name: "fence-back",
        displayName: "Fence (Back)",
        options: {
          artworkOnly: true,
          artworkVariant: {
            Fence: regionSpecificSelector("fence-back", ["Miami"]),
          },
        },
      },
      { name: "balcony", displayName: "Balcony" },
      {
        name: "driveway-tree",
        displayName: "Balcony",
        options: {
          artworkOnly: true,
          artworkVariant: {
            None: regionSpecificSelector("driveway-tree", ["New York"]),
          },
        },
      },
      {
        name: "vehicle",
        displayName: "Vehicle",
        options: {
          artworkVariant: {
            Bike: regionSpecificSelector("vehicle", ["New York"]),
            Vespa: regionSpecificSelector("vehicle", ["New York"]),
            Camry: regionSpecificSelector("vehicle", ["New York"]),
            Tesla: regionSpecificSelector("vehicle", ["New York"]),
            Porsche: regionSpecificSelector("vehicle", ["New York"]),
          },
        },
      },
      {
        name: "water-feature",
        displayName: "Water Feature",
        options: {
          artworkVariant: {
            None: (dna) => {
              if (dna.patio) {
                const {
                  patio: { variant: patio },
                } = dna;
                if (patio !== "Yard") {
                  return regionSpecificSelector("water-feature", [
                    "New York",
                    "Miami",
                    "Phoenix",
                    "Los Angeles",
                  ])(dna);
                }
              }
            },
          },
        },
      },
      { name: "pool-accessory", displayName: "Pool Accessory" },
      {
        name: "patio-back",
        displayName: "Patio (Back)",
        options: {
          artworkVariant: {
            Hedge: regionSpecificSelector("patio-back", ["New York"]),
          },
        },
      },
      {
        name: "patio",
        displayName: "Patio",
      },
      {
        name: "fence-front",
        displayName: "Fence (Front)",
        options: {
          artworkOnly: true,
          artworkVariant: {
            Fence: regionSpecificSelector("fence-front", ["Miami"]),
          },
        },
      },
      {
        name: "roof-fence-front",
        displayName: "Roof Fence (Front)",
        options: {
          artworkOnly: true,
          artworkVariant: {
            Fence: (dna) => {
              const {
                region: { variant: region },
                stories: { variant: stories },
              } = dna;
              if (region === "Phoenix") {
                return "fence-phoenix.png";
              } else if (region === "Miami") {
                return "fence-miami.png";
              } else if (region === "New York" && stories === "1.5") {
                return "fence-new-york.png";
              }
            },
          },
        },
      },
      {
        name: "roof",
        displayName: "Roof",
        options: {
          artworkVariant: {
            Helicopter: helicopterSelector,
            "Solar Panels": solarPanelsSelector,
          },
        },
      },
    ],

    // If we sort this, then then we can make sure conflicts only cascade one direction
    // Otherwise, we need to run the matching loop again
    conflicts: [
      {
        resolution: "remove",
        traits: [
          {
            trait: "water-feature",
            value: "Fountain",
          },
          {
            trait: "pool-accessory",
            value: "*",
          },
        ],
      },

      {
        resolution: "remove",
        traits: [
          {
            trait: "water-feature",
            value: "None",
          },
          {
            trait: "pool-accessory",
            value: "*",
          },
        ],
      },

      {
        resolution: "remove",
        traits: [
          {
            trait: "driveway",
            value: "Sandbox",
          },
          {
            trait: "vehicle",
            value: "*",
          },
        ],
      },

      {
        resolution: "remove",
        traits: [
          {
            trait: "driveway",
            value: "Waterfront (Boat)",
          },
          {
            trait: "vehicle",
            value: "*",
          },
        ],
      },

      {
        resolution: "remove",
        traits: [
          {
            trait: "driveway",
            value: "Waterfront (Yacht)",
          },
          {
            trait: "vehicle",
            value: "*",
          },
        ],
      },

      {
        resolution: "remove",
        traits: [
          {
            trait: "stories",
            value: "2",
          },
          {
            trait: "roof-fence-front",
            value: "*",
          },
        ],
      },

      {
        resolution: "remove",
        traits: [
          {
            trait: "stories",
            value: "2",
          },
          {
            trait: "roof-fence-back",
            value: "*",
          },
        ],
      },

      {
        resolution: "remove",
        traits: [
          {
            trait: "stories",
            value: "2",
          },
          {
            trait: "balcony",
            value: "*",
          },
        ],
      },

      {
        resolution: "remove",
        traits: [
          {
            trait: "patio",
            value: "Gazebo & BBQ",
          },
          {
            trait: "patio-back",
            value: "*",
          },
        ],
      },

      {
        resolution: "replace",
        traits: [
          {
            trait: "region",
            value: "Los Angeles",
          },
          {
            trait: "driveway",
            value: [
              "Waterfront (Boat)",
              "Waterfront (Yacht)",
              "Pavement",
              "Cobblestone",
              "Sidewalk",
            ],
          },
        ],
      },

      {
        resolution: "replace",
        traits: [
          {
            trait: "region",
            value: "Phoenix",
          },
          {
            trait: "driveway",
            value: [
              "Waterfront (Boat)",
              "Waterfront (Yacht)",
              "Pavement",
              "Cobblestone",
              "Sidewalk",
            ],
          },
        ],
      },

      {
        resolution: "replace",
        traits: [
          {
            trait: "region",
            value: "New York",
          },
          {
            trait: "driveway",
            value: [
              "Brick",
              "Grass Driveway",
              "Asphalt",
              "Sandbox",
              "Waterfront (Boat)",
              "Waterfront (Yacht)",
            ],
          },
        ],
      },

      {
        resolution: "replace",
        traits: [
          {
            trait: "region",
            value: "Miami",
          },
          {
            trait: "driveway",
            value: ["Pavement", "Cobblestone", "Sidewalk"],
          },
        ],
      },

      {
        resolution: "replace",
        traits: [
          {
            trait: "balcony",
            value: "Sunbed",
          },
          {
            trait: "patio",
            value: ["Sunbed"],
          },
        ],
      },

      {
        resolution: "replace",
        traits: [
          {
            trait: "water-feature",
            value: "None",
          },
          {
            trait: "patio",
            value: ["Furniture"],
          },
        ],
      },

      {
        resolution: "replace",
        traits: [
          {
            trait: "patio",
            value: "Yard",
          },
          {
            trait: "water-feature",
            value: ["Pool", "Fountain"],
          },
        ],
      },
    ],
    // Awkwardly, trait is matched on the slug, but variant is matched on display name
    invalidCombinations: [],

    layeringExceptions: [],
  },
];

const shuffleLayerConfigurations = false;

const debugLogs = false;

const format = {
  width: 777,
  height: 777,
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
  thumbPerRow: 25,
  thumbWidth: 250,
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
