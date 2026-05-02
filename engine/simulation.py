from .models import Wardrobe, ClothingItem


def count_possible_outfits(wardrobe: Wardrobe) -> int:
    uppers = len(wardrobe.available_by_category("upperwear"))
    lowers = len(wardrobe.available_by_category("lowerwear"))
    shoes = len(wardrobe.available_by_category("shoes"))
    accessories = len(wardrobe.available_by_category("accessory"))

    base = uppers * lowers * shoes
    # Each base outfit can go with no accessory or one accessory
    return base * (1 + accessories)


def simulate_add_item(wardrobe: Wardrobe, item: ClothingItem) -> int:
    current = count_possible_outfits(wardrobe)
    wardrobe.add(item)
    new_count = count_possible_outfits(wardrobe)
    wardrobe.remove(item.id)
    return new_count - current
