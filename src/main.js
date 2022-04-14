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
const pools = require("/Users/jnwng/forks/hashlips_art_engine/pools.json");

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
  return (
    fs
      .readdirSync(path)
      .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
      // Don't include anything without rarity weights!
      .filter((item) => item.includes("#"))
      .map((i, index) => {
        return {
          id: index,
          name: cleanName(i),
          filename: i,
          path: `${path}${i}`,
          weight: getRarityWeight(i),
        };
      })
  );
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
    artworkVariant:
      layerObj.options?.["artworkVariant"] !== undefined
        ? layerObj.options?.["artworkVariant"]
        : false,
    metadataOnly:
      layerObj.options?.["metadataOnly"] !== undefined
        ? layerObj.options?.["metadataOnly"]
        : false,
    artworkOnly:
      layerObj.options?.["artworkOnly"] !== undefined
        ? layerObj.options?.["artworkOnly"]
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

const addAttributes = (_element, traitConfig) => {
  let selectedElement = _element.layer.selectedElement;
  if (
    traitConfig &&
    !(traitConfig.options && traitConfig.options.artworkOnly)
  ) {
    attributesList.push({
      trait_type: traitConfig.displayName || _element.layer.name,
      value: selectedElement.name,
    });
  }
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

  // addAttributes(_renderObject);
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
    return traitVariantPairs.every((pair) => {
      const match = dna.match(/Sunbed/g);
      return match && match.length >= 2;
      // return dna.includes(pair.variant);
    });
  });
  if (excluded) {
    console.info({ excluded }, dna);
  }
  return excluded;
};

const createDna = (
  _layers,
  layeringExceptions,
  conflicts,
  editionCount,
  layerConfig
) => {
  let randNum = [];

  const layersByTrait = _layers.reduce(
    (memo, layer) => ({ ...memo, [layer.name]: layer }),
    {}
  );

  const chooseTraitValue = (layer, excludeValues = []) => {
    // only choose if not already chosen
    //editionCount

    const json = JSON.parse(
      fs.readFileSync(
        `/Users/jnwng/forks/hashlips_art_engine/json-backup/${
          editionCount - 1
        }.json`
      )
    );

    const displayName = layerConfig.layersOrder.find(
      (foo) => foo.name === layer.name
    ).displayName;

    const hasTrait = json.attributes.find(
      (foo) => foo.trait_type === displayName
    );

    const filteredElements = layer.elements.filter(
      (element) => !excludeValues.includes(element.name)
    );
    let totalWeight = filteredElements.reduce(
      (memo, element) => memo + element.weight,
      0
    );

    if (hasTrait) {
      const variant = filteredElements.find(
        (foo) => foo.name === hasTrait.value
      );

      return {
        id: variant.id,
        variant: variant.name,
        filename: variant.filename,
      };
    }

    let randomNumber = Math.floor(Math.random() * totalWeight);

    for (const element of filteredElements) {
      randomNumber -= element.weight;

      if (randomNumber < 0) {
        const variant = element;

        return {
          id: variant.id,
          variant: variant.name,
          filename: variant.filename,
        };
      }
    }
  };

  let config = _layers.reduce((memo, layer) => {
    const traitValue = {
      ...chooseTraitValue(layer),
      bypassDNA: layer.bypassDNA,
    };

    memo[layer.name] = traitValue;
    return memo;
  }, {});

  const resolveConflicts = (config, conflicts) => {
    const replacementConflicts = conflicts.filter(
      (conflict) => conflict.resolution === "replace"
    );
    const applicableConflicts = replacementConflicts.filter((conflict) => {
      return conflict.traits.every(({ trait, value }) => {
        return [].concat(value).includes(config[trait].variant);
      });
    });

    if (applicableConflicts.length) {
      applicableConflicts.forEach((applicableConflict) => {
        const {
          traits: [, secondTrait],
        } = applicableConflict;
        const layer = layersByTrait[secondTrait.trait];
        const newValue = chooseTraitValue(layer, [].concat(secondTrait.value));
        console.info(
          `Replacing ${config[secondTrait.trait].variant} with ${
            newValue.variant
          }`
        );
        config[secondTrait.trait] = newValue;
      });
    }

    const removalConflicts = conflicts
      .filter((conflict) => conflict.resolution === "remove")
      .filter((conflict) => {
        return conflict.traits.every(({ trait, value }) => {
          return (
            config[trait].variant === value ||
            (!!config[trait] && value === "*")
          );
        });
      });

    removalConflicts.forEach(({ traits: [, secondTrait] }) => {
      console.info("Deleting", { foo: secondTrait.trait });
      config[secondTrait.trait] = layersByTrait[
        secondTrait.trait
      ].elements.find((element) => element.name === "None");
    });

    return config;
  };

  config = resolveConflicts(config, conflicts);

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
    if (
      layer &&
      layer.artworkVariant &&
      layer.artworkVariant[variant.variant]
    ) {
      filename = layer.artworkVariant[variant.variant](config);
      if (filename) {
        console.info(`Using variant: ${filename}`);
      } else {
        filename = variant.filename;
      }
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

  delete metadata.edition;

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
      console.info({ editionCount, pools: pools.includes(`${editionCount}`) });
      if (!pools.includes(`${editionCount - 1}`)) {
        editionCount++;
        abstractedIndexes.shift();
      } else {
        let { dna: newDna, layers: layerOrder } = createDna(
          layers,
          layerConfigurations[layerConfigIndex].layeringExceptions,
          layerConfigurations[layerConfigIndex].conflicts,
          editionCount,
          layerConfigurations[layerConfigIndex]
        );
        // if (
        //   isDnaUnique(dnaList, newDna) &&
        //   !isExcluded(
        //     newDna,
        //     layerConfigurations[layerConfigIndex].invalidCombinations
        //   )
        // ) {
        let results = constructLayerToDna(newDna, layerOrder);
        let loadedElements = [];

        results.forEach((layer) => {
          const layerConfig = layers.find(
            (_layer) => _layer.name === layer.name
          );
          if (!layerConfig.metadataOnly) {
            loadedElements.push(loadLayerImg(layer));
          } else {
            const foo = layerConfigurations[layerConfigIndex].layersOrder.find(
              (l) => l.name === layer.name
            );
            addAttributes({ layer }, foo);
          }
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

            addAttributes(
              renderObject,
              layerConfigurations[layerConfigIndex].layersOrder.find(
                (l) => l.name === renderObject.layer.name
              )
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
          // addMetadata(newDna, abstractedIndexes[0]);
          // saveMetaDataSingleFile(abstractedIndexes[0]);
          console.log(
            `Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(
              newDna
            )}`
          );
        });
        dnaList.add(filterDNAOptions(newDna));
        editionCount++;
        abstractedIndexes.shift();
        // } else {
        //   // console.log("DNA exists!");
        //   failedCount++;
        //   // Removing this check because it doesn't really help us
        //   // if (failedCount >= uniqueDnaTorrance) {
        //   //   console.log(
        //   //     `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
        //   //   );
        //   //   process.exit();
        //   // }
        // }
      }
    }
    layerConfigIndex++;
  }
  writeMetaData(JSON.stringify(metadataList, null, 2));
};

module.exports = { startCreating, buildSetup, getElements };
