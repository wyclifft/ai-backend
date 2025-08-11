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

// Path to faq JSON
const faqFilePath = path.join(process.cwd(), "faq.json");

// Load faq
function loadfaq() {
  return JSON.parse(fs.readFileSync(faqFilePath, "utf8"));
}

// Save faq
function savefaq(newfaq) {
  fs.writeFileSync(faqFilePath, JSON.stringify(newfaq, null, 2));
}

// FAQ search function
function checkFAQ(message) {
  const faq = loadfaq();
  const lowerMessage = message.toLowerCase();
  const found = faq.find(faq => lowerMessage.includes(faq.question.toLowerCase()));
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

// New routes to view & edit faq without redeploy
app.get("/faq", (req, res) => {
  res.json(loadfaq());
});

app.post("/faq", (req, res) => {
  const newfaq = req.body;
  if (!Array.isArray(newfaq)) {
    return res.status(400).json({ error: "faq must be an array" });
  }
  savefaq(newfaq);
  res.json({ message: "faq updated successfully" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
