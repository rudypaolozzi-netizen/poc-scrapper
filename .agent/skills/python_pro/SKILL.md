---
name: python_pro_async_patterns
description: Advanced patterns for asynchronous Python development, specifically for building high-performance scrapers and web automations. Includes asyncio, httpx, playwright-python, error handling, and project structure.
---

# Python Pro / Async Python Patterns

This skill provides patterns and best practices for writing professional-grade asynchronous Python code.

## Key Patterns

### 1. Asynchronous I/O with `asyncio`
- Use `async with` for resource management (sessions, browsers).
- Use `asyncio.gather()` for concurrent requests, but be mindful of rate limiting.
- Avoid blocking calls; use `run_in_executor` if synchronous libraries are necessary.

### 2. High-Performance Scraping
- **`httpx`**: Preferred for HTTP requests due to its built-in async support and HTTP/2 capabilities.
- **`playwright-python`**: Used for SPA or sites requiring JavaScript execution.
- **`BeautifulSoup4`**: For parsing, used within the async loop (note: parsing itself is CPU-bound).

### 3. Robust Error Handling
- **Retries**: Use `tenacity` for declarative retry logic.
- **Timeouts**: Always set timeouts on network calls to prevent hanging.
- **Specific Exceptions**: Catch specific errors (e.g., `httpx.HTTPStatusError`, `playwright.async_api.TimeoutError`) rather than bare `except:`.

### 4. Project Structure
```text
project/
├── .agent/skills/   # Agent skills
├── src/             # Source code
│   ├── scraper.py   # Main logic
│   └── utils.py     # Shared utilities
├── tests/           # Unit and integration tests
├── requirements.txt
└── README.md
```

## Example Pattern: Async Scraper Template

```python
import asyncio
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def fetch_url(client, url):
    response = await client.get(url, timeout=10.0)
    response.raise_for_status()
    return response.text

async def main():
    urls = ["https://example.com", "https://httpbin.org/get"]
    async with httpx.AsyncClient() as client:
        tasks = [fetch_url(client, url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for result in results:
            if isinstance(result, Exception):
                print(f"Error: {result}")
            else:
                print(f"Fetched {len(result)} bytes")

if __name__ == "__main__":
    asyncio.run(main())
```
