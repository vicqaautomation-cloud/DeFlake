import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

# Load env variables from the parent directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

class LLMClient:
    def __init__(self, mock: bool = False, openai_api_key: str = None):
        self.mock = mock
        if not self.mock:
            # Use provided key (BYOK) or fallback to env (SaaS Owner)
            api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
            
            if not api_key:
                # raise ValueError("OPENAI_API_KEY not found in environment variables.")
                print("⚠️  Warning: No OpenAI Key found. Switching to Mock Mode.")
                self.mock = True
            else:
                try:
                    self.llm = ChatOpenAI(model="gpt-4o", temperature=0, api_key=api_key)
                except Exception:
                    # Fallback to mock if init fails
                    print("⚠️  Warning: Failed to initialize OpenAI. Switching to Mock Mode.")
                    self.mock = True

    def heal(self, error_log: str, html_snapshot: str, failing_line: str = None) -> str:
        """
        Sends the error, HTML, and optional source code to the LLM to ask for a fix.
        """
        if self.mock:
                # Mock output for testing
            if failing_line:
                return "```javascript\npage.locator('button[data-testid=\"submit-btn\"]').click();\n```"
            return "```javascript\n// Selector update\npage.locator('.btn-primary-2026');\n```"

        system_prompt = (
            "You are DeFlake, a code-repairing AI. Your job is to fix broken Playwright tests.\n"
            "BE EXTREMELY CONCISE. Do not explain the error unless it is ambiguous.\n"
            "1. IDENTIFY the specific failing line from the logs/context.\n"
            "2. GENERATE the corrected line of code using robust selectors (data-testid > id > text).\n"
            "3. OUTPUT FORMAT:\n"
            "```javascript\n"
            "// Fixed Code\n"
            "<your fixed line here>\n"
            "```\n"
            "If the fix involves a selector change, just provide the new selector line or const.\n"
            "If you cannot fix it, return exactly: '⚠️ UNABLE TO FIX: [Short Reason].'"
        )

        user_content = "Error Log:\n{error_log}\n\nHTML Context:\n{html_snapshot}"
        
        inputs = {"error_log": error_log, "html_snapshot": html_snapshot}
        
        if failing_line:
            user_content += "\n\nFailing Line:\n{failing_line}"
            inputs["failing_line"] = failing_line

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", user_content)
        ])

        chain = prompt | self.llm
        response = chain.invoke(inputs)
        return response.content.strip()
