// backend/services/anthropic.js
const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const generateResponse = async (
  messages,
  model = "claude-3-sonnet-20240229"
) => {
  try {
    // Convert OpenAI format to Anthropic format
    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");

    const response = await anthropic.messages.create({
      model,
      max_tokens: 1000,
      system: systemMessage?.content || "You are a helpful assistant.",
      messages: userMessages,
    });

    return response.content[0].text;
  } catch (error) {
    console.error("Anthropic API Error:", error);
    throw new Error("Failed to generate response");
  }
};

module.exports = {
  anthropic,
  generateResponse,
};
