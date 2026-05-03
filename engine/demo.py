#!/usr/bin/env python3
"""Demo run: sample wardrobe → top outfits + shopping suggestions."""

from engine.models import ClothingItem, Wardrobe
from engine.compatibility import score_outfit
from engine.generator import generate_outfits
from engine.shopping import suggest_purchases
from engine.simulation import count_possible_outfits
from engine.indian_ecommerce import get_buy_links

# --- Sample Wardrobe (prices in ₹) ---
sample_items = [
    ClothingItem(1, "upperwear", "white", "casual", 599, name="White Cotton Tee"),
    ClothingItem(2, "upperwear", "navy", "smart_casual", 2499, name="Navy Blazer"),
    ClothingItem(3, "upperwear", "black", "streetwear", 1299, name="Black Hoodie"),
    ClothingItem(4, "lowerwear", "blue", "casual", 1499, name="Denim Jeans"),
    ClothingItem(5, "lowerwear", "khaki", "smart_casual", 1799, name="Chinos"),
    ClothingItem(6, "lowerwear", "grey", "sporty", 999, status="laundry", name="Grey Joggers"),
    ClothingItem(7, "shoes", "white", "casual", 2499, name="White Sneakers"),
    ClothingItem(8, "shoes", "brown", "formal", 3999, name="Chelsea Boots"),
    ClothingItem(9, "accessory", "brown", "casual", 1499, name="Leather Watch"),
]

wardrobe = Wardrobe(sample_items)

# --- Stats ---
print("=" * 60)
print("FITFLOW RECOMMENDATION ENGINE — DEMO")
print("=" * 60)
print(f"\nWardrobe: {len(wardrobe.items)} items ({len(wardrobe.available_items)} available)")
print(f"Category breakdown: {wardrobe.category_counts}")
print(f"Possible outfit combinations: {count_possible_outfits(wardrobe)}")

# --- Top Outfits ---
print("\n" + "-" * 60)
print("TOP 5 OUTFITS")
print("-" * 60)
top_outfits = generate_outfits(wardrobe, top_k=5)
for i, outfit in enumerate(top_outfits, 1):
    items_str = " + ".join(f"{item.name}" for item in outfit.items)
    total = sum(item.price for item in outfit.items)
    print(f"  #{i} [score={outfit.score:.2f}] {items_str} (₹{total:,.0f})")

# --- Shopping Suggestions ---
budget = 3000.0
print(f"\n" + "-" * 60)
print(f"SHOPPING SUGGESTIONS (budget: ₹{budget:,.0f})")
print("-" * 60)
suggestions = suggest_purchases(wardrobe, budget=budget)
if suggestions:
    for item, impact in suggestions:
        print(f"\n  → {item.name} ({item.category}, ₹{item.price:,.0f}) — +{impact} outfit combos")
        if item.buy_links:
            for platform, url in item.buy_links.items():
                print(f"    🛒 {platform}: {url}")
else:
    print("  No suggestions within budget.")

print("\n" + "=" * 60)
print("Done.")
