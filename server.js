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

    console.log("questionnaireInputs:", questionnaireInputs);
    console.log("riskCategory:", riskCategory);

    const prompt = `Act like a seasoned investment advisor for ${questionnaireInputs.ageGroup} year old person with investment corpus of RS ${questionnaireInputs.investmentAmount} can remain invested for ${questionnaireInputs.investmentHorizon} years, current investments amount to ${questionnaireInputs.currentInvestment} and expect income to ${questionnaireInputs.incomeGrowth}. Currently have ${questionnaireInputs.insurance} insurance. Create a brief asset allocation across these 6 asset classes - ETFs, MFs, FDs, Corporate bonds, Government schemes, Digital Gold. It is not necessary to allocate across each asset class. For Mutual funds, only consider equity funds. Assign 30% weightage to Macro economic factors and 70% to person's profile. I am a ${riskCategory}. All output in the form of a simple table. Also showcase overall range of return to be expected.  Fundamental logic of allocation to align with PMPT principles.

User Information:
- Name: ${name}
- Risk Category: ${riskCategory}
- Total Score: ${totalScore}

Questionnaire Responses:
${JSON.stringify(questionnaireInputs, null, 2)}



Important Instructions:
- Respond only in JSON format as per the schema below.
- Always include estimated current allocation if no value provided for it and suggested allocations.
- Do not include any explanations or additional text outside the JSON structure.
- Ensure the JSON is well-formed and valid.
- Use clear and concise language in comments and reasoning.
- Avoid overly technical jargon; keep it accessible for a general audience.
- Output must be in strict JSON (no markdown, no backticks).
- Tailor portfolio allocations and recommendations according to risk profile and questionnaire answers.
- Keep allocations realistic (sum of suggestedAllocation should ~100%).
- Action recommendations should be practical and investor-friendly.
- Create a brief asset allocation across these 6 asset classes - ETFs, MFs, FDs, Corporate bonds, Government schemes, Digital Gold

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
  // "actionRecommendations": [string]
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
