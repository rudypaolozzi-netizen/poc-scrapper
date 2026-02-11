import asyncio
import csv
import re
import logging
import argparse
from playwright.async_api import async_playwright
import httpx
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential

# Configuration par défaut
DEFAULT_SECTOR = "Coiffeur"
DEFAULT_CITY = "Bordeaux"
DEFAULT_GOAL = 3
OUTPUT_FILE = "liste_email.csv"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

class QueueLogger(logging.Handler):
    def __init__(self, queue):
        super().__init__()
        self.queue = queue

    def emit(self, record):
        try:
            msg = self.format(record)
            self.queue.put_nowait({
                "type": "log",
                "data": {
                    "level": record.levelname,
                    "message": msg
                }
            })
        except Exception:
            self.handleError(record)

EMAIL_REGEX = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
PHONE_REGEX = r'(?:(?:\+|00)33|0)[1-9](?:[\s.-]*\d{2}){4}'

async def extract_contact_info_from_website(client, url):
    """Tente d'extraire un email et un téléphone d'un site web via httpx."""
    if not url or not url.startswith("http"):
        return {"email": None, "telephone": None}
    
    result = {"email": None, "telephone": None}
    try:
        logger.info(f"Visiting website: {url}")
        response = await client.get(url, timeout=20.0, follow_redirects=True)
        response.raise_for_status()
        
        # Extract Email
        emails = re.findall(EMAIL_REGEX, response.text)
        valid_emails = [e for e in emails if not e.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'))]
        if valid_emails:
            result["email"] = valid_emails[0].rstrip('.')
        
        # Extract Phone
        phones = re.findall(PHONE_REGEX, response.text)
        if phones:
            result["telephone"] = phones[0].replace(' ', '').replace('.', '').replace('-', '')

        if result["email"] and result["telephone"]:
            return result

        soup = BeautifulSoup(response.text, "html.parser")
        contact_links = []
        for a in soup.find_all('a', href=True):
            href = a['href'].lower()
            text = a.text.lower()
            if any(k in href or k in text for k in ['contact', 'mentions', 'legal', 'propos', 'about']):
                link = a['href']
                if not link.startswith("http"):
                    from urllib.parse import urljoin
                    link = urljoin(url, link)
                contact_links.append(link)
        
        for link in list(set(contact_links))[:3]:
            try:
                sub_res = await client.get(link, timeout=15.0, follow_redirects=True)
                
                if not result["email"]:
                    emails = re.findall(EMAIL_REGEX, sub_res.text)
                    valid_emails = [e for e in emails if not e.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'))]
                    if valid_emails:
                        result["email"] = valid_emails[0].rstrip('.')
                
                if not result["telephone"]:
                    phones = re.findall(PHONE_REGEX, sub_res.text)
                    if phones:
                        result["telephone"] = phones[0].replace(' ', '').replace('.', '').replace('-', '')
                
                if result["email"] and result["telephone"]:
                    break
            except:
                continue
                
    except Exception as e:
        logger.warning(f"Could not scrape {url}: {e}")
    return result

async def handle_cookies(page):
    """Gère le bouton de refus des cookies de Google."""
    try:
        await asyncio.sleep(2)
        reject_selectors = [
            'button:has-text("Tout refuser")',
            'button:has-text("Reject all")',
            'button[aria-label="Tout refuser"]',
            'button[aria-label="Reject all"]',
            'div[role="none"] button:nth-child(1)'
        ]
        for selector in reject_selectors:
            btn = page.locator(selector)
            if await btn.count() > 0:
                logger.info(f"Refusing cookies with: {selector}")
                await btn.first.scroll_into_view_if_needed()
                await btn.first.click()
                await asyncio.sleep(2)
                return True
    except Exception as e:
        logger.debug(f"Cookie rejection failed: {e}")
    return False

async def run_scraper(args, queue=None):
    handler = None
    if queue:
        handler = QueueLogger(queue)
        formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

    try:

    if args.source == "maps":
        search_query = f"{args.sector} {args.city}"
    else:
        search_query = args.sector
        
    logger.info(f"Démarrage de la recherche ({args.source}) pour : '{search_query}' (Objectif: {args.limit} résultats)")

    results = []
    found_emails_count = 0
    processed_websites = set()
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            locale="fr-FR"
        )
        page = await context.new_page()
        
        if args.source == "maps":
            url = f"https://www.google.com/maps/search/{search_query.replace(' ', '+')}"
            await page.goto(url)
            await asyncio.sleep(4)
            await handle_cookies(page)
            
            feed_selectors = ['div[role="feed"]', 'div[aria-label^="Résultats pour"]', 'div.m67q6026', 'div[role="main"]']
            feed_selector = None
            for selector in feed_selectors:
                try:
                    await page.wait_for_selector(selector, timeout=8000)
                    feed_selector = selector
                    break
                except:
                    continue
            
            if not feed_selector:
                logger.error("Impossible de trouver le flux de résultats.")
                await browser.close()
                return

            async with httpx.AsyncClient(http2=True, verify=False, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"}) as client:
                for iteration in range(20):
                    if found_emails_count >= args.limit:
                        break
                    
                    try:
                        await page.locator(feed_selector).evaluate("el => el.scrollTop += 2000")
                    except:
                        await page.mouse.wheel(0, 2000)
                    await asyncio.sleep(3)
                    
                    cards = await page.locator('div[role="article"]').all()
                    for card in cards:
                        if found_emails_count >= args.limit:
                            break
                        try:
                            await card.click()
                            await asyncio.sleep(2)
                            
                            nom_elem = page.locator('h1.DUwDvf')
                            if await nom_elem.count() == 0: continue
                            nom = await nom_elem.text_content()
                            
                            website_locator = page.locator('a[data-item-id="authority"]')
                            website = ""
                            if await website_locator.count() > 0:
                                website = await website_locator.get_attribute("href")
                            
                            if website and website not in processed_websites:
                                processed_websites.add(website)
                                contacts = await extract_contact_info_from_website(client, website)
                                if contacts["email"]:
                                    logger.info(f"TROUVÉ: {nom} -> {contacts['email']} / {contacts['telephone']}")
                                    results.append({"nom": nom, "website": website, "email": contacts["email"], "telephone": contacts["telephone"]})
                                    found_emails_count += 1
                                    
                                    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
                                        writer = csv.DictWriter(f, fieldnames=["nom", "website", "email", "telephone"])
                                        writer.writeheader()
                                        writer.writerows(results)
                                    
                                    if queue:
                                        queue.put_nowait({
                                            "type": "result",
                                            "data": {"nom": nom, "website": website, "email": contacts["email"], "telephone": contacts["telephone"]}
                                        })
                        except:
                            continue
        else:
            # LinkedIn Source via DuckDuckGo HTML (httpx, pas de CAPTCHA)
            from urllib.parse import unquote, urlparse, parse_qs
            
            query = f"linkedin company {search_query}"
            ddg_url = f"https://html.duckduckgo.com/html/?q={query.replace(' ', '+')}"
            logger.info(f"Recherche LinkedIn via DuckDuckGo HTML : '{query}'")
            
            linkedin_urls = []
            try:
                ddg_response = httpx.get(ddg_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}, follow_redirects=True, timeout=15)
                ddg_soup = BeautifulSoup(ddg_response.text, 'html.parser')
                
                for a_tag in ddg_soup.find_all('a', href=True):
                    href = a_tag['href']
                    # Extraire l'URL réelle depuis les redirections DDG
                    if 'uddg=' in href:
                        actual_url = unquote(href.split('uddg=')[1].split('&')[0])
                    else:
                        actual_url = href
                    
                    if 'linkedin.com/company/' in actual_url:
                        title = a_tag.get_text(strip=True) or "Inconnu"
                        if actual_url not in [u["url"] for u in linkedin_urls]:
                            logger.info(f"LinkedIn Company trouvée : {title} -> {actual_url}")
                            linkedin_urls.append({"url": actual_url, "title": title})
            except Exception as e:
                logger.error(f"Erreur DuckDuckGo HTML : {e}")
            
            logger.info(f"{len(linkedin_urls)} pages LinkedIn Company trouvées.")
            
            async with httpx.AsyncClient(http2=True, verify=False, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"}) as client:
                for item in linkedin_urls:
                    if found_emails_count >= args.limit:
                        break
                    
                    href = item["url"]
                    nom = item["title"].split(" |")[0].split(" -")[0].strip()  # Nettoyage du titre
                    
                    try:
                        # Visite la page LinkedIn Company avec Playwright
                        logger.info(f"Visite de la page LinkedIn : {href}")
                        await page.goto(href, timeout=15000)
                        await asyncio.sleep(3)
                        
                        # Extraction du nom depuis la page (plus fiable)
                        nom_elem = page.locator('h1')
                        if await nom_elem.count() > 0:
                            page_nom = await nom_elem.first.text_content()
                            if page_nom and page_nom.strip():
                                nom = page_nom.strip()
                        
                        # Extraction du site web depuis LinkedIn
                        website = ""
                        # Chercher les liens externes (pas linkedin.com)
                        all_links = await page.locator('a[href^="http"]').all()
                        for a_link in all_links:
                            a_href = await a_link.get_attribute("href")
                            if a_href and "linkedin.com" not in a_href and "microsoft.com" not in a_href:
                                a_text = await a_link.text_content() or ""
                                if any(kw in a_text.lower() for kw in ["site", "website", "visiter", "visit"]):
                                    website = a_href
                                    break
                        
                        # Si pas trouvé via le texte, chercher dans le HTML brut
                        if not website:
                            page_content = await page.content()
                            # Chercher des URLs dans le contenu qui ne sont pas linkedin
                            ext_urls = re.findall(r'https?://(?!.*linkedin\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s"<]*)?', page_content)
                            # Filtrer les URLs utiles
                            for ext_url in ext_urls:
                                if any(d in ext_url for d in ["google.com", "microsoft.com", "facebook.com", "twitter.com", "youtube.com", "cdn.", "static."]):
                                    continue
                                website = ext_url.split('"')[0].split("'")[0]
                                break
                        
                        if website:
                            logger.info(f"Site web trouvé pour {nom} : {website}")
                        else:
                            logger.warning(f"Aucun site web trouvé pour {nom}")
                        
                        if website and website not in processed_websites:
                            processed_websites.add(website)
                            contacts = await extract_contact_info_from_website(client, website)
                            if contacts["email"]:
                                logger.info(f"TROUVÉ (via LinkedIn): {nom} -> {contacts['email']} / {contacts['telephone']}")
                                results.append({"nom": nom, "website": website, "email": contacts["email"], "telephone": contacts["telephone"]})
                                found_emails_count += 1
                                
                                with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
                                    writer = csv.DictWriter(f, fieldnames=["nom", "website", "email", "telephone"])
                                    writer.writeheader()
                                    writer.writerows(results)
                                
                                if queue:
                                    queue.put_nowait({
                                        "type": "result",
                                        "data": {"nom": nom, "website": website, "email": contacts["email"], "telephone": contacts["telephone"]}
                                    })
                    except Exception as e:
                        logger.warning(f"Erreur sur LinkedIn ({nom}): {e}")
                        continue

        await browser.close()
        logger.info(f"Terminé. {found_emails_count} emails extraits dans {OUTPUT_FILE}.")

        if queue:
            queue.put_nowait({
                "type": "done", 
                "data": {"message": f"Terminé. {found_emails_count} emails extraits.", "total": found_emails_count}
            })
    except Exception as e:
        logger.error(f"Erreur fatale: {e}")
        if queue:
            queue.put_nowait({"type": "error", "data": {"message": str(e)}})
    finally:
        if queue and handler:
            logger.removeHandler(handler)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Recherche d'entreprises locales et extraction d'emails via Google Maps.")
    parser.add_argument("--sector", default=DEFAULT_SECTOR, help=f"Secteur d'activité (défaut: {DEFAULT_SECTOR})")
    parser.add_argument("--city", default=DEFAULT_CITY, help=f"Ville de recherche (défaut: {DEFAULT_CITY})")
    parser.add_argument("--limit", type=int, default=DEFAULT_GOAL, help=f"Nombre d'emails à trouver (défaut: {DEFAULT_GOAL})")
    parser.add_argument("--source", choices=["maps", "linkedin"], default="maps", help="Source de données (maps ou linkedin)")
    args = parser.parse_args()
    asyncio.run(run_scraper(args))
