from itertools import product
from typing import List
from .models import Wardrobe, Outfit
from .compatibility import score_outfit


def generate_outfits(wardrobe: Wardrobe, top_k: int = 5, include_accessories: bool = True) -> List[Outfit]:
    uppers = wardrobe.available_by_category("upperwear")
    lowers = wardrobe.available_by_category("lowerwear")
    shoes = wardrobe.available_by_category("shoes")

    if not uppers or not lowers or not shoes:
        return []

    accessories = wardrobe.available_by_category("accessory") if include_accessories else []

    outfits = []

    # Generate all valid upper+lower+shoes combos
    for u, l, s in product(uppers, lowers, shoes):
        # Without accessory
        base_items = [u, l, s]
        outfit = Outfit(items=base_items)
        score_outfit(outfit)
        outfits.append(outfit)

        # With each accessory
        for acc in accessories:
            outfit_acc = Outfit(items=base_items + [acc])
            score_outfit(outfit_acc)
            outfits.append(outfit_acc)

    outfits.sort(key=lambda o: o.score, reverse=True)
    return outfits[:top_k]
