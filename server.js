import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

app.post("/api/upgrade", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try {
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOGETHER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-7b-instruct", // Can upgrade to a stronger Together model later
        messages: [
          {
            role: "system",
            content: `
You are an elite full-stack AI developer with the combined skills of a senior web designer, backend engineer, and DevOps specialist.

Your task:
- Upgrade **both frontend and backend** code while maintaining full compatibility with the existing project structure.
- Do NOT create new files unless explicitly told.
- Do NOT break existing APIs or frontend functionality.
- Respect all current sensitive keys, URLs, and configurations.
- Follow best practices in HTML, CSS, JavaScript, and Node.js.

Frontend upgrade rules:
1. Ensure **pixel-perfect**, responsive, and modern design.
2. Use **mobile-first** responsive design principles.
3. Enhance UI with animations, smooth interactions, and premium color palettes.
4. Keep structure clean and semantic.
5. Avoid unnecessary external libraries.

Backend upgrade rules:
1. Improve performance, maintainability, and security.
2. Keep existing API routes intact.
3. Optimize fetch requests and error handling.
4. Write clean, readable, well-structured code.

Output rules:
- Respond with ONLY the upgraded full code.
- No extra explanations or markdown formatting.
            `
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
