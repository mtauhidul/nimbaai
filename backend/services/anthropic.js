// backend/services/anthropic.js - Updated with token tracking
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

    // Extract token usage from Anthropic response
    const tokenUsage = {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens,
    };

    console.log(`🔢 Anthropic Token Usage:`, tokenUsage);

    // Return both response and token usage
    return {
      content: response.content[0].text,
      tokenUsage,
    };
  } catch (error) {
    console.error("Anthropic API Error:", error);
    throw new Error("Failed to generate response");
  }
};

module.exports = {
  anthropic,
  generateResponse,
};
