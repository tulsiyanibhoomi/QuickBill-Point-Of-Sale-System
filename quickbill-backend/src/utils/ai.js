/**
 * Utility to interact with local Ollama LLM
 */

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3";

const generateDescription = async (type, name) => {
  console.log("HII" + OLLAMA_URL);
  try {
    const prompt =
      type === "product"
        ? `You are an expert copywriter for a retail stationery and electronics store. Write a short, catchy, and professional product description (max 2 sentences) for a product named "${name}". Return ONLY the description text, no extra conversational text.`
        : `You are an expert copywriter for a retail store. Write a short, professional description (max 1 sentence) for a product category named "${name}". Return ONLY the description text.`;

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.warn(`Ollama API responded with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.response
      ? data.response.trim().replace(/^["']|["']$/g, "")
      : null;
  } catch (error) {
    console.error("Failed to generate description from Ollama:", error.message);
    return null; // Fail gracefully so creation can still proceed
  }
};

module.exports = {
  generateDescription,
};
