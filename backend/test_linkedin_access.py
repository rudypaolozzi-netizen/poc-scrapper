import asyncio
from playwright.async_api import async_playwright

async def test_linkedin():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        try:
            # Testing a public company page
            url = "https://www.linkedin.com/company/google/"
            print(f"Visiting {url}...")
            await page.goto(url, wait_until="networkidle")
            title = await page.title()
            print(f"Page title: {title}")
            
            # Check if login wall is present
            if "S'identifier" in title or "Login" in title or "Sign In" in title:
                print("L'accès est bloqué par une page de connexion.")
            else:
                print("La page semble accessible sans connexion.")
                
            await page.screenshot(path="linkedin_test.png")
            print("Capture d'écran sauvegardée sous linkedin_test.png")
            
        except Exception as e:
            print(f"Erreur : {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_linkedin())
