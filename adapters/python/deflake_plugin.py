import sys
import pytest
import os
import subprocess
import time

def pytest_runtest_makereport(item, call):
    """
    Hook called to create the test report.
    We intercept failures here to trigger DeFlake.
    """
    # We only care about the actual test execution ('call'), not setup/teardown
    if call.when == "call" and call.excinfo is not None:
        try:
            # 1. Inspect the test item to see if it has a 'page' fixture (Playwright)
            page = item.funcargs.get("page")
            
            if page:
                print("\n\n🚑 [DeFlake] Failure Detected! Capturing context...")
                
                # 2. Capture Context
                timestamp = int(time.time())
                context_dir = os.path.join(os.getcwd(), "deflake_context")
                os.makedirs(context_dir, exist_ok=True)
                
                log_path = os.path.join(context_dir, f"error_{timestamp}.log")
                html_path = os.path.join(context_dir, f"snapshot_{timestamp}.html")
                
                # Save Error Log
                with open(log_path, "w") as f:
                    f.write(str(call.excinfo.value))
                
                # Save HTML Snapshot
                # We need to run this synchronously to ensure file exists before CLI runs
                html_content = page.content()
                with open(html_path, "w") as f:
                    f.write(html_content)
                
                print(f"   📸 Snapshot saved: {html_path}")
                print(f"   📜 Log saved: {log_path}")
                
                # 3. Invoke DeFlake Core CLI
                # We assume the user wants Mock Mode for now based on recent conversation
                # In production, we'd check an env var or config
                print("   🧠 invoking DeFlake Core...")
                
                # Determine path to main.py relative to cwd
                core_script = os.path.join(os.getcwd(), "core", "main.py")
                
                cmd = [
                    sys.executable, core_script,
                    "--log", log_path,
                    "--html", html_path,
                    "--mock" # Force mock mode for now
                ]
                
                subprocess.run(cmd)
                
            else:
                print("\n[DeFlake] Test failed, but no 'page' fixture found. Skipping.")
                
        except Exception as e:
            print(f"\n❌ [DeFlake] Error during healing process: {e}")
