const OpenAI = require("openai");
const Chunk = require("./models/Chunk");
const db = require("./config/sequelize.config");
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const sequelize = require("sequelize");
async function storeEmbedding(text) {
  // Generate embedding
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });

    // ✅ Ensure the response contains an embedding array
    if (
      !response.data ||
      !response.data[0] ||
      !Array.isArray(response.data[0].embedding)
    ) {
      throw new Error("Invalid embedding response format!");
    }

    const vector = response.data[0].embedding; // ✅ Extract vector
    const vectorString = `[${vector.join(",")}]`; // ✅ Convert to PostgreSQL vector format

    // console.log("Vector (Formatted for Postgres):", vectorString); // Debugging
    const now = new Date().toISOString(); // ✅ Current timestamp for `createdAt`
    // ✅ Store in DB using Raw Query
    await db.query(
      `INSERT INTO "chunks" ( title, section, text, embedding, metadata, "createdAt", "updatedAt") 
         VALUES ( :title, :section, :text, :embedding::vector, :metadata, :createdAt, :updatedAt)`,
      {
        replacements: {
          title: "Breaking Changes",
          section: "API References",
          text: text,
          embedding: vectorString, // ✅ Properly formatted vector
          metadata: JSON.stringify({ created_at: now }),
          createdAt: now, // ✅ Fix: Provide a timestamp for `createdAt`
          updatedAt: now, // ✅ Fix: Provide a timestamp for `updatedAt`
        },
        type: db.QueryTypes.INSERT,
      }
    );

    console.log("✅ Embedding stored successfully");
  } catch (err) {
    console.log(err);
  }
}

// Example usage
// storeEmbedding("Sumon works in Monday Digital as software engineer");
// storeEmbedding("Sumon is an AI enthusiast and loves to read books about AI");
// storeEmbedding("Sumon loves caffeine");

async function searchEmbeddings(query) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });

    const queryEmbedding = response.data[0].embedding;

    const { Op } = require("sequelize");

    const result = await db.query(
      `SELECT *, embedding <=> :query_embedding::vector AS distance 
         FROM "chunks"
         ORDER BY distance ASC
         LIMIT 5;`,
      {
        replacements: { query_embedding: `[${queryEmbedding.join(",")}]` }, // ✅ Ensure vector format
        type: db.QueryTypes.SELECT,
      }
    );

    console.log(
      "🔍 Search Results:",
      result?.map((r) => r.text)
    );
  } catch (err) {
    console.log(err);
  }
}

// Example Search
// searchEmbeddings("Sunday");
