from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Union


@dataclass
class ClothingItem:
    id: int
    category: str  # upperwear, lowerwear, shoes, accessory
    color: Union[str, Tuple[int, int, int]]
    style: str  # casual, formal, sporty, streetwear, smart_casual
    price: float  # in ₹ (INR)
    status: str = "available"  # available / laundry
    name: str = ""
    buy_links: Dict[str, str] = field(default_factory=dict)  # {platform: url}

    @property
    def is_available(self) -> bool:
        return self.status == "available"


@dataclass
class Outfit:
    items: List[ClothingItem] = field(default_factory=list)
    score: float = 0.0

    @property
    def categories(self) -> set:
        return {item.category for item in self.items}

    @property
    def total_price(self) -> float:
        return sum(item.price for item in self.items)

    def __repr__(self) -> str:
        names = [f"{i.name or i.category}({i.color}/{i.style})" for i in self.items]
        return f"Outfit(score={self.score:.2f}, items=[{', '.join(names)}])"


class Wardrobe:
    def __init__(self, items: Optional[List[ClothingItem]] = None):
        self._items: List[ClothingItem] = items or []

    def add(self, item: ClothingItem):
        self._items.append(item)

    def remove(self, item_id: int):
        self._items = [i for i in self._items if i.id != item_id]

    @property
    def items(self) -> List[ClothingItem]:
        return list(self._items)

    @property
    def available_items(self) -> List[ClothingItem]:
        return [i for i in self._items if i.is_available]

    def by_category(self, category: str) -> List[ClothingItem]:
        return [i for i in self._items if i.category == category]

    def available_by_category(self, category: str) -> List[ClothingItem]:
        return [i for i in self.available_items if i.category == category]

    @property
    def category_counts(self) -> dict:
        counts = {}
        for item in self.available_items:
            counts[item.category] = counts.get(item.category, 0) + 1
        return counts
