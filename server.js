import express from "express";
import cors from "cors";
import axios from "axios";
import faqs from "./faq.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.TOGETHER_API_KEY || "tgp_v1_your_real_key_here";

// Function to check FAQ
function checkFAQ(message) {
  const lowerMessage = message.toLowerCase();
  const found = faqs.find(faq => lowerMessage.includes(faq.question));
  return found ? found.answer : null;
}

app.post("/ask", async (req, res) => {
  const prompt = req.body.prompt || "";
  console.log("📥 Prompt received:", prompt);

  try {
    // 1️⃣ Check FAQ first
    const faqAnswer = checkFAQ(prompt);
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
