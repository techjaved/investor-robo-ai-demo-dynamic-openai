// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/generate-advisory", async (req, res) => {
  try {
    const { name, questionnaireInputs, totalScore, riskCategory } = req.body;

    const prompt = `
You are an expert financial advisor. Analyze the investor’s responses and provide a structured, personalized investment advisory.

User Information:
- Name: ${name}
- Risk Category: ${riskCategory}
- Total Score: ${totalScore}

Questionnaire Responses:
${JSON.stringify(questionnaireInputs, null, 2)}

Scoring System Recap:
- 1–28 Points: Conservative Investor → Capital preservation, low tolerance for risk, needs liquidity.
- 29–37 Points: Moderately Conservative Investor → Preserves capital, steady growth, low volatility.
- 38–46 Points: Moderate Investor → Balanced growth, moderate fluctuations, medium-term horizon.
- 47–56 Points: Moderately Aggressive Investor → Growth-focused, tolerates market fluctuations, 5+ years horizon.
- >56 Points: Aggressive Investor → Maximum growth, tolerates high volatility, 10+ years horizon.

Important Instructions:
- Output must be in strict JSON (no markdown, no backticks).
- Tailor portfolio allocations and recommendations according to risk profile and questionnaire answers.
- Keep allocations realistic (sum of suggestedAllocation should ~100%).
- Action recommendations should be practical and investor-friendly.

JSON Schema:
{
  "investorProfile": {
    "name": string,
    "ageGroup": string,
    "riskCategory": string,
    "totalScore": number
  },
  "summary": {
    "riskTolerance": string,
    "investmentHorizon": string,
    "incomeNeed": string
  },
  "portfolioAdvisory": {
    "currentAllocation": [
      { "assetClass": string, "allocationPercent": number, "comments": string }
    ],
    "suggestedAllocation": [
      { "assetClass": string, "recommendedPercent": number, "reasoning": string }
    ]
  },
  "actionRecommendations": [string]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    let textResult = response.choices[0].message.content;
    textResult = textResult.trim().replace(/```json/g, "").replace(/```/g, "");

    const advisory = JSON.parse(textResult);
    res.json({ advisory });

  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to generate advisory" });
  }
});

app.listen(3050, () => console.log("Server running at http://localhost:3050"));
