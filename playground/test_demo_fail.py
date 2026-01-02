from playwright.sync_api import Page, expect

def test_login_failure(page: Page):
    """
    A test that tries to click a button that has changed ID,
    triggering a failure and the DeFlake plugin.
    """
    # 1. Load our dummy local page
    # In a real scenario, this would be a URL http://localhost:3000
    # For this demo, we can just load the file directly or set content
    
    cwd = __file__.replace("/test_demo_fail.py", "")
    # Assuming index.html is in the same folder (playground)
    page.goto(f"file://{cwd}/index.html")
    
    # 2. Try to click the button using the OLD selector
    # The actual HTML has class="btn-primary-2026", but we look for #submit-button
    print("\nAttempting to click '#submit-button' (which does not exist)...")
    
    # We set a short timeout so we don't wait 30s
    page.click("#submit-button", timeout=2000) 
