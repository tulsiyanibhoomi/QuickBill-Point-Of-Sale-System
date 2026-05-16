// /**
//  * Utility to interact with local Ollama LLM
//  */

// const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
// const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3";

// const generateDescription = async (type, name) => {
//   console.log("HII" + OLLAMA_URL);
//   try {
//     const prompt =
//       type === "product"
//         ? `You are an expert copywriter for a retail stationery and electronics store. Write a short, catchy, and professional product description (max 1 sentences) for a product named "${name}". Return ONLY the description text, no extra conversational text.`
//         : `You are an expert copywriter for a retail store. Write a short, professional description (max 1 sentence) for a product category named "${name}". Return ONLY the description text.`;

//     const response = await fetch(`${OLLAMA_URL}/api/generate`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         model: OLLAMA_MODEL,
//         prompt,
//         stream: false,
//       }),
//     });

//     if (!response.ok) {
//       console.warn(`Ollama API responded with status: ${response.status}`);
//       return null;
//     }

//     const data = await response.json();
//     return data.response
//       ? data.response.trim().replace(/^["']|["']$/g, "")
//       : null;
//   } catch (error) {
//     console.error("Failed to generate description from Ollama:", error.message);
//     return null; // Fail gracefully so creation can still proceed
//   }
// };

// module.exports = {
//   generateDescription,
// };

const OpenAI = require("openai");

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000", // required by OpenRouter sometimes
    "X-Title": "MyApp",
  },
});

const generateDescription = async (type, name) => {
  try {
    const prompt =
      type === "product"
        ? `Write a 1-sentence product description for "${name}".`
        : `Write a 1-sentence category description for "${name}".`;

    const response = await openrouter.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("Failed to generate description:", error.message);
    return null;
  }
};

const generateDashboardInsights = async (data) => {
  try {
    const prompt = `You are an expert retail business analyst. Analyze this daily summary data for a store and provide a concise, actionable 2-3 sentence insight. Do not use markdown. Keep it conversational but professional. Focus on total revenue, orders, top products, and alert about any specific low stock items if they exist. Data: ${JSON.stringify(data)}`;

    const response = await openrouter.chat.completions.create({
      model: "openai/gpt-oss-20b:free",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return (
      response.choices?.[0]?.message?.content?.trim() ||
      "Insights are currently unavailable."
    );
  } catch (error) {
    console.error("Failed to generate insights:", error.message);
    return "Insights could not be generated at this time.";
  }
};

const suggestPrice = async (name, costPrice) => {
  try {
    const prompt = `You are a retail pricing expert. Suggest a competitive retail selling price for a product named "${name}" with a cost price of ${costPrice ? "₹" + costPrice : "unknown"}. Return ONLY the suggested numeric value (e.g. 199.00), no other text.`;
    const response = await openrouter.chat.completions.create({
      model: "openai/gpt-oss-20b:free",
      messages: [{ role: "user", content: prompt }],
    });
    const content = response.choices?.[0]?.message?.content?.trim();
    const match = content.match(/[\d.]+/);
    return match ? match[0] : null;
  } catch (error) {
    console.error("Failed to suggest price:", error.message);
    return null;
  }
};

const generateRestockEmail = async (products) => {
  try {
    const prompt = `Write a professional, concise email draft to a supplier requesting a restock for the following low-stock items:\n${products.map((p) => `- ${p.name} (Current stock: ${p.quantity_in_stock}, Min required: ${p.min_stock_level})`).join("\n")}\nKeep it polite, short, and ready to send.`;
    const response = await openrouter.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices?.[0]?.message?.content?.trim();
  } catch (error) {
    console.error("Failed to generate restock email:", error.message);
    return null;
  }
};

const generatePromoSMS = async (invoiceData) => {
  try {
    const itemsList = invoiceData.items.map((i) => i.product_name).join(", ");
    const prompt = `Write a short, engaging promotional SMS/WhatsApp message thanking the customer (${invoiceData.customer.name}) for their recent purchase of ${itemsList} at ${invoiceData.store.name}, and give them a brief reason to return (like "Show this text for 5% off your next visit!"). Keep it fun but professional.`;
    const response = await openrouter.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices?.[0]?.message?.content?.trim();
  } catch (error) {
    console.error("Failed to generate SMS:", error.message);
    return null;
  }
};

module.exports = {
  generateDescription,
  generateDashboardInsights,
  suggestPrice,
  generateRestockEmail,
  generatePromoSMS,
};
