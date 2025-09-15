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
You are a financial advisor.
User info:
Name: ${name}
Risk Category: ${riskCategory}
Total Score: ${totalScore}

Questionnaire Inputs: ${JSON.stringify(questionnaireInputs)}

Generate a detailed advisory report in strict JSON format with this structure (do NOT include any markdown or backticks):

{
  "investorProfile": { "name": "", "ageGroup": "", "riskCategory": "", "totalScore": 0 },
  "summary": { "riskTolerance": "", "investmentHorizon": "", "incomeNeed": "" },
  "portfolioAdvisory": { 
    "currentAllocation": [{ "assetClass": "", "allocationPercent": 0, "comments": "" }],
    "suggestedAllocation": [{ "assetClass": "", "recommendedPercent": 0, "reasoning": "" }]
  },
  "actionRecommendations": []
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
