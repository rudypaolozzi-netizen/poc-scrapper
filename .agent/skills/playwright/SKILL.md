---
name: playwright
description: Skill for web automation and scraping using Playwright. Use this skill when you need to interact with web pages, take screenshots, or extract data from complex web applications.
---

# Playwright Skill

This skill allows the agent to use Playwright for web automation and scraping.

## Key Capabilities
- **Browser Automation**: Launch Chromium, Firefox, or WebKit.
- **Web Scraping**: Extract text, attributes, and content from any website.
- **Interactions**: Click, type, and submit forms.
- **Screenshots & PDFs**: Capture visual representations of web pages.
- **Testing**: Run end-to-end tests for web applications.

## Usage Guidelines
1. **Installation**: Ensure `playwright` is installed in the project (`npm install playwright`).
2. **Browsers**: Install necessary browsers using `npx playwright install`.
3. **Execution**: Use `node` to run scripts that utilize the Playwright library.

## Best Practices
- Use `await page.waitForSelector()` to ensure elements are ready.
- Clean up resources by calling `await browser.close()`.
- Use headless mode for background tasks unless debugging.
