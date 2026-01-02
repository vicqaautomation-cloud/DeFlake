import json
import datetime
import os
import click
from analyzer import ErrorAnalyzer
from llm_client import LLMClient
from patcher import SourcePatcher

def append_to_history(log_path, html_path, fix_content):
    """Appends the fix result to history.json"""
    history_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "history.json")
    
    entry = {
        "timestamp": datetime.datetime.now().isoformat(),
        "log_path": log_path,
        "html_path": html_path,
        "fix": fix_content,
        "status": "Applied" # In a real app this might be 'Pending'
    }
    
    history = []
    if os.path.exists(history_file):
        try:
            with open(history_file, 'r') as f:
                history = json.load(f)
        except json.JSONDecodeError:
            pass # corrupted file, start over
            
    history.append(entry)
    
    with open(history_file, 'w') as f:
        json.dump(history, f, indent=2)

@click.command()
@click.option('--log', required=True, help='Path to the error log file.')
@click.option('--html', required=True, help='Path to the HTML snapshot file.')
@click.option('--mock', is_flag=True, help='Run in mock mode without consuming API credits.')
@click.option('--apply', is_flag=True, help='Automatically apply the fix to the source code.')
def main(log, html, mock, apply):
    """
    DeFlake Core CLI.
    Analyzes a failure and suggests a fix.
    """
    click.echo(f"🚑 DeFlake is examining the patient...")
    click.echo(f"   Log: {log}")
    click.echo(f"   HTML: {html}")
    if mock:
        click.echo("   (Running in MOCK mode)")

    try:
        # Step 1: Analyze Input
        analyzer = ErrorAnalyzer(log, html)
        log_content = analyzer.read_log()
        html_content = analyzer.read_html()
        
        # Try to find source location
        file_path, line_number = analyzer.extract_location()
        failing_line = None
        
        if file_path and line_number:
            click.echo(f"📍 Failure located at: {file_path}:{line_number}")
            try:
                patcher = SourcePatcher()
                failing_line = patcher.read_line(file_path, line_number)
                click.echo(f"   Code: {failing_line.strip()}")
            except Exception as e:
                click.echo(f"⚠️  Could not read source file: {e}")
        else:
            click.echo("⚠️  Could not extract failure location from log.")

        click.echo("✅ Input files read successfully.")

        # Step 2: Consult the Oracle (LLM)
        client = LLMClient(mock=mock)
        click.echo("🧠 Consulting the AI brain...")
        fix = client.heal(log_content, html_content, failing_line)

        # Step 3: Record History
        append_to_history(log, html, fix)
        click.echo("📜 Added to history.")

        # Step 4: Apply Patch (if requested)
        if apply and file_path and line_number and failing_line:
            click.echo("💉 Auto-Applying Patch...")
            try:
                # Basic safety check: ensure the fix looks like code
                if len(fix.strip()) > 0:
                    patcher.replace_line(file_path, line_number, fix)
                    click.echo(f"✅ Successfully patched {file_path}")
                else:
                    click.echo("⚠️  Fix was empty, skipping patch.")
            except Exception as e:
                click.echo(f"❌ Failed to apply patch: {e}")

        # Step 5: Prescribe
        click.echo("\n" + "="*40)
        click.echo("flake-fixer-1.0-result")
        click.echo("="*40)
        click.echo(fix)
        click.echo("="*40)

    except Exception as e:
        click.echo(f"❌ Error: {e}", err=True)

if __name__ == '__main__':
    main()
