# DeFlake: Roadmap to Production (2026)

We have successfully built the **MVP (Minimum Viable Product)**. The core logic works, we catch errors, and we show fixes.
Now we need to turn this into a **Commercial Product**.

## Phase 5: The "Magic" (Auto-Patching)
Currently, DeFlake suggests a fix, but the user has to copy-paste it.
**Goal**: Make DeFlake modify the source code automatically.
- [ ] **Smart AST Parsing**: Use `libcst` or `ast` to safely locate the specific line in `tests/test_login.py`.
- [ ] **Safety Checks**: Run the test *immediately* after patching. If it fails, revert the change.
- [ ] **Interactive CLI**: `Do you want to apply this patch? [y/N]`

## Phase 6: The "Business" (Cloud & Auth)
Currently, the Dashboard is local (`localhost`). To sell this to teams, we need a Cloud Dashboard.
- [ ] **Cloud Backend**: Deploy FastAPI to AWS Lambda or Railway.
- [ ] **Authentication**: Add User Login (Supabase or Clerk).
- [ ] **API Key Management**: Users generate *their own* API keys to use in their CI/CD pipelines.

## Phase 7: The "Expansion" (More Adapters)
Python is great, but 70% of the market uses JavaScript/TypeScript.
- [ ] **Node.js Adapter**: Support for Cypress and Playwright-JS.
- [ ] **Java Adapter**: Support for Selenium/Java.

## Immediate Decision
Which path do you want to prioritize?
1.  **Refine the Product** (Phase 5): Make usage smoother for the individual developer.
2.  **Build the Business** (Phase 6): Prepare the infrastructure to charge money.
