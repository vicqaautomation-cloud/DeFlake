# 🎓 Junior Dev: From Zero to DeFlake 🚀

Welcome to the team! This guide will walk you through setting up a professional **Playwright** project with **TypeScript** and the **Page Object Model (POM)** pattern, and finally integrating our internal AI tool, **DeFlake**.

---

## 🛠️ Phase 1: Create the Project

Open your terminal and follow these steps to scaffold a brand new project.

### 1. Initialize Playwright
Run the installation command. When asked, select **TypeScript**, and say "Yes" to downloading browsers.
```bash
# Create a new directory and init project
mkdir MyFirstAutomation
cd MyFirstAutomation
npm init playwright@latest
# 👉 Select 'TypeScript'
# 👉 Select 'true' for 'Put your end-to-end tests in ./tests'
# 👉 Select 'false' for 'Add a GitHub Actions workflow' (for now)
# 👉 Select 'true' for 'Install Playwright browsers'
```

### 2. Verify Installation
Run the example tests to make sure everything works.
```bash
npx playwright test
```

---

## 🏗️ Phase 2: Implement Page Object Model (POM)

We don't write spaghetti code here! Let's organize our tests using POM.

### 1. Create the `pages` directory
```bash
mkdir pages
```

### 2. Create a Login Page Object (`pages/LoginPage.ts`)
Creates a class that represents the Login Page logic.
```typescript
import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // ❌ INTENTIONAL ERROR: Using a weak selector to trigger DeFlake later!
    this.usernameInput = page.locator('#user-name-broken'); 
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#login-button');
  }

  async goto() {
    await this.page.goto('https://www.saucedemo.com/');
  }

  async login(username: string, pass: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(pass);
    await this.loginButton.click();
  }
}
```

### 3. Create the Test (`tests/login.spec.ts`)
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('SauceDemo Login', () => {
    test('should login successfully', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.goto();
      await loginPage.login('standard_user', 'secret_sauce');
      
      // Verify we are redirected (Product page)
      await expect(page).toHaveURL(/.*inventory.html/);
    });
});
```

---

## 🔮 Phase 3: Integrate DeFlake (Local Mode)

Now, let's connect our AI to fix that intentional bug (the wrong selector).

### 1. Link DeFlake
Since we are developing DeFlake locally, we use `npm link`.
```bash
# Link the local tool to this project
npm link deflake
```

### 2. Configure Environment
Set your API keys so DeFlake can talk to the brain.
```bash
# Mac / Linux
export DEFLAKE_API_KEY="clave-maestra"
export DEFLAKE_API_URL="http://localhost:8000/api/deflake"
```

### 3. Run the Magic ✨
Run your test wrapped with DeFlake.
```bash
npx deflake npx playwright test
```

### 4. Observe the Result
The test will fail (because of `#user-name-broken`). DeFlake should:
1.  **Intercept the failure**.
2.  **Analyze the DOM** (detecting the real username field).
3.  **Suggest the Fix:**
    ```javascript
    // Fixed Code
    this.usernameInput = page.locator('#user-name'); // or [data-test="username"]
    ```

---

Good look! 🚀
