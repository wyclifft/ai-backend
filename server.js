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
