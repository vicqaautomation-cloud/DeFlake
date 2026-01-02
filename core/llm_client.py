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

    def heal(self, error_log: str, html_snapshot: str, failing_line: str = None) -> str:
        """
        Sends the error, HTML, and optional source code to the LLM to ask for a fix.
        """
        if self.mock:
            if failing_line:
                # Mock rewriting the line
                return '    page.click("button[data-testid=\'submit-btn\']")'
            return (
                "/* DeFlake Mock Response */\n"
                "/* The button ID changed from #submit-button to .btn-primary-2026 */\n"
                "button[data-testid='submit-btn']"
            )

        system_prompt = (
            "You are DeFlake, an expert QA Engineer and Test Automation specialist. "
            "Your goal is to fix broken Playwright/Selenium tests.\n"
            "You will be given an ERROR LOG and an HTML SNAPSHOT of the page.\n"
            "If provided, you will also receive the FAILING LINE of code.\n"
            "Analyze why the test failed (e.g., element not found, selector changed).\n"
            "Identify the target element in the HTML.\n"
            "If a failing line is provided, return the COMPLETE NEW LINE of code to replace it.\n"
            "If no failing line is provided, return just the CSS selector.\n"
            "Return ONLY the code/selector. No markdown, no explanations."
        )

        user_content = f"Error Log:\n{error_log}\n\nHTML Snapshot:\n{html_snapshot}"
        if failing_line:
            user_content += f"\n\nFailing Line:\n{failing_line}"

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", user_content)
        ])

        chain = prompt | self.llm
        response = chain.invoke({"error_log": error_log, "html_snapshot": html_snapshot})
        return response.content.strip()
