// script.js
const axios = require("axios");

const { WebURL, PageData, Collection, Product, Vector } = require("../models");
const ProductData = require("../models/ProductData");
const {
  createChunkFromProduct,
  embedChunk,
  chunkProduct,
  embedChunks,
} = require("./ai.service");
const db = require("../config/sequelize.config");
const ApiError = require("../utils/ApiError");
// A helper function to parse all <loc> tags from a given sitemap URL.

// const getCollections = async () => {
//   try {
//     // 1) Get links from the main sitemap
//     const mainSitemapUrl = "https://coffeetec.com/sitemap.xml";
//     const mainLinks = await getSitemapLinks(mainSitemapUrl);

//     // 2) Filter to find any collections sitemaps
//     //    In your case, you mentioned you see a link like:
//     //    https://coffeetec.com/sitemap_collections_1.xml?from=21276327968&to=477907026197
//     const collectionSitemapLinks = mainLinks.filter((link) =>
//       link.includes("sitemap_collections")
//     );

//     // If we already know the full URL, we can skip the filter step and just set it:
//     // const collectionSitemapLinks = [
//     //   "https://coffeetec.com/sitemap_collections_1.xml?from=21276327968&to=477907026197"
//     // ];

//     let allCollectionUrls = [];

//     // 3) For each discovered collections sitemap, fetch + parse the actual collection URLs
//     for (const sitemapUrl of collectionSitemapLinks) {
//       const collectionLinks = await getSitemapLinks(sitemapUrl);
//       // Each entry in "collectionLinks" should be a direct /collections/... URL
//       allCollectionUrls = allCollectionUrls.concat(collectionLinks);
//     }

//     // Print out all discovered collection URLs
//     console.log("All Collection URLs:");
//     return allCollectionUrls;
//   } catch (error) {
//     console.error("Error:", error);
//   }
// };

const getAllProducts = async () => {
  try {
    // const collections = await getCollections();
    const collections = [
      // "https://coffeetec.com/collections/02-dockside",
      // "https://coffeetec.com/collections/01-cupping-lab",
      // "https://coffeetec.com/collections/000-used-equipment",
      // "https://coffeetec.com/collections/03-coffee-handling",
      // "https://coffeetec.com/collections/05-loaders",
      // "https://coffeetec.com/collections/06-roasters",
      // "https://coffeetec.com/collections/07-afterburner-options",
      // "https://coffeetec.com/collections/dockside-items",
      // "https://coffeetec.com/collections/triers",
      // "https://coffeetec.com/collections/08-stoner-conveyors",
      // "https://coffeetec.com/collections/10-grinders",
      // "https://coffeetec.com/collections/11-mixers-flavor",
      // "https://coffeetec.com/collections/15-sealers",
      // "https://coffeetec.com/collections/16-form-fill-seal",
      // "https://coffeetec.com/collections/17-packaging-k-cup",
      // "https://coffeetec.com/collections/18-coffee-house",
      // "https://coffeetec.com/collections/19-brewers",
      // "https://coffeetec.com/collections/21-maintenance",
      // "https://coffeetec.com/collections/sample-roasters",
      // "https://coffeetec.com/collections/08-stoner-conveyors",
      // "https://coffeetec.com/collections/10-grinders",
      // "https://coffeetec.com/collections/11-mixers-flavor",
      // "https://coffeetec.com/collections/15-sealers",
      // "https://coffeetec.com/collections/16-form-fill-seal",
      // "https://coffeetec.com/collections/17-packaging-k-cup",
      // "https://coffeetec.com/collections/18-coffee-house",
      // "https://coffeetec.com/collections/19-brewers",
      // "https://coffeetec.com/collections/21-maintenance",
      // "https://coffeetec.com/collections/sample-roasters",
      // "https://coffeetec.com/collections/scales",
      // "https://coffeetec.com/collections/color-readers-analyzers",
      // "https://coffeetec.com/collections/meters-oxygen-moisture-volumetric",
      // "https://coffeetec.com/collections/sizing-testing-sieves-shakers",
      // "https://coffeetec.com/collections/2-1-4-lbs-min",
      // "https://coffeetec.com/collections/commercial-grinders",
      // "https://coffeetec.com/collections/roasters",
      // "https://coffeetec.com/collections/packaging-machines",
      // "https://coffeetec.com/collections/industrial-commercial",
      // "https://coffeetec.com/collections/retail-shop-shop-batch",
      // "https://coffeetec.com/collections/bag-needles",
      // "https://coffeetec.com/collections/burlap-bag-closers",
      // "https://coffeetec.com/collections/vacuum-sealing",
      // "https://coffeetec.com/collections/production-machinery",
      // "https://coffeetec.com/collections/espresso-machines",
      // "https://coffeetec.com/collections/00-antiques",
      // "https://coffeetec.com/collections/antique-roasters",
      // "https://coffeetec.com/collections/endecotts-screens-shakers",
      // "https://coffeetec.com/collections/mahlkonig",
      // "https://coffeetec.com/collections/ditting",
      // "https://coffeetec.com/collections/constant-heat-sealers",
      // "https://coffeetec.com/collections/impulse-sealers",
      // "https://coffeetec.com/collections/band-sealers",
      // "https://coffeetec.com/collections/hand-simple-sealers",
      // "https://coffeetec.com/collections/airpots-servers",
      // "https://coffeetec.com/collections/destoners-portable",
      // "https://coffeetec.com/collections/huller",
      // "https://coffeetec.com/collections/plant-equipment",
      // "https://coffeetec.com/collections/k-cup-nespresso-sealer",
      // "https://coffeetec.com/collections/silos",
      // "https://coffeetec.com/collections/sold-out",
      // "https://coffeetec.com/collections/probat",
      // "https://coffeetec.com/collections/diedrich",
      // "https://coffeetec.com/collections/joper",
      //done till this
      // "https://coffeetec.com/collections/giesen",
      // "https://coffeetec.com/collections/buhler",
      // "https://coffeetec.com/collections/loring-roasters",
      // "https://coffeetec.com/collections/us-roasters",
      // "https://coffeetec.com/collections/sale-items",
      // "https://coffeetec.com/collections/everything-but-roasters",
      // "https://coffeetec.com/collections/5000-dollar-value-or-less",
      // "https://coffeetec.com/collections/primo-roasters",
      // "https://coffeetec.com/collections/1-to-3-kilo-roasters",
      // "https://coffeetec.com/collections/atilla-roasters",
      // "https://coffeetec.com/collections/roasters-san-franciscan",
      // "https://coffeetec.com/collections/mill-city",
      // "https://coffeetec.com/collections/roasters-petroncini",
      // "https://coffeetec.com/collections/roasters-ambex",
      // "https://coffeetec.com/collections/featured-collection",
      // "https://coffeetec.com/collections/roasters-sonofresco",
      // "https://coffeetec.com/collections/roasters-sivetz",
      // "https://coffeetec.com/collections/nitrogen-generators",
      // "https://coffeetec.com/collections/roasters-sta",
      // "https://coffeetec.com/collections/air-roasters",
      // "https://coffeetec.com/collections/coffee-loaders-collection",
      // "https://coffeetec.com/collections/big-boy-roasters-20-kilo-plus",
      // "https://coffeetec.com/collections/just-sold",
      // "https://coffeetec.com/collections/complete-roastery-purchases",
      // "https://coffeetec.com/collections/mini-plants",
      // "https://coffeetec.com/collections/european-standards",
      // "https://coffeetec.com/collections/all-electric",
      // "https://coffeetec.com/collections/the-diedrich-ir-2-5-collection",
      // "https://coffeetec.com/collections/our-workhorses-6-18-kilo-roasters",
      // "https://coffeetec.com/collections/cacoa-bean-machines",
      // "https://coffeetec.com/collections/cold-brew-equipment",
      // "https://coffeetec.com/collections/plant-closing",
      // "https://coffeetec.com/collections/12-kilo-roasters",
      // "https://coffeetec.com/collections/ug-22s",
      // "https://coffeetec.com/collections/never-used",
      // "https://coffeetec.com/collections/roasters-lilla",
      // "https://coffeetec.com/collections/packagers",
      // "https://coffeetec.com/collections/dry-storage-bins-food-grade-made-in-usa",
      // "https://coffeetec.com/collections/roasters-coffee-tech",
      // "https://coffeetec.com/collections/roasters-samiac",
      // "https://coffeetec.com/collections/roasters-dongyi",
      // "https://coffeetec.com/collections/roasters-vittoria",
      // "https://coffeetec.com/collections/coffee-crafters",
      // "https://coffeetec.com/collections/toper-roasters",
    ];
    console.log("Collections", collections);
    const products = [];
    for (let i = 0; i < collections.length; i++) {
      const collectionUrl = collections[i];
      const productUrls = await getProductUrls(collectionUrl);
      products.push(...productUrls);
    }
    console.log("Products", products.length);
    const res = await WebURL.bulkCreate(
      [...new Set(products)].map((url) => ({ url })),
      {
        updateOnDuplicate: ["url"],
      }
    );
    console.log("done");
  } catch (error) {
    console.error("Error:", error);
  }
};
// getAllProducts();

function parsePrice(priceString) {
  if (typeof priceString !== "string") {
    return 0;
  }

  // 1) Remove any characters that are not digits, decimal points, or minus signs.
  //    This also strips out "$", "USD", commas, and any extra text/symbols.
  const numericString = priceString.replace(/[^0-9.-]/g, "");

  // 2) Convert the cleaned string to a float.
  const priceValue = parseFloat(numericString);

  return priceValue;
}

const routineScrapping = async () => {
  try {
    const urls = await WebURL.findAll({
      where: {
        isScrapped: false,
      },
      limit: 100,
      offset: 100,
      order: [["id", "ASC"]],
    });
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const { title, price, description } = await scrapeProduct(url.url);
      if (!title) throw new ApiError(-1, "Sorry");
      const res = await ProductData.create({
        url_id: url.id,
        title,
        price: parsePrice(price),
        description,
      });
      url.isScrapped = true;
      url.save();
      console.log(`Scrapped and saved product for ${url.id}`);
    }
    console.log("done");
  } catch (error) {
    console.error("Error:", error);
  }
};
// routineScrapping();
const storeEmbeddedProduct = async (product, chunkText, vectorString) => {
  try {
    const now = new Date().toISOString();
    const res = await db.query(
      `INSERT INTO "chunks" 
        (product_id, title, price, section, text, embedding, metadata, "createdAt", "updatedAt")
       VALUES 
        (:product_id, :title, :price, :section, :text, :embedding::vector, :metadata, :createdAt, :updatedAt)`,
      {
        replacements: {
          product_id: product.id,
          title: product.title, // or chunked title
          price: product.price,
          section: "GPT-4 Product Chunk", // or something else
          text: chunkText,
          embedding: vectorString,
          metadata: JSON.stringify({
            price: product.price,
            title: product.title,
            chunk_created_at: now,
          }),
          createdAt: now,
          updatedAt: now,
        },
        type: db.QueryTypes.INSERT,
      }
    );
    return res;
  } catch (err) {
    console.log(err);
  }
};
const routineEmbed = async () => {
  try {
    const productData = await ProductData.findAll({
      where: {
        isVectored: false,
      },
      limit: 100,
      order: [["id", "ASC"]],
    });
    productData.forEach(async (product) => {
      const chunk = await createChunkFromProduct(product);
      const vectorData = await embedChunk(chunk.chunkText);
      const res = await storeEmbeddedProduct(
        { ...chunk.chunkData, id: product.id, price: product.price },
        chunk.chunkText,
        vectorData,
        product.price
      );
      console.log("completed product embedding, ID: " + product.id);

      product.isVectored = true;
      product.save();
    });
    // for (let i = 0; i < productData.length; i++) {
    //   const product = productData[i];
    //   const chunk = await createChunkFromProduct(product);
    //   console.log(chunk);
    //   const vectorData = await embedChunk(chunk.chunkText);
    //   const res = await storeEmbeddedProduct(
    //     { ...chunk.chunkData, id: product.id },
    //     chunk.chunkText,
    //     vectorData
    //   );
    //   console.log(res);

    //   product.isVectored = true;
    //   product.save();
    // }
    console.log("done");
  } catch (err) {
    console.log(err);
  }
};
// routineEmbed();

const getCollections = async () => {
  try {
    let page = 1;
    const collections = [];
    let ok = true;
    while (ok) {
      const res = await fetch(
        process.env.PRODUCT_DOMAIN + "/collections" + ".json?page=" + page
      );
      console.log(res.ok, page);
      if (res.ok) {
        const data = await res.json();
        collections.push(...data?.collections);
        ok = data?.collections?.length;
        page++;
      }
    }
    console.log(collections[0]);
    const res = await Collection.bulkCreate(
      collections.map((collection) => {
        return {
          title: collection.title,
          description: collection.description,
          native_id: collection.id,
          url: process.env.PRODUCT_DOMAIN + "/collections/" + collection.handle,
          products_count: collection.products_count,
        };
      }),
      {
        updateOnDuplicate: ["products_count", "updatedAt"],
      }
    );
    console.log(res);
  } catch (err) {
    console.log(err);
  }
};
// getCollections();

const getProducts = async () => {
  try {
    let page = 1;
    const products = [];
    let ok = true;
    while (ok) {
      const res = await fetch(
        process.env.PRODUCT_DOMAIN +
          "/collections/all/products" +
          ".json?page=" +
          page
      );
      if (res.ok) {
        const data = await res.json();
        products.push(...data?.products);
        ok = data?.products?.length;
        page++;
      }
    }
    const res = await Product.bulkCreate(
      products.map((product) => {
        return {
          native_id: product.id,
          url:
            process.env.PRODUCT_DOMAIN +
            "/collections/all/products/" +
            product.handle,
          title: product.title,
          description: product.body_html,
          vendor: product.vendor,
          product_type: product.product_type,
          tags: product.tags,
          price: product.variants[0]?.price,
          image_url: product.images?.length ? product.images[0].src : "",
        };
      }),
      {
        updateOnDuplicate: ["price", "updatedAt", "image_url", "vendor"],
      }
    );
    console.log(res);
    console.log(products.length);
  } catch (err) {
    console.log(err);
  }
};
// getProducts();
const storeVectors = async (vectors) => {
  try {
    const now = new Date().toISOString();

    // 1) Build a VALUES array with placeholders for each row
    const values = [];
    const replacements = {};

    // 2) Loop over each vector object to build the SQL dynamically
    vectors.forEach((item, index) => {
      values.push(`(
        :product_id_${index},
        :title_${index},
        :text_${index},
        :embedding_${index}::vector,
        :createdAt_${index},
        :updatedAt_${index}
      )`);

      replacements[`product_id_${index}`] = item.product_id;
      replacements[`title_${index}`] = item.title;
      replacements[`text_${index}`] = item.text;
      replacements[`embedding_${index}`] = item.embedding; // string like '[0.12,0.89,...]'
      replacements[`createdAt_${index}`] = now;
      replacements[`updatedAt_${index}`] = now;
    });

    // 3) Build the final INSERT query using all placeholders
    const insertQuery = `
      INSERT INTO "vectors"
        (product_id, title, text, embedding, "createdAt", "updatedAt")
      VALUES
        ${values.join(", ")}
    `;

    // 4) Execute the query in a single batch
    const res = await db.query(insertQuery, {
      replacements,
      type: db.QueryTypes.INSERT,
    });
    return true;
  } catch (err) {
    console.error("❌ Error storing multiple vectors:", err);
    throw new ApiError(-1, err.message);
  }
};

const chunkData = async () => {
  try {
    const products = await Product.findAll({
      where: {
        isProcessed: false,
      },
      limit: 100,
      order: [["id", "ASC"]],
    });
    // console.log(data);
    products.forEach(async (product) => {
      const { metadata, chunks } = await chunkProduct(product.dataValues);
      const vectors = await embedChunks(chunks);
      const storeData = await storeVectors(
        vectors?.map((vector) => {
          return {
            ...vector,
            product_id: product.id,
          };
        })
      );
      if (storeData) {
        if (metadata) {
          product.is_new = metadata.is_new;
          product.per_day_capacity = metadata.per_day_capacity;
          product.per_hour_capacity = metadata.per_hour_capacity;
          product.per_batch_capacity = metadata.per_batch_capacity;
          product.clean_description = metadata.clean_description;
          product.isProcessed = true;
        }
        product.isProcessed = true;
        product.save();
        console.log("Completed product processing, ID: " + product.id);
      }
    });
  } catch (err) {
    console.log(err);
    throw new ApiError(-1, err.message);
  }
};
// chunkData();
