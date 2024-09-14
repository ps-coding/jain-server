require("dotenv").config();

const process = require("process");
const express = require("express");
const openai = require("openai");
const { createWorker } = require("tesseract.js");

const app = express();
const port = process.env["PORT"] || 3000;

app.use(express.json({ limit: "10mb" }));

const client = new openai.OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const base64ImageOCR = async (base64Image) => {
  const imageBuffer = Buffer.from(base64Image, "base64");

  const worker = createWorker();
  await worker.load();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");
  const {
    data: { text },
  } = await worker.recognize(imageBuffer);
  await worker.terminate();

  return text;
};

const isJain = async (ingredients) => {
  const params = {
    messages: [
      {
        role: "user",
        content: `Can the food with the following ingreidents be eaten by Jains? If not, what ingredients are problematic? Explain briefly in one sentence.\nIngredients: ${ingredients}`,
      },
    ],
    model: "gpt-4o-mini",
  };
  const response = await client.chat.completions.create(params);
  return response.choices[0].message.content;
};

app.post("/isjain", async (req, res) => {
  try {
    const { base64Image } = req.body;
    const ingredients = await base64ImageOCR(base64Image);
    const response = await isJain(ingredients);
    res.send(response);
  } catch (_) {}
});

app.listen(port, () => {
  console.log(`Server started on port ${port}.`);
});
