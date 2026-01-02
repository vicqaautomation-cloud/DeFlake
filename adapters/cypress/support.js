// This file connects to the Cypress runner in the browser
// Import this in your cypress/support/e2e.js or support file

afterEach(function () {
    if (this.currentTest.state === 'failed') {
        cy.document().then((doc) => {
            const html = doc.documentElement.outerHTML;
            const error = this.currentTest.err.message;
            const testTitle = this.currentTest.title;
            // @ts-ignore
            const testFile = Cypress.spec.relative;

            // Send to Node process via cy.task
            cy.task('deflakeHeal', {
                html,
                error,
                testTitle,
                testFile
            }).then((fix) => {
                if (fix) {
                    // We can log it to the Command Log as well
                    Cypress.log({
                        name: 'DeFlake',
                        message: `💡 Fix Found: ${fix}`,
                        consoleProps: () => ({ fix })
                    });
                }
            });
        });
    }
});
