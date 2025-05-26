// backend/services/openai.js - Updated with token tracking
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateResponse = async (messages, model = "gpt-3.5-turbo") => {
  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Extract token usage from OpenAI response
    const tokenUsage = {
      input_tokens: completion.usage.prompt_tokens,
      output_tokens: completion.usage.completion_tokens,
      total_tokens: completion.usage.total_tokens,
    };

    console.log(`🔢 OpenAI Token Usage:`, tokenUsage);

    // Return both response and token usage
    return {
      content: completion.choices[0].message.content,
      tokenUsage,
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("Failed to generate response");
  }
};

module.exports = {
  openai,
  generateResponse,
};
