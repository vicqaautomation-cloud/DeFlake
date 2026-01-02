import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

# Load env variables from the parent directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

class LLMClient:
    def __init__(self, mock: bool = False):
        self.mock = mock
        if not self.mock:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY not found in environment variables.")
            try:
                self.llm = ChatOpenAI(model="gpt-4o", temperature=0)
            except Exception:
                # Fallback to mock if init fails (e.g. auth error, though lazy init usually prevents this)
                print("⚠️  Warning: Failed to initialize OpenAI. Switching to Mock Mode.")
                self.mock = True

    def heal(self, error_log: str, html_snapshot: str) -> str:
        """
        Sends the error and HTML to the LLM to ask for a fix.
        """
        if self.mock:
            return (
                "/* DeFlake Mock Response */\n"
                "/* The button ID changed from #submit-button to .btn-primary-2026 */\n"
                "button[data-testid='submit-btn']"
            )

        system_prompt = (
            "You are DeFlake, an expert QA Engineer and Test Automation specialist. "
            "Your goal is to fix broken Playwright/Selenium tests.\n"
            "You will be given an ERROR LOG and an HTML SNAPSHOT of the page.\n"
            "Analyze why the test failed (e.g., element not found, selector changed).\n"
            "Identify the target element in the HTML.\n"
            "Suggest a NEW, ROBUST CSS selector or XPath to fix the test.\n"
            "Return ONLY the code fix or selector, with a brief explanation."
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "Error Log:\n{error_log}\n\nHTML Snapshot:\n{html_snapshot}")
        ])

        chain = prompt | self.llm
        response = chain.invoke({"error_log": error_log, "html_snapshot": html_snapshot})
        return response.content
