import express from "express";
import cors from "cors";
import axios from "axios";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.TOGETHER_API_KEY || "tgp_v1_your_real_key_here";

// Path to FAQs JSON
const faqsFilePath = path.join(process.cwd(), "faqs.json");

// Load FAQs
function loadFAQs() {
  return JSON.parse(fs.readFileSync(faqsFilePath, "utf8"));
}

// Save FAQs
function saveFAQs(newFaqs) {
  fs.writeFileSync(faqsFilePath, JSON.stringify(newFaqs, null, 2));
}

// FAQ search function
function checkFAQ(message) {
  const faqs = loadFAQs();
  const lowerMessage = message.toLowerCase();
  const found = faqs.find(faq => lowerMessage.includes(faq.question.toLowerCase()));
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

// New routes to view & edit FAQs without redeploy
app.get("/faqs", (req, res) => {
  res.json(loadFAQs());
});

app.post("/faqs", (req, res) => {
  const newFaqs = req.body;
  if (!Array.isArray(newFaqs)) {
    return res.status(400).json({ error: "FAQs must be an array" });
  }
  saveFAQs(newFaqs);
  res.json({ message: "FAQs updated successfully" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
