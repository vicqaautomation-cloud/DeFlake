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

    def heal(self, error_log: str, html_snapshot: str, failing_line: str = None, source_code: str = None) -> str:
        """
        Sends the error, HTML, and optional source code to the LLM to ask for a fix.
        """
        if self.mock:
                # Mock output for testing
            if failing_line:
                return "```javascript\npage.locator('button[data-testid=\"submit-btn\"]').click();\n```"
            return "```javascript\n// Selector update\npage.locator('.btn-primary-2026');\n```"

        system_prompt = (
            "You are an expert Test Automation Engineer specializing in Playwright and Page Object Models (POM).\n"
            "Your Goal: Provide the fix for the test failure, identifying exactly WHERE (line number) and WHAT to change.\n\n"
            "RULES:\n"
            "1. **Analyze HTML & Source**:\n"
            "   - Find the REAL element in the HTML (id > data-testid > text).\n"
            "   - **WARNING**: Context may contain virtual IDs like `[ref=e11]` or `[xp=e5]`. **IGNORE THEM**. They are internal artifacts. Use real attributes only.\n"
            "   - LOCATE the definition in the 'Source Code'. If the error is at runtime (e.g. line 20), but the locator is defined at line 12, your target is LINE 12.\n"
            "2. **Respect Pattern**: Use `this.prop = ...` if inside a constructor.\n"
            "3. **OUTPUT FORMAT**: You must return a strict JSON object:\n"
            "```json\n"
            "{{\n"
            "  \"code\": \"fixed_code_line_here\",\n"
            "  \"line_number\": <integer_of_target_line_in_source_code>,\n"
            "  \"reason\": \"Brief explanation\"\n"
            "}}\n"
            "```\n"
            "If you cannot fix it, set code to null."
        )

        user_content = "Error Log:\n{error_log}\n\nHTML Context:\n{html_snapshot}"
        
        inputs = {"error_log": error_log, "html_snapshot": html_snapshot}
        
        if source_code:
            # Add line numbers to source code for the LLM to reference
            numbered_source = "\n".join([f"{i+1}: {line}" for i, line in enumerate(source_code.splitlines())])
            # SAFE PASSING: Check if we are using f-string or literal concatenation in the previous bad version.
            # We want to use a PLACEHOLDER in the prompt string, and data in inputs.
            user_content += "\n\nSource Code (with line numbers):\n{source_code}"
            inputs["source_code"] = numbered_source

        if failing_line:
            user_content += "\n\nFailing Line:\n{failing_line}"
            inputs["failing_line"] = failing_line

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", user_content)
        ])

        chain = prompt | self.llm
        response = chain.invoke(inputs)
        
        # Clean up Markdown code blocks if present in response
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
            
        return content
