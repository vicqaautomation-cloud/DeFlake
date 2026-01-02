import os

class SourcePatcher:
    def read_line(self, file_path: str, line_number: int) -> str:
        """Reads a specific line from a file (1-indexed)."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Source file not found: {file_path}")
        
        with open(file_path, 'r') as f:
            lines = f.readlines()
            
        if line_number < 1 or line_number > len(lines):
            raise IndexError(f"Line {line_number} is out of range for file {file_path}")
            
        return lines[line_number - 1].strip()

    def replace_line(self, file_path: str, line_number: int, new_content: str) -> bool:
        """
        Replaces a specific line in a file with new content.
        Backs up the original line implicitly by rewriting the file.
        Returns True if successful.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Source file not found: {file_path}")
            
        with open(file_path, 'r') as f:
            lines = f.readlines()
            
        if line_number < 1 or line_number > len(lines):
            raise IndexError(f"Line {line_number} out of range")
        
        # Preserve indentation of the original line
        original_line = lines[line_number - 1]
        indentation = original_line[:len(original_line) - len(original_line.lstrip())]
        
        # Construct the new line: indentation + new code + newline
        lines[line_number - 1] = f"{indentation}{new_content.strip()}\n"
        
        with open(file_path, 'w') as f:
            f.writelines(lines)
            
        return True
