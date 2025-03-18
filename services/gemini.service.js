const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const ApiError = require("../utils/ApiError");

// const OpenAI = require("openai");
// const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const sequelize = require("sequelize");
const db = require("../config/sequelize.config");
const { AIChat, Conversation, SearchProduct } = require("../models");
const EMBEDDING_MODEL = "text-embedding-ada-002";
const GEMINI_MODEL = "gemini-1.5-flash";
const getModel = (systemPrompt, isJSON) => {
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
    generationConfig: isJSON
      ? {
          responseMimeType: "application/json",
        }
      : undefined,
  });
  return model;
};
const askModel = async (systemPrompt, userPrompt, isJSON = true) => {
  try {
    const model = getModel(systemPrompt, isJSON);
    const chatResponse = await model.generateContent(userPrompt);
    if (!isJSON) return chatResponse.response.text();

    const responseContent =
      chatResponse.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    return responseContent ? JSON.parse(responseContent) : null;
  } catch (err) {
    console.log("Error in askModel:", err);
    throw new ApiError(`Failed to get model: ${err.message}`);
  }
};
const refineQueries = async (userQuery, prev) => {
  try {
    // function 1
    const systemPrompt = `
  You are a helpful sales agent and query builder that rewrites user queries to be more relevant for semantic product search and also search in database + answer general questions from user like an LLM. Your name is Remon-AI.
  Your task is:
  0. User might ask about general questions or some questions in the context of previous chat history, then return only falseQuery. Go for whereQuery or userQuery only if user wanted to search some products or intended to buy.
  1. Refine the user’s query for semantic search (clean grammar/spelling, but preserve intent, expand any abbreviations if it helps clarity, keep the main intent of the user’s question, Do NOT add random new information that changes the meaning.).
  2. Determine if the user wants to filter by columns in the "products" table (title, vendor, per_batch_capacity, per_hour_capacity, per_day_capacity, is_new or price).
  3. If a filter is required, produce a partial SQL WHERE clause referencing:
     - LOWER(p.title) using LIKE if the user references "name" or "title". You can use OR operator for multiple title filter, not AND.
     - LOWER(p.vendor) using LIKE if the user references "manufacturer" or "vendor" or similar
     - p.price with <, >, or = if the user references a numeric condition related to pricing. The price must be greater than 0 if pricing is mentioned always.
     - p.is_new with true or false if the user mentions "new" or "used" or similar
     - p.per_batch_capacity, p.per_hour_capacity, or p.per_day_capacity can be included depending on user's requirements. Convert that to kg always (float). But do not strictly check the number. Rather soft search it. Maybe with a range. This should be a soft requirements. If not found, I want to give the user's the possible options.
  4. Return a JSON with two keys: 
     - "userQuery": the refined text for vector embedding for semantic search
     - "whereQuery": a partial SQL snippet if a filter is necessary, otherwise null
  5. Strictly reference the columns as p.columnName.
  6. Do not invent columns or data not described above.
  7. If you generate sql query, then remove those information from userQuery.
  8. If user didn't asked about the coffee products and asked something else, then return only one key 'falseQuery'. Nothing else. This will include a message for user where you will politely answer the query and then recommend about searching coffee-related products. You can also include some fun-fact. Include markdown formatting. User can say hi/hello or similar unrelated things. 
  9. You will be provided the previous chat history of the user. Take your decision depending on those where applicable.
  10. In the histories you can see the messages has two parts: one is taskType, another one in message. This message contains the actual user prompts or model replies.
    And the TaskType contains refineQuery or salesAgent. 
    'refineQuery' means you. You as an agent refines the user's query. The prompts to you or your answers are labels as refineQuery.
    'salesAgent' means another AI Agent. Who is responsible for post process the searched data and makes recommendations and tips. The prompts to that agent or agent's answers are labels as salesAgent.
`;

    // 2) User prompt: Provide raw user query & desired output format
    const userPrompt = `
  Below is the user’s raw prompt:
  "${userQuery}"
  
  **You will be provided the previous chat history of the user. Take your decision depending on those where applicable. User might ask something about the previous discussions or you might need some context from the user's previous talks.
  User can ask general questions or search for coffee-related products. If user is not searching for a product and asking about other things, return only falseQuery.
  If referencing product name => use LOWER(title) LIKE '%...%'
  If referencing vendor => use LOWER(vendor) LIKE '%...%'
  If referencing numeric pricing condition => price with <, >, or =
  If no filters matches, "whereQuery" should be null.
  Strictly reference the columns as p.columnName. Return without the where keyword.
   Please return a JSON object with:
    {
      "userQuery": "...",       // cleaned query for semantic embedding
      "whereQuery": "..."       // if you detect any filter (title/vendor/price), otherwise null. this must not include the where keyword
      "falseQuery": "..."       // If user asked anything unrelated to product searching, otherwise null
    }
  **Do not include userQuery or whereQuery if user is not searching about products. Use only falseQuery in such cases**
`;

    // const refinedQuery = await askModel(systemPrompt, userPrompt);
    const history = prev?.map((msg) => {
      return {
        role: msg.role,
        parts: [
          {
            text:
              "TaskType-" +
              msg.task +
              ". Message: " +
              JSON.stringify(msg.parts[0].text),
          },
        ],
      };
    });
    const model = getModel(systemPrompt, true);
    const chatResponse = await model.generateContent({
      contents: [
        ...history,
        {
          role: "user",
          parts: [
            {
              text: userPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        // maxOutputTokens: 1000,
        responseMimeType: "application/json",
      },
    });
    const responseContent =
      chatResponse.response.candidates?.[0].content.parts?.[0].text;
    const refinedQuery = JSON.parse(responseContent);
    const save = await addConversation([
      { task: "refineQuery", role: "user", text: userQuery },
      { task: "refineQuery", role: "model", text: refinedQuery },
    ]);
    return {
      refinedQuery,
      updatedHistory: [
        ...history,
        ...save?.map((msg) => {
          return {
            role: msg.role,
            parts: [
              {
                text:
                  "TaskType-" +
                  msg.task +
                  ". Message: " +
                  JSON.stringify(msg.parts[0].text),
              },
            ],
          };
        }),
      ],
    };
  } catch (err) {
    console.error("Error refining queries:", err);
    throw new Error(err.message);
  }
};
const getConversations = async () => {
  try {
    const res = await Conversation.findAll({
      order: [["id", "ASC"]],
      attributes: ["role", "parts", "task"],
      raw: true,
    });
    return res;
  } catch (err) {
    console.error("Error getting conversation:", err);
    throw new ApiError(err.message);
  }
};
// getConversations();
const addConversation = async (tasks) => {
  try {
    const bulkData = tasks?.map((task) => {
      return {
        task: task.task,
        role: task.role,
        parts: [{ text: task.text }],
        search_products_id: task.search_products_id,
      };
    });
    const res = await Conversation.bulkCreate(bulkData);
    return bulkData;
  } catch (err) {
    console.error("Error getting conversation:", err);
    throw new ApiError(err.message);
  }
};
// addConversation("refineQuery", "model", "I am fine");
const createSalesRecommendation = async (
  userQuery,
  products,
  history,
  savedProductsId
) => {
  // function 2
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
  const systemPrompt = `
  You are a helpful sales agent. Your name is Remon-AI. The user has made a query about coffee-related machines or products.
  You have a list of potential matching products from our database which was retrieved using some sql and vector search. 
  You will analyze the user's query in detail. 
  Then provide:
  1) A short, friendly recommendation or summary of how these products might solve the user's needs. 
  2) Short tips on how to use or benefit from them.
  3) If you believe the products truly match, reassure the user we have them covered.
  4) If no products match or more info is needed, politely suggest clarifications or next steps.
  5) Do not invent products or details not included in the data. 
  6) You will be provided the previous chat history of the user. Take your decision depending on those where applicable.
  7) In the histories you can see the messages has two parts: one is taskType, another one in message. This message contains the actual user prompts or model replies.
    And the TaskType contains refineQuery or salesAgent. 
    'refineQuery' means another AI Agent. That agent refines the user's query. The prompts to that agent or it's answers are labels as refineQuery.
    'salesAgent' means you. Who is responsible for post process the searched data and makes recommendations and tips. The prompts to you and your answers are labels as salesAgent.
  
  You can add some fun-fact at the end sometimes. Include markdown formatting. Keep your answers short.
  `;

  // 4) Prepare the user message (their query plus the found products data)
  const userPrompt = `
  **You will be provided the previous chat history of the user. Take your decision depending on those where applicable. You might need some context from the user's previous talks.
  User Query: "${userQuery}"
  
  Found Products:
  ${productListText}

  Keep your answers short. Include markdown formatting, no other TaskType or anything should be included. so that I can serve directly to the customer.
  `;
  const model = getModel(systemPrompt, false);
  const chatResponse = await model.generateContent({
    contents: [
      ...history,
      {
        role: "user",
        parts: [
          {
            text: userPrompt,
          },
        ],
      },
    ],
  });
  const aiReply = chatResponse.response.text();
  const save = await addConversation([
    // { task: "salesAgent", role: "user", text: userQuery },
    {
      task: "salesAgent",
      role: "model",
      text: aiReply,
      search_products_id: savedProductsId,
    },
  ]);
  return aiReply;
};
const queryProducts = async (q) => {
  try {
    // function 0
    if (!q || q?.length > 200) throw new ApiError(-1, "Invalid search query");
    const prev = await getConversations();
    const { refinedQuery, updatedHistory } = await refineQueries(q, prev);
    const { userQuery, whereQuery, falseQuery } = refinedQuery;
    if (falseQuery) return { falseQuery };
    const userEmbeddingResp = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: userQuery,
    });
    // const model = genAI.getGenerativeModel({
    //   model: "text-embedding-004",
    // });
    // const result = await model.embedContent(userQuery);
    // userEmbedding = result.embedding.values;
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
          ${whereQuery ? "where " + whereQuery : ""}
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

    const savedProducts = await SearchProduct.create({
      products: results,
    });

    // here we have our products searched from user's query
    const tips = await createSalesRecommendation(
      q,
      results,
      updatedHistory,
      savedProducts.id
    );
    return { results, tips };
  } catch (err) {
    console.log(err);
    throw new ApiError(-1, err.message);
  }
};

const saveChat = async (chat) => {
  try {
    const res = await AIChat.create({ chat });
    return res;
  } catch (err) {
    throw new ApiError(-1, err.message);
  }
};

const generateCard = async (data) => {
  console.log(data);
  // function 2
  let dataList;
  if (!data || data.length === 0) {
    productListText = "No data found in the database search.";
  } else {
    productListText = data
      .map((p, idx) => {
        // We'll keep this summary short. Tweak as needed.
        return `Notification #${p.id}:
    packageName: ${p.packageName}
    text: ${p.text}
    timestamp: ${p.timestamp}
    title: ${p.title}`;
      })
      .join("\n\n");
  }

  // 3) Prepare the system message (defines the AI’s role and instructions)
  const systemPrompt = `
  You are a helpful personal assistant named Zarrin. Your primary job is to read notifications from user's android phone and summarize them so that user can aware of all notifications. Also create alerts about important matters. Make tasks depending on the notifications. Create the important tasks as I can sync those with google calender (times should be for Bangladesh) and give me the ics file like - 
  ***
  BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART;TZID=UTC:20240401T170000Z
DTEND;TZID=UTC:20240401T180000Z
SUMMARY:Go to market
END:VEVENT
END:VCALENDAR
***
  The summary should be within 50 characters. Your response format is - {summary: string, alerts: array of strings, tasks: array of strings, calender_events: array of ics}
  `;

  // 4) Prepare the user message (their query plus the found products data)
  const userPrompt = `
  **You will be provided the notifications history of the user. Summarize and make alerts on that. 
  Notifications:
  ${productListText}
  `;
  const model = getModel(systemPrompt, true);
  const chatResponse = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: userPrompt,
          },
        ],
      },
    ],
  });
  const responseContent =
    chatResponse.response.candidates?.[0].content.parts?.[0].text;
  const refinedData = JSON.parse(responseContent);
  console.log(refinedData);
  return refinedData;
};

module.exports = { generateCard };
