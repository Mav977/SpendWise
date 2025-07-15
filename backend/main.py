import re
import json
import logging
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from dotenv import load_dotenv
import os
from typing import List


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class GeminiPrompt(BaseModel):
    prompt: str
    categories: List[str]


@app.post('/ask-gemini')
def ask_gemini(data: GeminiPrompt):
    category_list = ", ".join(data.categories)

    prompt = f"""
You are an intelligent expense categorizer.

You are given a transaction message:
"{data.prompt}"

Your task:
1. Think deeply and cautiously before matching to any category.
2. Try to match the transaction to one of the following categories:
{category_list}

3. If a category fits well, return it with a confidence score (0–10) based on how certain you are. you can give decimal values too
4. If no category fits, suggest a **new category** — but keep it to **1 or 2 words** only.
   - Do NOT guess if unsure.
   - If you're highly uncertain, give a **very low confidence score** (e.g. 2 or 3).
   -If you are highly certain of the new category, give a high confidence score (10)
5. Clean and normalize messy UPI names like "blinkitx238", "swiggy-xyz123" into brand names like "Blinkit", "Swiggy" and use that as the description.
6. Always specify the type: either "Expense" or "Income".
7. Be realistic — "shree ganesh enterprise" might be unknown; don't assume it's "Food" unless you're confident.
8. ⚠️ STRICT RULES for description:
- NO extra words.
- ONLY the normalized merchant name. (e.g., "Blinkit", "Paytm", "Zomato")
- NO phrases like "transaction to", "payment for", "transfer to", etc.
- MAXIMUM 2 words, preferably just one.

Always return ONLY valid raw JSON (no markdown, no extra text):

Example:
{{
  "category": "Groceries",
  "description": "Blinkit",
  "type": "Expense",
  "confidence_score": "9.5"
}}

Another example:
{{
  "category": "Unknown",
  "description": "Shreemaya",
  "type": "Expense",
  "confidence_score": "2"
}}
ONLY RETURN JSON
"""

    try:
        logger.info("Sending prompt to Gemini...")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        raw = response.text.strip()
        cleaned = re.sub(r"^```json|```$", "", raw).strip("`\n ")
        parsed = json.loads(cleaned)

        logger.info(f"Received Gemini response: {parsed}")

        if "description" in parsed and description_too_long(parsed["description"]):
            logger.info("Description too long — initiating cleanup")
            fixed = fix_desc(parsed["description"])
            parsed["description"] = fixed

        return parsed
    except Exception as e:
        logger.exception(" Error while handling /ask-gemini request")
        return {"error": str(e)}


def description_too_long(desc: str) -> bool:
    if len(desc.split()) > 3:
        return True
    logger.info("✅ Description is within limits")
    return False


def fix_desc(desc: str) -> str:
    try:
        prompt = f"""
Clean the following receiver name and normalize it to a 1–2 word name.
NO extra words like "payment to", "transaction to", etc.

Receiver: "{desc}"

Return ONLY the cleaned name, like:
"Blinkit"
"Swiggy"
"Shreemaya"
"""
        logger.info(f"Sending fix-desc prompt for: {desc}")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        cleaned = response.text.strip().strip('"` \n')
        logger.info(f"Cleaned description: {cleaned}")
        return cleaned
    except Exception as e:
        logger.exception(" Error cleaning description")
        return "Unknown"

@app.get("/")
def read_root():
    return {"message": "Backend is live!"}
