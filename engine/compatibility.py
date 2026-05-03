from typing import Tuple, Union
from .models import Outfit

# --- Color Compatibility ---

NEUTRAL_COLORS = {"black", "white", "grey", "gray", "beige", "cream", "navy", "khaki", "tan"}

COMPLEMENTARY_PAIRS = {
    frozenset({"red", "green"}), frozenset({"blue", "orange"}),
    frozenset({"yellow", "purple"}), frozenset({"navy", "khaki"}),
    frozenset({"olive", "burgundy"}), frozenset({"teal", "coral"}),
}

HARMONIOUS_GROUPS = [
    {"blue", "navy", "teal", "cyan"},
    {"red", "burgundy", "maroon", "pink"},
    {"green", "olive", "sage", "forest"},
    {"brown", "tan", "beige", "khaki", "camel"},
    {"grey", "gray", "charcoal", "silver"},
]


def _normalize_color(color: Union[str, Tuple[int, int, int]]) -> str:
    if isinstance(color, (tuple, list)):
        r, g, b = color
        if max(r, g, b) < 50:
            return "black"
        if min(r, g, b) > 200:
            return "white"
        if r > g and r > b:
            return "red"
        if g > r and g > b:
            return "green"
        return "blue"
    return color.lower().strip()


def _color_compatibility(colors: list) -> float:
    if len(colors) <= 1:
        return 1.0

    normalized = [_normalize_color(c) for c in colors]
    neutrals = [c for c in normalized if c in NEUTRAL_COLORS]
    non_neutrals = [c for c in normalized if c not in NEUTRAL_COLORS]

    # All neutrals = safe but not exciting
    if not non_neutrals:
        return 0.8

    # Check if non-neutrals are from same harmonious group
    for group in HARMONIOUS_GROUPS:
        if all(c in group for c in non_neutrals):
            return 0.9

    # Check complementary pairs
    if len(non_neutrals) == 2:
        pair = frozenset(non_neutrals)
        if pair in COMPLEMENTARY_PAIRS:
            return 0.85

    # Single accent color + neutrals
    if len(set(non_neutrals)) == 1 and neutrals:
        return 0.9

    # Multiple unrelated colors = clash
    unique_non_neutrals = set(non_neutrals)
    if len(unique_non_neutrals) > 2:
        return 0.3
    return 0.5


# --- Style Compatibility ---

STYLE_COMPAT = {
    ("casual", "casual"): 1.0,
    ("formal", "formal"): 1.0,
    ("sporty", "sporty"): 1.0,
    ("streetwear", "streetwear"): 1.0,
    ("smart_casual", "smart_casual"): 1.0,
    ("casual", "smart_casual"): 0.8,
    ("formal", "smart_casual"): 0.7,
    ("casual", "sporty"): 0.5,
    ("casual", "streetwear"): 0.7,
    ("sporty", "streetwear"): 0.6,
    ("formal", "sporty"): 0.2,
    ("formal", "streetwear"): 0.2,
    ("formal", "casual"): 0.3,
}


def _style_pair_score(s1: str, s2: str) -> float:
    s1, s2 = s1.lower().strip(), s2.lower().strip()
    if s1 == s2:
        return 1.0
    return STYLE_COMPAT.get((s1, s2), STYLE_COMPAT.get((s2, s1), 0.4))


def _style_consistency(styles: list) -> float:
    if len(styles) <= 1:
        return 1.0
    total, count = 0.0, 0
    for i in range(len(styles)):
        for j in range(i + 1, len(styles)):
            total += _style_pair_score(styles[i], styles[j])
            count += 1
    return total / count if count else 1.0


# --- Category completeness ---

REQUIRED_CATEGORIES = {"upperwear", "lowerwear", "shoes"}


def _category_completeness(categories: set) -> float:
    normalized = {c.lower() for c in categories}
    present = REQUIRED_CATEGORIES & normalized
    base = len(present) / len(REQUIRED_CATEGORIES)

    # Bonus for accessory
    if "accessory" in normalized or "accessories" in normalized:
        base = min(1.0, base + 0.05)
    return base


# --- Main Scoring ---

WEIGHTS = {"color": 0.30, "category": 0.40, "style": 0.30}


def score_outfit(outfit: Outfit) -> float:
    colors = [item.color for item in outfit.items]
    styles = [item.style for item in outfit.items]
    categories = outfit.categories

    color_score = _color_compatibility(colors)
    cat_score = _category_completeness(categories)
    style_score = _style_consistency(styles)

    total = (
        WEIGHTS["color"] * color_score
        + WEIGHTS["category"] * cat_score
        + WEIGHTS["style"] * style_score
    )

    outfit.score = round(total, 4)
    return outfit.score
