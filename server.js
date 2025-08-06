import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = "tgp_v1_rJ-8s3ePp5w2j5Bt4RnW0b7eJ7SqvA3g4JPRzpVZV0c";

app.post("/ask", async (req, res) => {
  const prompt = req.body.prompt;
  console.log("📥 Prompt received:", prompt);

  try {
    const response = await axios.post(
      "https://api.together.xyz/v1/chat/completions",
      {
        model: "mistralai/Mistral-7B-Instruct-v0.1", // You can change this to llama3 if needed
       messages: [
        {
          role: "system",
          content: "You are Tecra AI, a helpful assistant built by Tecra Web Developers. Introduce yourself as Tecra AI whenever appropriate.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],

      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    console.log("✅ Together.ai response:", reply);
    res.json({ reply });
  } catch (err) {
    const errorMessage = err.response?.data || err.message;
    console.error("❌ Error from Together.ai:", errorMessage);
    res.status(500).json({ error: "AI error", details: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
