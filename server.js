require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");

// 🔑 PASTE YOUR GROQ API KEY HERE
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const PORT = 3000;

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    const filePath = path.join(__dirname, "index.html");
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(500); res.end("Error loading index.html"); return; }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
    return;
  }
  if (req.method === "POST" && req.url === "/api/guess") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { imageData } = JSON.parse(body);
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "qwen/qwen3.6-27b",
            max_tokens: 15,
            messages: [{
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${imageData}`
                  }
                },
                {
                  type: "text",
                  text: "Reply with ONLY the object name in 1-3 words. No explanation, no punctuation, no extra text. Examples of correct replies: 'Cat', 'A house', 'Tree'. What is drawn here?"
                }
              ]
            }]
          })
        });
        const data = await response.json();
        if (data.error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: data.error.message }));
          return;
        }
        const guess = data.choices[0].message.content.trim();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ guess }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});
server.listen(PORT, () => {
  console.log("✅ Quick Draw running at http://localhost:" + PORT);
});
