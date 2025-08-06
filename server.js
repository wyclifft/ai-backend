import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = "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"; // Replace with your OpenRouter key

app.post("/ask", async (req, res) => {
  const prompt = req.body.prompt;
  console.log("📥 Prompt received:", prompt);

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ OpenRouter response:", response.data);

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    const errorMessage = err.response?.data || err.message;
    console.error("❌ Error talking to OpenRouter:", errorMessage);
    res.status(500).json({ error: "No response from AI.", details: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
