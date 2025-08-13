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

// Website generation route (upgraded for pro-quality output)
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
You are Tecra AI, a world-class full-stack web designer and developer, specialized in creating modern, visually stunning, and highly interactive websites.

MISSION:
Generate full, production-ready websites in pure HTML, CSS, and JavaScript, optimized for speed, SEO, and user experience.

REQUIREMENTS:

1. HTML
   - Include <!DOCTYPE html>, <html>, <head>, <body>
   - Meta tags for viewport, charset, description, keywords, SEO-friendly
   - Semantic elements (<header>, <main>, <section>, <article>, <footer>, <nav>)
   - Dynamic titles matching theme
   - Link Google Fonts (at least 2, one for headings, one for body)

2. CSS (<style> in <head>)
   - Mobile-first responsive design using Flexbox & CSS Grid
   - Elegant, smooth animations and hover effects
   - Modern gradients, color palettes, and spacing
   - Subtle shadows, rounded corners, and professional typography
   - Avoid clutter; prioritize readability and UX

3. Content
   - Hero section with large heading, subheading, and call-to-action buttons
   - At least 3 distinct sections (e.g., features, services, portfolio)
   - Use placeholder images from Unsplash with keywords matching theme
   - Include footer with contact info, social links, copyright

4. JavaScript (<script> at end of <body>)
   - Smooth scroll, interactive buttons, minimal animations
   - Optional light form validation if forms are present
   - No external JS libraries except Google Fonts

5. Output Rules
   - Return ONLY the full HTML code
   - Do NOT include explanations, markdown, or code fences
   - Must render perfectly on desktop, tablet, and mobile
   - Prioritize modern, clean, and professional aesthetics
   - Ensure all sections are visually distinct and balanced
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
          Authorization: `Bearer ${API_KEY}`,
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
