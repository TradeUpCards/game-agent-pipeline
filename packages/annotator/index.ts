import fs from "fs";
import path from "path";
import { config } from "dotenv";
import OpenAI from "openai";
import { encoding_for_model } from "@dqbd/tiktoken";

// Load .env
config();

// CLI args
const game = process.argv[2] || "diablo";
const inputPath = process.argv[3];
const isDryRun = process.argv.includes("--dry-run");
const modelFlag = process.argv.find(arg => arg.startsWith("--model="));
const model = modelFlag?.split("=")[1] || "gpt-4o";

const tiers = ["beginner", "intermediate", "expert"];

// Validate file path
if (!inputPath || !fs.existsSync(inputPath)) {
  console.error("❌ Must provide valid path to JSON file");
  console.error("Usage: pnpm --filter annotator start -- <game> <path/to/input.json> [--dry-run] [--model=gpt-4o]");
  process.exit(1);
}

// Model pricing map
const modelPricing: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.005, output: 0.015 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
};

// Validate model
const pricing = modelPricing[model];
if (!pricing) {
  console.error(`❌ Unsupported model: ${model}`);
  process.exit(1);
}

// Load input file
const raw = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

if (isDryRun) {
  const enc = encoding_for_model(model);
  const numBlocks = raw.length;
  const tokenCounts: { [tier: string]: number } = {};

  for (const block of raw) {
    const fullText = `${block.heading}\n\n${block.content}`.trim();

    for (const tier of tiers) {
      const promptPath = `prompts/${game}/${tier}.txt`;
      if (!fs.existsSync(promptPath)) continue;

      const prompt = fs.readFileSync(promptPath, "utf-8");
      const fullPrompt = `${prompt}\n\n${fullText}\n\nQ&A:`.slice(0, 4000);
      const tokens = enc.encode(fullPrompt).length;
      tokenCounts[tier] = (tokenCounts[tier] || 0) + tokens;
    }
  }

  const totalInput = Object.values(tokenCounts).reduce((a, b) => a + b, 0);
  const outputPerCall = 250;
  const totalCalls = raw.length * tiers.length;
  const totalOutput = totalCalls * outputPerCall;

  const costIn = (totalInput / 1000) * pricing.input;
  const costOut = (totalOutput / 1000) * pricing.output;
  const totalCost = costIn + costOut;

  console.log(`📊 Dry Run Summary (Model: ${model})`);
  console.log(`• Blocks: ${raw.length}`);
  console.log(`• Tiers per block: ${tiers.length}`);
  console.log(`• Total API calls: ${totalCalls}`);
  console.log(`• Input Tokens: ${totalInput}`);
  console.log(`• Estimated Output Tokens: ${totalOutput}`);
  console.log(`• Total Tokens: ${totalInput + totalOutput}`);
  console.log(`• Estimated Cost: ~$${totalCost.toFixed(2)}`);
  process.exit(0);
}

const annotate = async () => {
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is not set. Please add it to a .env file or environment variable.");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const enriched = [];

  for (const block of raw) {
    const { heading, content } = block;
    const fullText = `${heading}\n\n${content}`.trim();
    const questionsByTier: Record<string, any[]> = {};

    for (const tier of tiers) {
      const promptPath = `prompts/${game}/${tier}.txt`;

      if (!fs.existsSync(promptPath)) {
        console.warn(`⚠️  Missing prompt: ${promptPath} — skipping ${tier}`);
        questionsByTier[tier] = [];
        continue;
      }

      const prompt = fs.readFileSync(promptPath, "utf-8");
      const fullPrompt = `${prompt}\n\n${fullText}\n\nQ&A:`.slice(0, 4000);

      try {
        const response = await openai.chat.completions.create({
          messages: [{ role: "user", content: fullPrompt }],
          model: model as any,
          temperature: 0.7,
        });

        const qa = JSON.parse(response.choices[0].message.content || "[]");
        questionsByTier[tier] = qa;
        console.log(`✅ ${heading} → ${tier} (${qa.length} Q&A)`);
      } catch (e) {
        console.error(`❌ Error annotating [${tier}] → ${heading}`);
        questionsByTier[tier] = [];
      }
    }

    enriched.push({
      heading,
      content,
      questions: questionsByTier,
    });
  }

  const outFile = inputPath.replace(/\.json$/, ".annotated.json");
  fs.writeFileSync(outFile, JSON.stringify(enriched, null, 2));
  console.log(`🎉 Annotation complete: ${outFile}`);
};

annotate();
