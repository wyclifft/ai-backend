import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.TOGETHER_API_KEY || "tgp_v1_your_real_key_here";
const FAQ_URL = "https://raw.githubusercontent.com/wyclifft/ai-backend/refs/heads/main/faq.json";

// Load FAQ from GitHub
async function loadFAQ() {
  try {
    const res = await fetch(FAQ_URL);
    if (!res.ok) throw new Error(`Failed to load FAQ: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("❌ Error loading FAQ:", err.message);
    return [];
  }
}

// FAQ search
async function checkFAQ(message) {
  const faq = await loadFAQ();
  const lowerMessage = message.toLowerCase();
  const found = faq.find(item => lowerMessage.includes(item.question.toLowerCase()));
  return found ? found.answer : null;
}

// AI route
app.post("/ask", async (req, res) => {
  const prompt = req.body.prompt || "";
  console.log("📥 Prompt received:", prompt);

  try {
    // 1️⃣ Check FAQ first
    const faqAnswer = await checkFAQ(prompt);
    if (faqAnswer) {
      console.log("💡 FAQ match found, sending quick answer");
      return res.json({ reply: faqAnswer, source: "faq" });
    }

    // 2️⃣ No match → send to Together.ai
    const response = await axios.post(
      "https://api.together.xyz/v1/chat/completions",
      {
        model: "mistralai/Mistral-7B-Instruct-v0.1",
        messages: [
          {
            role: "system",
            content: "You are Tecra AI, a helpful assistant built by Tecra Web Developers. Introduce yourself as Tecra AI whenever appropriate."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    console.log("✅ Together.ai response:", reply);
    res.json({ reply, source: "together.ai" });

  } catch (err) {
    const errorMessage = err.response?.data || err.message;
    console.error("❌ Error from Together.ai:", errorMessage);
    res.status(500).json({ error: "AI error", details: errorMessage });
  }
});

// View current FAQ
app.get("/faq", async (req, res) => {
  res.json(await loadFAQ());
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
