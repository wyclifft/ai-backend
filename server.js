import express from "express";
import cors from "cors";
import axios from "axios";
import fetch from "node-fetch"; // npm install node-fetch

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.TOGETHER_API_KEY || "tgp_v1_your_real_key_here";
const FAQ_URL = "https://raw.githubusercontent.com/wyclifft/ai-backend/refs/heads/main/faq.json";

let cachedFAQ = [];

// Load FAQ from GitHub and cache
async function loadFAQ() {
  try {
    const res = await fetch(FAQ_URL);
    if (!res.ok) throw new Error(`Failed to load FAQ: ${res.status}`);
    cachedFAQ = await res.json();
    console.log("✅ FAQ loaded from GitHub");
  } catch (err) {
    console.error("❌ Error loading FAQ:", err.message);
    cachedFAQ = [];
  }
}

// FAQ search
function checkFAQ(message) {
  const lowerMessage = message.toLowerCase();
  const found = cachedFAQ.find(item => lowerMessage.includes(item.question.toLowerCase()));
  return found ? found.answer : null;
}

// AI route
app.post("/ask", async (req, res) => {
  const prompt = req.body.prompt || "";
  console.log("📥 Prompt received:", prompt);

  try {
    // 1️⃣ Check FAQ first
    const faqAnswer = checkFAQ(prompt);
    if (faqAnswer) {
      console.log("💡 FAQ match found");
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

    const reply = response.data.choices[0]?.message?.content || "No reply generated.";
    console.log("✅ Together.ai response:", reply);
    res.json({ reply, source: "together.ai" });

  } catch (err) {
    const errorMessage = err.response?.data || err.message;
    console.error("❌ Error from Together.ai:", errorMessage);
    res.status(500).json({ error: "AI error", details: errorMessage });
  }
});

// View current FAQ
app.get("/faq", (req, res) => {
  res.json(cachedFAQ);
});

// Start server & load FAQ initially
app.listen(PORT, async () => {
  await loadFAQ();
  console.log(`🚀 Server running on port ${PORT}`);
});

// Optional: refresh FAQ every 15 minutes
setInterval(loadFAQ, 15 * 60 * 1000);
