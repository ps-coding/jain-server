require("dotenv").config();

const process = require("process");
const express = require("express");
const cors = require("cors");
const openai = require("openai");
const tesseract = require("tesseract.js");

const app = express();
const port = process.env["PORT"] || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const client = new openai.OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const base64ImageOCR = async (base64Image) => {
  const worker = await tesseract.createWorker("eng", 1, {
    workerPath: "./node_modules/tesseract.js/src/worker-script/node/index.js",
  });
  const result = await worker.recognize(base64Image);
  await worker.terminate();
  return result.data.text;
};

const isJain = async (ingredients) => {
  const params = {
    messages: [
      {
        role: "user",
        content: `Can the food with the following ingredients be eaten by Jains? Just answer YES or NO followed by one sentence with a concise list of the problematic ingredients with just a few words about why they are problematic. As a reminder, Jains cannot eat any product that contains eggs, meat, gelatin, rennet, potatoes, onions, garlic, carrots, root vegetables, or any other items that are prohibited by Jain scriptures or generally created by the killing of animals.\nIngredients: ${ingredients}`,
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
    res.json({ response });
  } catch (err) {
    console.error(err);
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}.`);
});
