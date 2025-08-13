import express from "express";
import cors from "cors";
import axios from "axios";
import fetch from "node-fetch"; // npm install node-fetch

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.TOGETHER_API_KEY;
const FAQ_URL = "https://raw.githubusercontent.com/wyclifft/ai-backend/refs/heads/main/faq.json";

// Fail fast if API key is missing or placeholder
if (!API_KEY || API_KEY.startsWith("tgp_v1_your_real_key_here")) {
  console.error("❌ TOGETHER_API_KEY missing or invalid. Set it in Render → Environment Variables.");
  process.exit(1);
}

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
  if (!message) return null;
  const lowerMessage = message.toLowerCase().trim();

  for (const item of cachedFAQ) {
    for (const q of item.questions) {
      if (lowerMessage.includes(q.toLowerCase())) {
        return item.answer;
      }
    }
  }
  return null;
}

// Chat route
app.post("/ask", async (req, res) => {
  const prompt = req.body.prompt || "";
  console.log("📥 Prompt received:", prompt);

  try {
    const faqAnswer = checkFAQ(prompt);
    if (faqAnswer) {
      console.log("💡 FAQ match found");
      return res.json({ reply: faqAnswer, source: "faq" });
    }

    const response = await axios.post(
      "https://api.together.xyz/v1/chat/completions",
      {
        model: "mistralai/Mistral-7B-Instruct-v0.1",
        messages: [
          {
            role: "system",
            content: "You are Tecra AI, a helpful assistant built by Tecra Web Developers."
          },
          { role: "user", content: prompt }
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
    console.log("✅ Together.ai response sent");
    res.json({ reply, source: "together.ai" });

  } catch (err) {
    console.error("❌ Error from Together.ai:", err.response?.data || err.message);
    res.status(500).json({ error: "AI error", details: err.response?.data || err.message });
  }
});

// View current FAQ
app.get("/faq", (req, res) => {
  res.json(cachedFAQ);
});

// Website generation route
app.post("/generate-site", async (req, res) => {
  const prompt = req.body.prompt || "";
  console.log("🌐 Website generation request:", prompt);

  try {
    const response = await axios.post(
      "https://api.together.xyz/v1/chat/completions",
      {
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        messages: [
          {
            role: "system",
            content: `
You are an elite, award-winning senior web designer and developer.
Your task is to create **pixel-perfect, premium-quality, and fully responsive websites** in pure HTML, CSS, and JavaScript.

STRICT REQUIREMENTS:
1. **HTML Structure**
   - Must include <!DOCTYPE html>, <html>, <head>, and <body>
   - Title must match the theme
   - Link a stunning **Google Font** for headings and body

2. **Styling (CSS inside <style>)**
   - Mobile-first responsive design using Flexbox & CSS Grid
   - Elegant animations, smooth hover effects, and transitions
   - Premium gradients and modern color palettes
   - Consistent spacing, shadows, and clean layout
   - Make it visually stunning without over-cluttering

3. **Content**
   - Include a **hero section** with a large heading, subheading, and call-to-action button(s)
   - At least 3 visually distinct sections
   - Use **images** from Unsplash placeholders:
     Example: https://source.unsplash.com/800x600/?<keyword>
   - Images must be relevant to the theme (e.g., tech, nature, business)

4. **JavaScript (inside <script>)**
   - Add small interactive features (e.g., smooth scroll, button animations)
   - No external libraries except Google Fonts

5. **Output Rules**
   - Output only the full HTML code
   - No explanations, no markdown, no comments
   - Must look professional on all devices (desktop, tablet, mobile)
            `
          },
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const html = response.data.choices[0]?.message?.content || "<h1>Could not generate site</h1>";
    console.log("✅ Website code generated");

    res.json({ html });
  } catch (err) {
    const errorMessage = err.response?.data || err.message;
    console.error("❌ Error generating site:", errorMessage);
    res.status(500).json({ error: "Site generation failed", details: errorMessage });
  }
});


// Start server & load FAQ initially
app.listen(PORT, async () => {
  await loadFAQ();
  console.log(`🚀 Server running on port ${PORT}`);
});

// Refresh FAQ every 15 minutes
setInterval(loadFAQ, 15 * 60 * 1000);
