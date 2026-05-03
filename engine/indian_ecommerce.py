"""Indian e-commerce integration — generates search/buy links for Myntra, Flipkart, AJIO."""

from urllib.parse import quote_plus
from typing import Dict, List, Optional


PLATFORMS = {
    "myntra": {
        "name": "Myntra",
        "base_url": "https://www.myntra.com",
        "search_url": "https://www.myntra.com/{query}?f=price:Rs.%20100%20to%20Rs.%20{max_price}",
        "categories": ["upperwear", "lowerwear", "shoes", "accessory", "outerwear"],
    },
    "flipkart": {
        "name": "Flipkart",
        "base_url": "https://www.flipkart.com",
        "search_url": "https://www.flipkart.com/search?q={query}&p[]=facets.price_range.from%3D100&p[]=facets.price_range.to%3D{max_price}",
        "categories": ["upperwear", "lowerwear", "shoes", "accessory", "outerwear"],
    },
    "ajio": {
        "name": "AJIO",
        "base_url": "https://www.ajio.com",
        "search_url": "https://www.ajio.com/search/?text={query}&priceRange=100-{max_price}",
        "categories": ["upperwear", "lowerwear", "shoes", "accessory", "outerwear"],
    },
}

# Category → search keyword suffix for better results
CATEGORY_KEYWORDS = {
    "upperwear": "men shirt tshirt top",
    "lowerwear": "men jeans trousers pants",
    "shoes": "men shoes footwear sneakers",
    "accessory": "men accessories watch belt",
    "outerwear": "men jacket coat outerwear",
}


def generate_search_url(platform_key: str, product_name: str, category: str = "", max_price: Optional[int] = None) -> str:
    platform = PLATFORMS.get(platform_key)
    if not platform:
        return ""
    # Append category keywords for better search relevance
    search_term = product_name
    if category and category in CATEGORY_KEYWORDS:
        search_term = f"{product_name} {CATEGORY_KEYWORDS[category]}"
    query = quote_plus(search_term)
    price = max_price or 5000
    return platform["search_url"].format(query=query, max_price=price)


def get_buy_links(product_name: str, category: str = "", max_price: Optional[int] = None) -> Dict[str, str]:
    links = {}
    for key, platform in PLATFORMS.items():
        if not category or category in platform["categories"]:
            links[platform["name"]] = generate_search_url(key, product_name, category, max_price)
    return links


def get_all_platform_links(product_name: str, category: str = "", max_price: Optional[int] = None) -> List[Dict[str, str]]:
    return [
        {"platform": p["name"], "url": generate_search_url(k, product_name, category, max_price)}
        for k, p in PLATFORMS.items()
    ]
