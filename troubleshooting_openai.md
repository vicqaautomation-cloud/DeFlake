# OpenAI API Quota & Billing Help

## Why did I get a "429 Insufficient Quota" error?

The API Key you provided (`sk-proj-...`) is valid, but the **OpenAI account** linked to it is out of credits.

**Important:**
- **Antigravity** (My subscription) covers the cost of *me* (the agent) thinking and writing code.
- **OpenAI API Key** (Your generic key) covers the cost of the *HealAI script* connecting to GPT-4. These are separate bills.

## How to Fix It

1.  **Check Your Quota**:
    - Go to: [OpenAI Billing Dashboard](https://platform.openai.com/account/billing/overview)
    - Ensure you have a payment method added and "Credit Balance" is not $0.00.
2.  **Generate a New Key**:
    - If needed, create a new key here: [API Keys](https://platform.openai.com/api-keys)
    - Update the `.env` file with the new key.

## Alternative: Mock Mode (Free)

If you don't want to add credits right now, I can switch HealAI to **Mock Mode**.
- I will simulate the LLM's response (returning a fake CSS fix).
- This allows us to keep building the Dashboard and Plugin infrastructure without paying OpenAI.

**Do you want to:**
1.  **Fix the Key** (I will wait).
2.  **Switch to Mock Mode** (We proceed immediately).
