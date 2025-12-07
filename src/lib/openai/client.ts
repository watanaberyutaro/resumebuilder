import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;

// Model configuration
export const AI_MODEL = 'gpt-4o-mini';

// Cost calculation (approximate, as of 2024)
export const COST_PER_1K_INPUT_TOKENS = 0.15 / 1000; // $0.15/1M tokens -> per 1K
export const COST_PER_1K_OUTPUT_TOKENS = 0.6 / 1000; // $0.60/1M tokens -> per 1K
export const USD_TO_JPY = 150; // Approximate exchange rate

export function calculateCostJPY(inputTokens: number, outputTokens: number): number {
  const inputCostUSD = (inputTokens / 1000) * COST_PER_1K_INPUT_TOKENS;
  const outputCostUSD = (outputTokens / 1000) * COST_PER_1K_OUTPUT_TOKENS;
  return (inputCostUSD + outputCostUSD) * USD_TO_JPY;
}
