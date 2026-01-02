import os
from bs4 import BeautifulSoup

import re

class ErrorAnalyzer:
    def __init__(self, log_path: str, html_path: str):
        self.log_path = log_path
        self.html_path = html_path

    def read_log(self) -> str:
        """Reads the error log file."""
        if not os.path.exists(self.log_path):
            raise FileNotFoundError(f"Log file not found: {self.log_path}")
        with open(self.log_path, 'r') as f:
            return f.read()

    def read_html(self, max_length: int = 8000) -> str:
        """Reads and optionally truncates/cleans the HTML file."""
        if not os.path.exists(self.html_path):
            raise FileNotFoundError(f"HTML file not found: {self.html_path}")
        
        with open(self.html_path, 'r') as f:
            content = f.read()
        
        # Simple parsing to verify it's HTML, maybe strip scripts later
        soup = BeautifulSoup(content, 'html.parser')
        
        # For now, just return the string, maybe truncated if it's massive
        # In a real app, we'd remove <script>, <style> to save tokens
        text_content = str(soup)
        if len(text_content) > max_length:
            return text_content[:max_length] + "...[TRUNCATED]"
        return text_content

    def extract_location(self) -> tuple[str, int]:
        """
        Parses the log file to find 'Location: /path/to/file.py:42'
        Returns (file_path, line_number) or (None, None)
        """
        content = self.read_log()
        match = re.search(r"Location: (.+):(\d+)", content)
        if match:
            return match.group(1), int(match.group(2))
        return None, None
