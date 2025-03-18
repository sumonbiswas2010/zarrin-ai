// const OpenAI = require("openai");
const { Chunk } = require("../models");
// const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const sequelize = require("sequelize");
// const { Configuration, OpenAIApi } = require("openai");
const db = require("../config/sequelize.config");
const ApiError = require("../utils/ApiError");
async function createChunkFromProduct(product) {
  try {
    const prompt = `
    You are provided with product data: 
    Title: ${product.title}
    Price: ${product.price}
    Description: ${product.description}

    1) Summarize the product in 1-2 sentences.
    2) Provide a short bullet list of key features if relevant.
    3) Include the price if it seems essential.
    
    Format the result as JSON with fields:
    {
      "title": "...",
      "price": "...",
      "summary": "...",
      "features": ["...", "..."]
    }
    I will embed the data and later my user will semantic search for it.
  `;

    const gptResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that reformats product data for semantic search.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });
    const gptContent = gptResponse.choices[0].message.content;
    // Attempt to parse JSON from GPT output
    const chunkData = JSON.parse(gptContent);
    // Create a "chunk" string that you want to embed
    // e.g. combine the relevant fields. This is your text for vector embedding.
    const chunkText = `
    Title: ${chunkData.title}
    Price: ${chunkData.price}
    Summary: ${chunkData.summary}
    Features: ${chunkData.features.join(", ")}
  `.trim();

    return { chunkData, chunkText };
  } catch (err) {
    console.log(err);
  }
}

const { v4: uuidv4 } = require("uuid");

async function embedChunk(chunkText) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: chunkText,
    });

    const embeddingArray = response.data[0].embedding;

    // 2) Format for pgvector
    const vectorString = `[${embeddingArray.join(",")}]`;

    console.log("✅ chunked");
    return vectorString;
  } catch (err) {
    console.log(err);
  }
}

async function refineUserQuery(userQuery) {
  // Use your existing OpenAI setup

  // Construct a system prompt describing GPT’s role
  // and a user prompt that includes the raw query.
  const systemPrompt = `
    You are a helpful assistant that rewrites user queries 
    to be more relevant for semantic product search.
    
    - Clean up or clarify grammar and spelling.
    - Expand any abbreviations if it helps clarity.
    - Keep the main intent of the user’s question.
    - Do NOT add random new information that changes the meaning.
  `;

  const userPrompt = `
    Please rewrite the following user query for a product database search. Also include a sql subquery if any price is mentioned.
    The query should not contain everything. Rather return me only the part which will be used in the where including the where keyword. Only available column is price. the price should be written as c.price.
    Return me a json with two keys - userQuery & whereQuery (if applicable):
    "${userQuery}"
  `;

  // Call ChatGPT (gpt-3.5-turbo or gpt-4)
  const chatResponse = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    // temperature: 0.5, // You can adjust temperature to control creativity
    // max_tokens: 100,  // Should be enough to rewrite a short query
  });

  // Extract GPT’s answer
  const refinedQuery = JSON.parse(chatResponse.choices[0].message.content);
  // Return the refined query
  return refinedQuery;
}
// refineUserQuery(
//   "I want to products of 10kg. the price should be less than 100dollar"
// );

const searchProducts = async (q) => {
  try {
    if (!q || q?.length > 100) throw new ApiError(-1, "Invalid search query");
    // 1) Get user query, e.g.:
    // const q = "new. 5 kg per batch, price under 5000";
    const { userQuery, whereQuery } = await refineUserQuery(q);
    console.log(userQuery);
    const userEmbeddingResp = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: userQuery,
    });
    const userEmbedding = userEmbeddingResp.data[0].embedding;
    const userVectorString = `[${userEmbedding.join(",")}]`;

    // 2) Query Chunks table by vector similarity, e.g.:
    const query = `
  SELECT 
    c.id,
    c.title,
    c.text,
    c.price,
    c.embedding <-> :userVector AS distance,
    w.url
  FROM "chunks" c
  JOIN "product_data" p 
    ON c.product_id = p.id
  JOIN "web_urls" w 
    ON p.url_id = w.id
  ${whereQuery ? whereQuery : ""}
  ORDER BY distance ASC
  LIMIT 5;
  `;
    const results = await db.query(query, {
      replacements: {
        userVector: userVectorString,
      },
      type: db.QueryTypes.SELECT,
    });
    return results;
  } catch (err) {
    console.log(err);
  }
};
// searchProducts();

const chunkProduct = async (productData) => {
  try {
    const systemPrompt = `
  You are a product data processor. Given raw product information, extract and return meaningful chunks optimized for vector embeddings. Also return some metadata about the product depending on the rules.

  **Rules:**
    - Break the long description into **smaller** meaningful chunks, ensuring **each chunk is a json and self-contained**.
    - Each chunk should contain logically connected sentences.
    - Each chunk should have a title and text, preserving logical meaning.
    - Maintain clean formatting, and make sure the information is readable and structured.
    - Regarding product metadata object, I only want clean_description, per_day_capacity (kg in integer), per_hour_capacity (kg in integer), per_batch_capacity (kg in integer) and is_new (boolean). If the product is a machine and has information about those then analyze about those. Do not return any null information.
    - If there is any mention about the product is used beforehand, is_new will be false. Otherwise, is_new will be true always. is_new should be with metadata every time.
    - As I am giving you the description with html structures, you must return me the clean_description to store into my db and later serve to user. This should be with metadata every time.
    - If there is any mention about how much coffee it can process per day/hour/batch, then only return the per_day_capacity & per_hour_capacity both or none and additionally per_batch_capacity. per_day_capacity & per_hour_capacity should be together. This should be converted into kg of course. If you get information about per hour or per day then calculate both.
    - **Output should be an Object with key "metadata" and "chunks". If there is no metadata do not return metadata.
    - **metadata will be an JSON** in this format: {per_day_capacity: 24, per_hour_capacity: 1, is_new: false}
    - **chunks will be an array of JSON** in this format:
    
    [
      { "title": "Overview", "text": "Summary of the product..." },
      { "title": "Overview", "text": "More details on the product's purpose..." },
      { "title": "Technical Specifications", "text": "Capacity: 90 lbs/hour" },
      { "title": "Technical Specifications", "text": "Fuel Type: Natural Gas" },
    ]
`;

    const userMessage = `Please return structured metadata and chunks as per the given format. Here is the product data in JSON format:
    ${JSON.stringify(productData)}
`;
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
    });
    const extractedChunks = JSON.parse(response.choices[0].message.content);
    // Ensure response is an array
    if (!extractedChunks?.chunks || !Array.isArray(extractedChunks?.chunks)) {
      throw new ApiError(-1, "Invalid format: Expected an array of objects.");
    }

    return extractedChunks; // This is the structured, meaningful chunks
  } catch (err) {
    console.log(err);
    throw new ApiError(-1, err.message);
  }
};
const embedChunks = async (chunks) => {
  try {
    // 1) Map each chunk to an embedding request
    const embeddedChunks = await Promise.all(
      chunks.map(async (chunk) => {
        const chunkText = `${chunk.title}\n${chunk.text}`;

        // 2) Generate an embedding for this chunk's text
        const response = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: chunkText,
        });

        // 3) Format the embedding as a pgvector string
        const embeddingArray = response.data[0].embedding;
        const vectorString = `[${embeddingArray.join(",")}]`;

        // 4) Return the updated chunk with a new 'vector' field
        return {
          ...chunk,
          embedding: vectorString,
        };
      })
    );
    // console.log(embeddedChunks);
    // 5) Return the updated array of chunks, each with its 'vector' field
    return embeddedChunks;
  } catch (err) {
    console.error("❌ Error embedding chunks:", err);
    throw new ApiError(-1, err.message);
  }
};

const createSalesRecommendation = async (userQuery, products) => {
  // 2) Convert your products array into a short text summary for the AI
  //    For example, we’ll pass each product with title, price, snippet from text, and URL
  let productListText;
  if (!products || products.length === 0) {
    productListText = "No products found in the database search.";
  } else {
    productListText = products
      .map((p, idx) => {
        // We'll keep this summary short. Tweak as needed.
        return `Product #${idx + 1}:
  Title: ${p.title}
  Price: ${p.price}
  Link: ${p.url}
  Context Snippet: ${p.text?.slice(0, 200) || "N/A"}...
  Distance (from embedding vectors): ${p.distance}`;
      })
      .join("\n\n");
  }

  // 3) Prepare the system message (defines the AI’s role and instructions)
  const systemMessage = `
You are a helpful sales agent. Your name is Remon-AI. The user has made a query about coffee-related machines or products.
You have a list of potential matching products from our database which was retrieved using some sql and vector search. 
You will analyze the user's query in detail. 
Then provide:
1) A short, friendly recommendation or summary of how these products might solve the user's needs. 
2) Short tips on how to use or benefit from them.
3) If you believe the products truly match, reassure the user we have them covered.
4) If no products match or more info is needed, politely suggest clarifications or next steps.
5) Do not invent products or details not included in the data. 

You can add some fun-fact at the end. Include markdown formatting. 
`;

  // 4) Prepare the user message (their query plus the found products data)
  const userContent = `
User Query: "${userQuery}"

Found Products:
${productListText}
`;

  // 5) Send a ChatCompletion request
  const chatResponse = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: userContent },
    ],
    temperature: 0.7,
  });

  // 6) Extract the AI's text
  const aiReply = chatResponse.choices[0].message.content.trim();
  console.log(aiReply);
  return aiReply;
};

const refineQueries = async (userQuery) => {
  try {
    const systemPrompt = `
  You are a helpful assistant that rewrites user queries to be more relevant for semantic product search and also search in database. Your name is Remon-AI.
  Your task is:
  1. Refine the user’s query for semantic search (clean grammar/spelling, but preserve intent, expand any abbreviations if it helps clarity, keep the main intent of the user’s question, Do NOT add random new information that changes the meaning.).
  2. Determine if the user wants to filter by columns in the "products" table (title, vendor, per_batch_capacity, per_hour_capacity, per_day_capacity, is_new or price).
  3. If a filter is required, produce a partial SQL WHERE clause referencing:
     - LOWER(p.title) using LIKE if the user references "name" or "title" or similar mentioned in the query.
     - LOWER(p.vendor) using LIKE if the user references "manufacturer" or "vendor" or similar
     - p.price with <, >, or = if the user references a numeric condition related to pricing. The price must be greater than 0 if pricing is mentioned always.
     - p.is_new with true or false if the user mentions "new" or "used" or similar
     - p.per_batch_capacity, p.per_hour_capacity, or p.per_day_capacity can be included depending on user's requirements. Convert that to kg always. But do not strictly check the number. Rather soft search it. Maybe with a range. This should be a soft requirements. If not found, I want to give the user's the possible options.
  4. Return a JSON with two keys: 
     - "userQuery": the refined text for vector embedding for semantic search
     - "whereQuery": a partial SQL snippet if a filter is necessary, otherwise null
  5. Strictly reference the columns as p.columnName.
  6. Do not invent columns or data not described above.
  7. If you generate sql query, then remove those information from userQuery.
  8. If user didn't asked about the coffee products and asked something else, then return only one key 'falseQuery'. Nothing else. This will include a message for user where you will politely answer the query and then recommend about searching coffee-related products. You can also include some fun-fact. Include markdown formatting. 
`;

    // 2) User prompt: Provide raw user query & desired output format
    const userPrompt = `
  Below is the user’s raw query:
  "${userQuery}"

  Please return a JSON object with:
    {
      "userQuery": "...",       // cleaned query for semantic embedding
      "whereQuery": "..."       // if you detect any filter (title/vendor/price), otherwise null
    }

  If referencing product name => use LOWER(title) LIKE '%...%'
  If referencing vendor => use LOWER(vendor) LIKE '%...%'
  If referencing numeric pricing condition => price with <, >, or =
  If no filters matches, "whereQuery" should be null.
  Strictly reference the columns as p.columnName. Return with the where keyword.
`;
    const chatResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });
    const refinedQuery = JSON.parse(chatResponse.choices[0].message.content);
    console.log(refinedQuery);
    return refinedQuery;
  } catch (err) {
    console.error("�� Error refining queries:", err);
    throw new ApiError(-1, err.message);
  }
};
// refineQueries("Who are you?");
const queryProducts = async (q) => {
  try {
    if (!q || q?.length > 200) throw new ApiError(-1, "Invalid search query");
    const { userQuery, whereQuery, falseQuery } = await refineQueries(q);
    if (falseQuery) return { falseQuery };
    const userEmbeddingResp = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: userQuery,
    });
    const userEmbedding = userEmbeddingResp.data[0].embedding;
    const userVectorString = `[${userEmbedding.join(",")}]`;

    // 2) Query Chunks table by vector similarity, e.g.:
    const sql = `
      WITH ranked AS (
        SELECT
          p.id AS product_id,
          p.title,
          p.price,
          p.image_url,
          p.url,
          c.text,  -- The chunk text
          (c.embedding <-> :userVector::vector) AS distance,
          ROW_NUMBER() OVER (
            PARTITION BY p.id
            ORDER BY (c.embedding <-> :userVector::vector) ASC
          ) AS rn
        FROM "vectors" c
        JOIN "products" p ON c.product_id = p.id
        ${whereQuery ? whereQuery : ""}
      )
      SELECT product_id, title, price, image_url, url, text, distance
      FROM ranked
      WHERE rn = 1               -- Only the top (best match) chunk per product
      ORDER BY distance ASC, price DESC
      LIMIT 5;
    `;

    const results = await db.query(sql, {
      replacements: {
        userVector: userVectorString, // The properly formatted vector, e.g. '[0.12, 0.56, ...]'
      },
      type: db.QueryTypes.SELECT,
    });
    console.log(results);
    const tips = await createSalesRecommendation(q, results);
    return { results, tips };
  } catch (err) {
    console.log(err);
  }
};
// queryProducts('I want the roaster machine for indostrial usage. Price under 2000');
module.exports = {
  createChunkFromProduct,
  embedChunk,
  searchProducts,
  refineUserQuery,
  chunkProduct,
  embedChunks,
  queryProducts,
};
