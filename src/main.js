"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const { NETWORK } = require(path.join(basePath, "constants/network.js"));
const fs = require("fs");
const sha1 = require(path.join(basePath, "/node_modules/sha1"));
const { createCanvas, loadImage } = require(path.join(
  basePath,
  "/node_modules/canvas"
));
const buildDir = path.join(basePath, "/build");
const layersDir = path.join(basePath, "/layers");
const {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
} = require(path.join(basePath, "/src/config.js"));
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
var metadataList = [];
var attributesList = [];
var dnaList = new Set();
// We use hyphens for some layers
const DNA_DELIMITER = "~";
const HashlipsGiffer = require(path.join(
  basePath,
  "/modules/HashlipsGiffer.js"
));

let hashlipsGiffer = null;

const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  fs.mkdirSync(path.join(buildDir, "/json"));
  fs.mkdirSync(path.join(buildDir, "/images"));
  if (gif.export) {
    fs.mkdirSync(path.join(buildDir, "/gifs"));
  }
};

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1;
  }
  return nameWithoutWeight;
};

const cleanDna = (_str) => {
  const withoutOptions = removeQueryStrings(_str);
  var dna = Number(withoutOptions.split(":").shift());
  return dna;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    elements: getElements(`${layersDir}/${layerObj.name}/`),
    name:
      layerObj.options?.["displayName"] != undefined
        ? layerObj.options?.["displayName"]
        : layerObj.name,
    blend:
      layerObj.options?.["blend"] != undefined
        ? layerObj.options?.["blend"]
        : "source-over",
    opacity:
      layerObj.options?.["opacity"] != undefined
        ? layerObj.options?.["opacity"]
        : 1,
    bypassDNA:
      layerObj.options?.["bypassDNA"] !== undefined
        ? layerObj.options?.["bypassDNA"]
        : false,
    getFilename:
      layerObj.options?.["getFilename"] !== undefined
        ? layerObj.options?.["getFilename"]
        : false,
    metadataOnly:
      layerObj.options?.["metadataOnly"] !== undefined
        ? layerObj.options?.["metadataOnly"]
        : false,
  }));
  return layers;
};

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `${buildDir}/images/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = background.static ? background.default : genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};

const addMetadata = (_dna, _edition) => {
  let dateTime = Date.now();
  let tempMetadata = {
    // Adding one to start at one instead. We'll zero-index everything else for use with Candy Machine
    name: `${namePrefix} #${_edition + 1}`,
    description: description,
    image: `${baseUri}/${_edition}.png`,
    dna: sha1(_dna),
    edition: _edition,
    date: dateTime,
    ...extraMetadata,
    attributes: attributesList,
    compiler: "HashLips Art Engine",
  };
  if (network == NETWORK.sol) {
    tempMetadata = {
      //Added metadata for solana
      name: tempMetadata.name,
      symbol: solanaMetadata.symbol,
      description: tempMetadata.description,
      //Added metadata for solana
      seller_fee_basis_points: solanaMetadata.seller_fee_basis_points,
      image: `image.png`,
      //Added metadata for solana
      external_url: solanaMetadata.external_url,
      edition: _edition,
      ...extraMetadata,
      attributes: tempMetadata.attributes,
      properties: {
        files: [
          {
            uri: "image.png",
            type: "image/png",
          },
        ],
        category: "image",
        creators: solanaMetadata.creators,
      },
    };
  }
  metadataList.push(tempMetadata);
  attributesList = [];
};

const humanReadableNames = {
  none: "None",
  baseball: "Baseball Cap",
  bucket: "Bucket Hat",
  flower: "Flower",
  bandana: "Bandana",
  pirate: "Pirate Hat",
  headphones: "AUDIUS Headphones",
  chef: "MARINADE Chef Hat",
  ninja: "NINJA Hood",
  astronaut: "Astronaut Helmet",
  basic: "Basic",
  happy: "Happy",
  sleepy: "Sleepy",
  droopy: "Droopy",
  mischievous: "Mischevous",
  anime: "Glittery",
  aviators: "Aviator Sunglasses",
  cartoon: "Side-eye",
  snorkel: "SOCN Snorkel",
  "sol-sunglasses": "SOL Sunglasses",
  grin: "Grin",
  smile: "Smile",
  frown: "Frown",
  smirk: "Smirk",
  cat: "Cat",
  vampire: "Vampire",
  tongue: "Tongue",
  "golden-teeth": "Golden Teeth",
  "aurory-mask": "AURORY Mask",
  kelp: "Kelp",
  scallop: "Scallop",
  coral: "Coral",
  hedgehog: "HOG Pet",
  mug: "ORCA Mug",
  "sol-beach-ball": "SOL Beach Ball",
  phantom: "PHANTOM Ghost",
  samo: "SAMO Pet",
  saber: "SBR Saber",
  spaceship: "ATLAS Ship",
  "basic-coral": "Basic, Coral",
  "basic-honey": "Basic, Honey",
  "basic-lagoon": "Basic, Lagoon",
  "basic-mellow": "Basic, Mellow",
  "basic-orchid": "Basic, Orchid",
  waves: "Waves",
  beach: "Beach",
  river: "River",
  mondrian: "Mondrian",
  "outer-space": "Outer Space",
  defi: "DeFi Land",
  "nyc-night": "New York City",
  tokyo: "Tokyo",
  "sol-season": "SOL Season",
  blue: "Blue",
  red: "Pink",
  yellow: "Yellow",
  orca: "Orca",
  holo: "Holographic",
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  attributesList.push({
    trait_type: _element.layer.name,
    value: humanReadableNames[selectedElement.name],
  });
};

const loadLayerImg = async (_layer) => {
  return new Promise(async (resolve) => {
    const image = await loadImage(`${_layer.selectedElement.path}`);
    resolve({ layer: _layer, loadedImage: image });
  });
};

const addText = (_sig, x, y, size) => {
  ctx.fillStyle = text.color;
  ctx.font = `${text.weight} ${size}pt ${text.family}`;
  ctx.textBaseline = text.baseline;
  ctx.textAlign = text.align;
  ctx.fillText(_sig, x, y);
};

const drawElement = (_renderObject, _index, _layersLen) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.globalCompositeOperation = _renderObject.layer.blend;
  text.only
    ? addText(
        `${_renderObject.layer.name}${text.spacer}${_renderObject.layer.selectedElement.name}`,
        text.xGap,
        text.yGap * (_index + 1),
        text.size
      )
    : ctx.drawImage(
        _renderObject.loadedImage,
        0,
        0,
        format.width,
        format.height
      );

  addAttributes(_renderObject);
};

const constructLayerToDna = (_dna = "", _layers = []) => {
  let mappedDnaToLayers = _layers.map((layer, index) => {
    const dna = _dna.split(DNA_DELIMITER)[index];
    const realFilename = removeQueryStrings(dna.split(":")[1]);
    let selectedElement = layer.elements.find((e) => e.id == cleanDna(dna));
    return {
      name: layer.name,
      blend: layer.blend,
      opacity: layer.opacity,
      selectedElement: {
        ...selectedElement,
        filename: realFilename,
        path: selectedElement.path.replace(
          selectedElement.filename,
          realFilename
        ),
      },
    };
  });
  return mappedDnaToLayers;
};

/**
 * In some cases a DNA string may contain optional query parameters for options
 * such as bypassing the DNA isUnique check, this function filters out those
 * items without modifying the stored DNA.
 *
 * @param {String} _dna New DNA string
 * @returns new DNA string with any items that should be filtered, removed.
 */
const filterDNAOptions = (_dna) => {
  const dnaItems = _dna.split(DNA_DELIMITER);
  const filteredDNA = dnaItems.filter((element) => {
    const query = /(\?.*$)/;
    const querystring = query.exec(element);
    if (!querystring) {
      return true;
    }
    const options = querystring[1].split("&").reduce((r, setting) => {
      const keyPairs = setting.split("=");
      return { ...r, [keyPairs[0]]: keyPairs[1] };
    }, []);

    return options.bypassDNA;
  });

  return filteredDNA.join(DNA_DELIMITER);
};

/**
 * Cleaning function for DNA strings. When DNA strings include an option, it
 * is added to the filename with a ?setting=value query string. It needs to be
 * removed to properly access the file name before Drawing.
 *
 * @param {String} _dna The entire newDNA string
 * @returns Cleaned DNA string without querystring parameters.
 */
const removeQueryStrings = (_dna) => {
  const query = /(\?.*$)/;
  return _dna.replace(query, "");
};

const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
  const _filteredDNA = filterDNAOptions(_dna);
  return !_DnaList.has(_filteredDNA);
};

const isExcluded = (dna, invalidCombinations) => {
  const excluded = invalidCombinations.some((traitVariantPairs) => {
    return traitVariantPairs.every((pair) => dna.includes(pair.variant));
  });
  if (excluded) {
    console.info({ excluded }, dna);
  }
  return excluded;
};

// const previewGif = [
// {
//   bg: "basic-orchid",
//   body: "blue",
//   eyes: "sol-sunglasses",
//   mouth: "smirk",
//   hats: "baseball",
//   accessory: "sol-beach-ball",
// },
// {
//   bg: "basic-honey",
//   body: "red",
//   eyes: "basic",
//   mouth: "grin",
//   hats: "flower",
//   accessory: "spaceship",
// },

// {
//   bg: "basic-orchid",
//   body: "yellow",
//   eyes: "droopy",
//   mouth: "smirk",
//   hats: "bucket",
//   accessory: "kelp",
// },
// {
//   bg: "river",
//   body: "yellow",
//   eyes: "happy",
//   mouth: "tongue",
//   hats: "bucket",
//   accessory: "kelp",
// },
// {
//   bg: "basic-mellow",
//   body: "yellow",
//   eyes: "happy",
//   mouth: "cat",
//   hats: "headphones",
//   accessory: "none",
// },
// {
//   bg: "waves",
//   body: "yellow",
//   eyes: "snorkel",
//   mouth: "frown",
//   hats: "none",
//   accessory: "kelp",
// },
// {
//   bg: "basic-honey",
//   body: "red",
//   eyes: "mischievous",
//   mouth: "tongue",
//   hats: "ninja",
//   accessory: "scallop",
// },

// {
//   bg: "basic-lagoon",
//   body: "yellow",
//   eyes: "anime",
//   mouth: "smirk",
//   hats: "none",
//   accessory: "hedgehog",
// },
// {
//   bg: "basic-coral",
//   body: "blue",
//   eyes: "cartoon",
//   mouth: "smile",
//   hats: "chef",
//   accessory: "none",
// },
// {
//   bg: "basic-orchid",
//   body: "blue",
//   eyes: "anime",
//   mouth: "smirk",
//   hats: "astronaut",
//   accessory: "samo",
// },
// {
//   bg: "tokyo",
//   body: "blue",
//   eyes: "mischievous",
//   mouth: "grin",
//   hats: "ninja",
//   accessory: "none",
// },
// {
//   bg: "basic-coral",
//   body: "yellow",
//   eyes: "anime",
//   mouth: "basic",
//   hats: "headphones",
//   accessory: "phantom",
// },
// {
//   bg: "beach",
//   body: "blue",
//   eyes: "sol-sunglasses",
//   mouth: "cat",
//   hats: "bandana",
//   accessory: "sol-beach-ball",
// },
// {
//   bg: "basic-lagoon",
//   body: "red",
//   eyes: "sleepy",
//   mouth: "smile",
//   hats: "bandana",
//   accessory: "mug",
// },
// {
//   bg: "basic-honey",
//   body: "blue",
//   eyes: "mischievous",
//   mouth: "golden-teeth",
//   hats: "pirate",
//   accessory: "saber",
// },
// {
//   bg: "basic-mellow",
//   body: "red",
//   eyes: "snorkel",
//   mouth: "basic",
//   hats: "none",
//   accessory: "kelp",
// },
// {
//   bg: "nyc-night",
//   body: "red",
//   eyes: "mischievous",
//   mouth: "frown",
//   hats: "baseball",
//   accessory: "mug",
// },
// ];

const previewGif = [
  // Atamari
  {
    bg: "beach",
    body: "orca",
    eyes: "cartoon",
    mouth: "basic",
    hats: "headphones",
    accessory: "phantom",
  },
  // Scuba
  {
    bg: "beach",
    body: "orca",
    eyes: "snorkel",
    mouth: "vampire",
    hats: "none",
    accessory: "none",
  },
  // ori
  {
    bg: "beach",
    body: "orca",
    eyes: "sol-sunglasses",
    mouth: "smirk",
    hats: "bandana",
    accessory: "mug",
  },
  // kiko
  {
    bg: "outer-space",
    body: "orca",
    eyes: "anime",
    mouth: "smirk",
    hats: "astronaut",
    accessory: "kelp",
  },
  // nautilus
  {
    bg: "waves",
    body: "orca",
    eyes: "anime",
    mouth: "vampire",
    hats: "pirate",
    accessory: "saber",
  },
  // milan
  {
    bg: "outer-space",
    body: "orca",
    eyes: "happy",
    mouth: "vampire",
    hats: "astronaut",
    accessory: "phantom",
  },
  // meep
  {
    bg: "outer-space",
    body: "orca",
    eyes: "droopy",
    mouth: "smile",
    hats: "chef",
    accessory: "samo",
  },
  // Pax
  {
    bg: "tokyo",
    body: "orca",
    eyes: "mischievous",
    mouth: "vampire",
    hats: "baseball",
    accessory: "phantom",
  },
  // Sloth
  {
    bg: "outer-space",
    body: "orca",
    eyes: "happy",
    mouth: "tongue",
    hats: "astronaut",
    accessory: "mug",
  },
  // Leo
  {
    bg: "mondrian",
    body: "orca",
    eyes: "sleepy",
    mouth: "frown",
    hats: "chef",
    accessory: "mug",
  },
  // Cori
  {
    bg: "tokyo",
    body: "holo",
    eyes: "mischievous",
    mouth: "vampire",
    hats: "headphones",
    accessory: "none",
  },
  // Jon
  {
    bg: "nyc-night",
    body: "holo",
    eyes: "aviators",
    mouth: "tongue",
    hats: "baseball",
    accessory: "samo",
  },
  // yutaro
  {
    bg: "outer-space",
    body: "orca",
    eyes: "droopy",
    mouth: "smirk",
    hats: "bucket",
    accessory: "mug",
  },
  // tmoc
  {
    bg: "beach",
    body: "orca",
    eyes: "mischievous",
    mouth: "vampire",
    hats: "pirate",
    accessory: "mug",
  },
  // Yibo
  {
    bg: "nyc-night",
    body: "orca",
    eyes: "happy",
    mouth: "smile",
    hats: "headphones",
    accessory: "mug",
  },
  // Jordan
  {
    bg: "nyc-night",
    body: "orca",
    eyes: "aviators",
    mouth: "tongue",
    hats: "headphones",
    accessory: "samo",
  },
  // // Thazin
  {
    bg: "tokyo",
    body: "orca",
    eyes: "sol-sunglasses",
    mouth: "tongue",
    hats: "bandana",
    accessory: "samo",
  },
  // Fiskantes
  {
    bg: "tokyo",
    body: "holo",
    eyes: "anime",
    mouth: "vampire",
    hats: "pirate",
    accessory: "mug",
  },
  // SolBigBrain
  {
    bg: "waves",
    body: "holo",
    eyes: "cartoon",
    mouth: "basic",
    hats: "baseball",
    accessory: "saber",
  },
  // Austin
  {
    bg: "beach",
    body: "holo",
    mouth: "smile",
    eyes: "cartoon",
    accessory: "kelp",
    hats: "headphones",
  },
  // Audius
  {
    bg: "nyc-night",
    body: "holo",
    mouth: "tongue",
    eyes: "cartoon",
    accessory: "saber",
    hats: "headphones",
  },
  // JungleCats
  {
    bg: "river",
    body: "holo",
    mouth: "cat",
    eyes: "anime",
    accessory: "kelp",
    hats: "bucket",
  },
  // Star Atlas
  {
    bg: "outer-space",
    body: "holo",
    mouth: "smile",
    eyes: "happy",
    accessory: "spaceship",
    hats: "astronaut",
  },

  // Marinade
  {
    bg: "defi",
    body: "holo",
    mouth: "smirk",
    eyes: "droopy",
    accessory: "scallop",
    hats: "chef",
  },
  // SAMO
  {
    bg: "outer-space",
    body: "holo",
    mouth: "tongue",
    eyes: "aviators",
    accessory: "samo",
    hats: "baseball",
  },
  // Magic Eden
  {
    bg: "nyc-night",
    body: "holo",
    mouth: "golden-teeth",
    eyes: "mischievous",
    accessory: "mug",
    hats: "pirate",
  },
  // DeFi Land
  {
    bg: "defi",
    body: "holo",
    mouth: "basic",
    eyes: "anime",
    accessory: "sol-beach-ball",
    hats: "baseball",
  },
  // Hedgehog
  {
    bg: "beach",
    body: "holo",
    mouth: "smile",
    eyes: "aviators",
    accessory: "hedgehog",
    hats: "bandana",
  },
  // Grape
  {
    bg: "basic-orchid",
    body: "holo",
    mouth: "smirk",
    eyes: "sol-sunglasses",
    accessory: "sol-beach-ball",
    hats: "baseball",
  },
];

const createDna = (_layers, layeringExceptions) => {
  let randNum = [];

  const previewConfig = previewGif.shift();

  const config = {};
  _layers.forEach((layer) => {
    const trait = layer.name;
    const _variant = previewConfig[layer.name];
    const variant = layer.elements.find(({ name }) => name === _variant);
    config[trait] = {
      id: variant.id,
      variant: variant.name,
      filename: variant.filename,
      bypassDNA: layer.bypassDNA,
    };
    // randNum.push(
    //   `${layerElement.id}:${layerElement.filename}${
    //     layer.bypassDNA ? "?bypassDNA=true" : ""
    //   }`
    // );
    // var totalWeight = 0;
    // layer.elements.forEach((element) => {
    //   totalWeight += element.weight;
    // });
    // // number between 0 - totalWeight
    // let random = Math.floor(Math.random() * totalWeight);
    // for (var i = 0; i < layer.elements.length; i++) {
    //   // subtract the current weight from the random weight until we reach a sub zero value.
    //   random -= layer.elements[i].weight;
    //   if (random < 0) {
    //     const trait = layer.name;
    //     const variant = layer.elements[i];

    // Keep track of the chosen configuration
    // config[trait] = {
    //   id: variant.id,
    //   variant: variant.name,
    //   filename: variant.filename,
    //   bypassDNA: layer.bypassDNA,
    // };
    //       return;
    //     }
    //   }
  });

  const layeringException = layeringExceptions.find(({ exception }) => {
    return (
      config[exception.trait] &&
      config[exception.trait].variant === exception.variant
    );
  });

  let layerOrder = _layers;
  if (layeringException) {
    const { layers } = layeringException;
    layerOrder = layers.map((__layer) =>
      _layers.find(({ name }) => name === __layer.name)
    );
  }
  const dna = layerOrder.map((__layer) => {
    const variant = config[__layer.name];
    const layer = _layers.find(({ name }) => __layer.name === name);
    let filename = variant.filename;
    if (layer && layer.getFilename) {
      filename = layer.getFilename(filename, config);
    }
    randNum.push(
      `${variant.id}:${filename}${variant.bypassDNA ? "?bypassDNA=true" : ""}`
    );
  });

  return {
    dna: randNum.join(DNA_DELIMITER),
    layers: layerOrder,
  };
};

const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/json/_metadata.json`, _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  let metadata = metadataList.find((meta) => meta.edition == _editionCount);
  debugLogs
    ? console.log(
        `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
      )
    : null;
  fs.writeFileSync(
    `${buildDir}/json/${_editionCount}.json`,
    JSON.stringify(metadata, null, 2)
  );
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

const startCreating = async () => {
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes = [];
  for (
    let i = network == NETWORK.sol ? 0 : 1;
    i <= layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo;
    i++
  ) {
    abstractedIndexes.push(i);
  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
  }
  debugLogs
    ? console.log("Editions left to create: ", abstractedIndexes)
    : null;
  while (layerConfigIndex < layerConfigurations.length) {
    const layers = layersSetup(
      layerConfigurations[layerConfigIndex].layersOrder
    );
    while (
      editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo
    ) {
      let { dna: newDna, layers: layerOrder } = createDna(
        layers,
        layerConfigurations[layerConfigIndex].layeringExceptions
      );
      console.info({ foo: isDnaUnique(dnaList, newDna), editionCount });
      if (
        isDnaUnique(dnaList, newDna) &&
        !isExcluded(
          newDna,
          layerConfigurations[layerConfigIndex].invalidCombinations
        )
      ) {
        let results = constructLayerToDna(newDna, layerOrder);
        let loadedElements = [];

        results.forEach((layer) => {
          loadedElements.push(loadLayerImg(layer));
        });

        await Promise.all(loadedElements).then((renderObjectArray) => {
          debugLogs ? console.log("Clearing canvas") : null;
          ctx.clearRect(0, 0, format.width, format.height);
          if (gif.export) {
            hashlipsGiffer = new HashlipsGiffer(
              canvas,
              ctx,
              `${buildDir}/gifs/${abstractedIndexes[0]}.gif`,
              gif.repeat,
              gif.quality,
              gif.delay
            );
            hashlipsGiffer.start();
          }
          if (background.generate) {
            drawBackground();
          }
          renderObjectArray.forEach((renderObject, index) => {
            drawElement(
              renderObject,
              index,
              layerConfigurations[layerConfigIndex].layersOrder.length
            );
            if (gif.export) {
              hashlipsGiffer.add();
            }
          });
          if (gif.export) {
            hashlipsGiffer.stop();
          }
          debugLogs
            ? console.log("Editions left to create: ", abstractedIndexes)
            : null;
          saveImage(abstractedIndexes[0]);
          addMetadata(newDna, abstractedIndexes[0]);
          saveMetaDataSingleFile(abstractedIndexes[0]);
          console.log(
            `Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(
              newDna
            )}`
          );
        });
        dnaList.add(filterDNAOptions(newDna));
        editionCount++;
        abstractedIndexes.shift();
      } else {
        // console.log("DNA exists!");
        failedCount++;
        // Removing this check because it doesn't really help us
        // if (failedCount >= uniqueDnaTorrance) {
        //   console.log(
        //     `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
        //   );
        //   process.exit();
        // }
      }
    }
    layerConfigIndex++;
  }
  writeMetaData(JSON.stringify(metadataList, null, 2));
};

module.exports = { startCreating, buildSetup, getElements };
