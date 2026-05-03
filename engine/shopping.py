from typing import List, Tuple
from .models import Wardrobe, ClothingItem
from .simulation import simulate_add_item, count_possible_outfits
from .indian_ecommerce import get_buy_links

# Candidate items a user might buy — Indian e-commerce catalog (prices in ₹)
# buy_links are generated dynamically in suggest_purchases() with budget-based price filters
DEFAULT_CATALOG = [
    ClothingItem(id=1001, category="upperwear", color="white", style="casual", price=599, name="Men Solid White T-Shirt"),
    ClothingItem(id=1002, category="upperwear", color="navy", style="formal", price=1499, name="Oxford Cotton Shirt"),
    ClothingItem(id=1003, category="upperwear", color="black", style="streetwear", price=1299, name="Printed Graphic Hoodie"),
    ClothingItem(id=1004, category="upperwear", color="olive", style="casual", price=899, name="Oversized Polo T-Shirt"),
    ClothingItem(id=1005, category="lowerwear", color="blue", style="casual", price=1199, name="Slim Fit Denim Jeans"),
    ClothingItem(id=1006, category="lowerwear", color="khaki", style="smart_casual", price=1399, name="Chino Pants"),
    ClothingItem(id=1007, category="lowerwear", color="black", style="formal", price=1799, name="Tailored Formal Trousers"),
    ClothingItem(id=1008, category="lowerwear", color="grey", style="sporty", price=999, name="Track Pants Joggers"),
    ClothingItem(id=1009, category="shoes", color="white", style="casual", price=2499, name="White Casual Sneakers"),
    ClothingItem(id=1010, category="shoes", color="brown", style="formal", price=3499, name="Leather Oxford Shoes"),
    ClothingItem(id=1011, category="shoes", color="black", style="sporty", price=2999, name="Running Sports Shoes"),
    ClothingItem(id=1012, category="accessory", color="brown", style="casual", price=499, name="Leather Belt"),
    ClothingItem(id=1013, category="accessory", color="silver", style="formal", price=2499, name="Analog Wrist Watch"),
    ClothingItem(id=1014, category="accessory", color="black", style="streetwear", price=399, name="Snapback Cap"),
    ClothingItem(id=1015, category="accessory", color="black", style="casual", price=799, name="Aviator Sunglasses"),
]


def _detect_gaps(wardrobe: Wardrobe) -> dict:
    counts = wardrobe.category_counts
    gaps = {}
    for cat in ["upperwear", "lowerwear", "shoes"]:
        count = counts.get(cat, 0)
        if count == 0:
            gaps[cat] = "missing"
        elif count < 2:
            gaps[cat] = "low_variety"
    if counts.get("accessory", 0) == 0:
        gaps["accessory"] = "missing"
    return gaps


def suggest_purchases(
    wardrobe: Wardrobe,
    budget: float,
    catalog: List[ClothingItem] = None,
    max_suggestions: int = 5,
) -> List[Tuple[ClothingItem, int]]:
    if catalog is None:
        catalog = DEFAULT_CATALOG

    # Filter catalog: under budget, not already owned (by name)
    owned_names = {i.name for i in wardrobe.items}
    candidates = [c for c in catalog if c.price <= budget and c.name not in owned_names]

    gaps = _detect_gaps(wardrobe)

    scored: List[Tuple[ClothingItem, int]] = []
    for item in candidates:
        impact = simulate_add_item(wardrobe, item)

        # Boost items that fill gaps
        if item.category in gaps:
            if gaps[item.category] == "missing":
                impact += 50  # strong boost for missing category
            else:
                impact += 10  # mild boost for low variety

        # Generate buy links with budget-based price filter
        item.buy_links = get_buy_links(item.name, item.category, max_price=int(budget))

        scored.append((item, impact))

    scored.sort(key=lambda x: (-x[1], x[0].price))
    return scored[:max_suggestions]
