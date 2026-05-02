import hashlib
from itertools import product
from typing import Any, Dict, List, Optional, Set, Tuple

from ml.shopping import build_shopping_links, preset_queries_for_outfit_gaps
from ml.occasion_rules import (
    FORBIDDEN_ANY_YOLO,
    filter_wardrobe_for_occasion,
    validate_and_score,
)

OCCASIONS = [
    "casual_day",
    "office",
    "party",
    "date_night",
    "gym",
    "travel",
    "formal_event",
]

# All YOLO classes (21 + casual where used in wardrobe)
MODEL_CLASSES: Set[str] = {
    "blazer", "boot", "cardigan", "casual", "dress", "formal_shirt", "heel",
    "hoodie", "jeans", "longsleeve", "pullover", "shorts", "skirt", "slide",
    "sneaker", "sport", "sweaters", "sweatshirt", "t-shirt", "top", "trousers", "vest",
}

# --- Strict categorization (single source of truth) ---
UPPERWEAR: Set[str] = {
    "formal_shirt", "t-shirt", "top", "hoodie", "longsleeve", "pullover",
    "sweaters", "sweatshirt", "cardigan", "blazer", "vest", "casual",
}
LOWERWEAR: Set[str] = {"jeans", "trousers", "shorts", "skirt"}
SHOES: Set[str] = {"boot", "heel", "slide", "sneaker", "sport"}
FULL_BODY: Set[str] = {"dress"}

CATEGORY_ALIASES = {
    "top": UPPERWEAR | FULL_BODY,
    "bottom": LOWERWEAR,
    "shoes": SHOES,
    "outerwear": {"blazer", "cardigan", "hoodie", "pullover", "sweaters", "sweatshirt"},
    "accessory": {"watch", "belt", "cap", "bag", "sunglasses"},
}


def _item_class(item: Optional[Dict[str, Any]]) -> str:
    if not item:
        return ""
    return (item.get("category") or "").lower().strip()


def canonical_category(item: Dict[str, Any]) -> str:
    item_cat = _item_class(item)
    item_name = (item.get("display_name") or item.get("name") or "").lower().strip()
    for target, aliases in CATEGORY_ALIASES.items():
        if item_cat in aliases:
            return target
    for target, aliases in CATEGORY_ALIASES.items():
        if any(token in item_name for token in aliases):
            return target
    if item_cat in MODEL_CLASSES:
        return "top"
    return item_cat or "accessory"


def _occasion_label(occ: str) -> str:
    return (occ or "").replace("_", " ").title()


def _norm_gender(g: Optional[str]) -> str:
    v = (g or "").lower().strip()
    if v in ("male", "m", "man", "men"):
        return "male"
    if v in ("female", "f", "woman", "women", "girl"):
        return "female"
    if v in ("other", "nonbinary", "nb", "non-binary"):
        return "other"
    return ""


def _is_female(g: Optional[str]) -> bool:
    return _norm_gender(g) == "female"


def _is_male(g: Optional[str]) -> bool:
    return _norm_gender(g) == "male"


def _shoe_formal_leaning(gender: Optional[str]) -> Set[str]:
    if _is_male(gender):
        return {"boot"}
    if _is_female(gender):
        return {"boot", "heel"}
    return {"boot", "heel"}

COLOR_TO_BASE = {
    "black": "black", "charcoal": "black",
    "white": "white", "cream": "white",
    "gray": "gray",
    "beige": "brown", "tan": "brown", "brown": "brown",
    "maroon": "red", "dark_red": "red", "red": "red", "pink": "red", "orange": "red",
    "yellow": "yellow",
    "olive": "green", "green": "green", "lime": "green", "teal": "green",
    "navy": "blue", "blue": "blue", "sky_blue": "blue", "purple": "blue", "violet": "blue",
}

COLOR_COMPATIBILITY = {
    "black": {"white", "gray", "red", "blue", "green", "brown", "yellow"},
    "white": {"black", "blue", "green", "red", "brown", "gray"},
    "blue": {"white", "black", "gray", "brown"},
    "red": {"black", "white", "gray"},
    "green": {"black", "white", "gray", "brown"},
    "brown": {"white", "black", "blue", "green", "yellow"},
    "yellow": {"black", "blue", "gray"},
    "gray": {"black", "white", "blue", "red", "green", "brown"},
}


def to_base_color(color: Optional[str]) -> str:
    return COLOR_TO_BASE.get((color or "").lower(), (color or "").lower())


def validate_outfit_strict(
    occ: str, outfit: Dict[str, Any], gender: Optional[str] = None
) -> Tuple[List[str], List[str], float, Dict[str, Any]]:
    """Delegates to ml.occasion_rules hybrid scoring (missing −3, forbidden −4, accessory −1)."""
    occ_key = (occ or "casual_day").lower()
    if occ_key not in OCCASIONS:
        return [f"Unknown occasion {occ}"], ["Pick a supported occasion"], 0.0, {"unsupported": True}
    issues, suggestions, score, meta = validate_and_score(occ_key, outfit, gender=gender)
    return issues, suggestions, score, meta


def _pick_best(candidates: List[Dict[str, Any]], allowed: Optional[Set[str]], forbidden: Set[str]) -> Optional[Dict[str, Any]]:
    if not candidates:
        return None
    pool = candidates
    if allowed:
        filtered = [c for c in candidates if _item_class(c) in allowed]
        if filtered:
            pool = filtered
    pool = [c for c in pool if _item_class(c) not in forbidden]
    if not pool:
        return None
    return sorted(
        pool,
        key=lambda it: (-float(it.get("confidence") or 0), str(it.get("_id") or "")),
    )[0]


def group_wardrobe(wardrobe: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    grouped: Dict[str, List[Dict[str, Any]]] = {
        "top": [], "bottom": [], "shoes": [], "outerwear": [], "accessory": [],
    }
    for item in wardrobe:
        if item.get("status") != "available":
            continue
        cat = canonical_category(item)
        if cat in grouped:
            grouped[cat].append(item)
    return grouped


def _pick_preferred_accessory(
    grouped: Dict[str, List[Dict[str, Any]]], preferences: Tuple[str, ...], forb: Set[str]
) -> Optional[Dict[str, Any]]:
    for pref in preferences:
        match = _pick_best([x for x in grouped["accessory"] if _item_class(x) == pref], None, forb)
        if match:
            return match
    return _pick_best(grouped["accessory"], None, forb)


def _closest_match_outfit(
    grouped: Dict[str, List[Dict[str, Any]]],
    occ: str,
    gender: Optional[str],
) -> Tuple[Dict[str, Any], Dict[str, float]]:
    """
    When strict occasion filters rule out every slot, pick best available piece per slot
    (no class filter). Uses full grouped wardrobe.
    """
    del gender  # reserved for future shoe bias
    forb: Set[str] = set()
    outfit: Dict[str, Any] = {}
    scores: Dict[str, float] = {}

    def add(role: str, item: Optional[Dict[str, Any]]) -> None:
        if item:
            outfit[role] = item
            scores[role] = round(float(item.get("confidence") or 0) * 10, 2)

    t = _pick_best(grouped["top"], None, forb)
    b = _pick_best(grouped["bottom"], None, forb)
    sh = _pick_best(grouped["shoes"], None, forb)

    if t:
        add("top", t)
        if _item_class(t) != "dress" and b:
            add("bottom", b)
    elif b:
        add("bottom", b)

    if sh:
        add("shoes", sh)

    if occ in {"party", "date_night", "formal_event", "travel"}:
        acc = _pick_preferred_accessory(grouped, ("watch", "belt", "bag"), forb)
        if acc:
            add("accessory", acc)

    return outfit, scores


def _strict_build_outfit(
    occ: str,
    grouped: Dict[str, List[Dict[str, Any]]],
    gender: Optional[str] = None,
) -> Dict[str, Any]:
    outfit: Dict[str, Any] = {}
    scores: Dict[str, float] = {}
    forb = set(FORBIDDEN_ANY_YOLO.get(occ, set()))

    def add(role: str, item: Optional[Dict[str, Any]]) -> None:
        if item:
            outfit[role] = item
            scores[role] = round(float(item.get("confidence") or 0) * 10, 2)

    party_tops = {
        "blazer",
        "formal_shirt",
        "t-shirt",
        "top",
        "longsleeve",
        "vest",
        "cardigan",
        "sweaters",
        "casual",
        "sweatshirt",
        "hoodie",
        "pullover",
        "dress",
    }
    date_tops = {
        "formal_shirt",
        "longsleeve",
        "blazer",
        "cardigan",
        "sweaters",
        "vest",
        "pullover",
        "top",
        "dress",
    }
    date_bottoms = {"jeans", "trousers", "skirt"}

    if occ == "formal_event":
        t = _pick_best(grouped["top"], {"formal_shirt"}, forb)
        b = _pick_best(grouped["bottom"], {"trousers"}, forb)
        sh = _pick_best(grouped["shoes"], _shoe_formal_leaning(gender), forb)
        if not t or not b or not sh:
            miss = []
            if not t:
                miss.append("formal_shirt")
            if not b:
                miss.append("trousers")
            if not sh:
                miss.append("formal_shoes")
            return {"message": f"Not enough items for occasion '{occ}'", "missing_classes": miss}
        add("top", t)
        add("bottom", b)
        add("shoes", sh)
        acc = _pick_preferred_accessory(grouped, ("watch", "belt"), forb)
        if acc:
            add("accessory", acc)

    elif occ == "office":
        t = _pick_best(grouped["top"], {"formal_shirt", "longsleeve", "top"}, forb)
        b = _pick_best(grouped["bottom"], {"trousers"}, forb)
        sh = _pick_best(grouped["shoes"], {"boot", "heel"}, forb)
        if not t or not b or not sh:
            return {"message": f"Not enough items for occasion '{occ}'", "missing_category": "required_set"}
        add("top", t)
        add("bottom", b)
        add("shoes", sh)

    elif occ == "casual_day":
        t = _pick_best(grouped["top"], {"t-shirt", "hoodie", "sweatshirt", "casual"}, forb)
        b = _pick_best(grouped["bottom"], {"jeans", "shorts", "trousers"}, forb)
        sh = _pick_best(grouped["shoes"], {"sneaker", "sport", "slide"}, forb)
        if not t or not b or not sh:
            return {"message": f"Not enough items for occasion '{occ}'", "missing_category": "required_set"}
        add("top", t)
        add("bottom", b)
        add("shoes", sh)

    elif occ == "party":
        dresses = sorted(
            [x for x in grouped["top"] if _item_class(x) == "dress"],
            key=lambda it: (-float(it.get("confidence") or 0), str(it.get("_id") or "")),
        )
        stylish = sorted(
            [x for x in grouped["top"] if _item_class(x) in party_tops - {"dress"}],
            key=lambda it: (-float(it.get("confidence") or 0), str(it.get("_id") or "")),
        )
        t = dresses[0] if dresses else (stylish[0] if stylish else None)
        if not t:
            return {"message": f"Not enough items for occasion '{occ}'", "missing_category": "top"}
        add("top", t)
        if _item_class(t) != "dress":
            b = _pick_best(grouped["bottom"], {"jeans", "trousers"}, forb)
            if not b:
                return {"message": f"Not enough items for occasion '{occ}'", "missing_category": "bottom"}
            add("bottom", b)
        party_shoes = {"boot", "sneaker", "heel", "sport"}
        if _is_male(gender):
            party_shoes.discard("heel")
        sh = _pick_best(grouped["shoes"], party_shoes, forb)
        if not sh:
            return {"message": f"Not enough items for occasion '{occ}'", "missing_category": "shoes"}
        add("shoes", sh)
        acc = _pick_best(grouped["accessory"], {"watch", "belt", "bag", "cap"}, forb)
        if acc:
            add("accessory", acc)

    elif occ == "date_night":
        dresses = sorted(
            [x for x in grouped["top"] if _item_class(x) == "dress"],
            key=lambda it: (-float(it.get("confidence") or 0), str(it.get("_id") or "")),
        )
        if dresses:
            add("top", dresses[0])
        else:
            t = _pick_best(grouped["top"], date_tops - {"dress"}, forb)
            b = _pick_best(grouped["bottom"], date_bottoms, forb)
            if not t or not b:
                return {"message": f"Not enough items for occasion '{occ}'", "missing_category": "top_or_bottom"}
            add("top", t)
            add("bottom", b)
        sh = _pick_best(grouped["shoes"], _shoe_formal_leaning(gender), forb)
        if not sh:
            return {"message": f"Not enough items for occasion '{occ}'", "missing_category": "shoes"}
        add("shoes", sh)
        acc = _pick_preferred_accessory(grouped, ("watch", "bag"), forb)
        if acc:
            add("accessory", acc)

    elif occ == "gym":
        t = _pick_best(grouped["top"], {"t-shirt"}, forb)
        b = _pick_best(grouped["bottom"], {"shorts", "trousers"}, forb)
        sh = _pick_best(grouped["shoes"], {"sneaker", "sport"}, forb)
        if not t or not b or not sh:
            return {"message": f"Not enough items for occasion '{occ}'", "missing_category": "required_set"}
        add("top", t)
        add("bottom", b)
        add("shoes", sh)

    elif occ == "travel":
        t = _pick_best(grouped["top"], {"t-shirt", "hoodie", "sweatshirt"}, forb)
        b = _pick_best(grouped["bottom"], {"jeans", "trousers"}, forb)
        sh = _pick_best(grouped["shoes"], {"sneaker", "sport"}, forb)
        if not t or not b or not sh:
            return {"message": f"Not enough items for occasion '{occ}'", "missing_category": "required_set"}
        add("top", t)
        add("bottom", b)
        add("shoes", sh)
        acc = _pick_best(grouped["accessory"], {"bag"}, forb)
        if acc:
            add("accessory", acc)

    return {"occasion": occ, "outfit": outfit, "scores": scores}


def _sorted_pool(
    candidates: List[Dict[str, Any]],
    allowed: Optional[Set[str]],
    forbidden: Set[str],
    limit: int,
) -> List[Dict[str, Any]]:
    if not candidates:
        return []
    pool = candidates
    if allowed:
        filtered = [c for c in candidates if _item_class(c) in allowed]
        if filtered:
            pool = filtered
    pool = [c for c in pool if _item_class(c) not in forbidden]
    ranked = sorted(
        pool,
        key=lambda it: (-float(it.get("confidence") or 0), str(it.get("_id") or "")),
    )
    return ranked[: max(1, int(limit))]


def _confidence_scores(outfit: Dict[str, Any]) -> Dict[str, float]:
    scores: Dict[str, float] = {}
    for role in ("top", "bottom", "shoes", "accessory"):
        it = outfit.get(role)
        if it:
            scores[role] = round(float(it.get("confidence") or 0) * 10, 2)
    return scores


def _combo_occasion_rating(
    occ: str, outfit: Dict[str, Any], gender: Optional[str]
) -> Tuple[float, Dict[str, float]]:
    _, _, strict_score, _ = validate_outfit_strict(occ, outfit, gender=gender)
    top = outfit.get("top")
    bottom = outfit.get("bottom")
    shoes = outfit.get("shoes")
    color_score = 0.0
    if top and bottom and _item_class(top) != "dress":
        tb = to_base_color((top or {}).get("color"))
        bb = to_base_color((bottom or {}).get("color"))
        if bb in COLOR_COMPATIBILITY.get(tb, set()):
            color_score += 1.0
    if shoes and bottom:
        sc = to_base_color((shoes or {}).get("color"))
        bc = to_base_color((bottom or {}).get("color"))
        if sc in COLOR_COMPATIBILITY.get(bc, set()):
            color_score += 0.5
    rating = max(
        0.0,
        min(10.0, round(strict_score + min(0.5, color_score * 0.15), 1)),
    )
    return rating, {"strict_score": strict_score, "color_bonus": round(color_score, 2)}


def _fingerprint(outfit: Dict[str, Any]) -> Tuple[str, str, str]:
    def oid(it: Optional[Dict[str, Any]]) -> str:
        if not it:
            return ""
        return str(it.get("_id") or it.get("id") or "")

    return (oid(outfit.get("top")), oid(outfit.get("bottom")), oid(outfit.get("shoes")))


def _rank_strict_outfit_combos(
    occ: str,
    grouped: Dict[str, List[Dict[str, Any]]],
    gender: Optional[str],
    branch_limit: int = 5,
    max_options: int = 5,
) -> List[Dict[str, Any]]:
    """
    Enumerate strict wardrobe combos (small grids per slot), score like rate_outfit,
    return top `max_options` distinct outfits by preview_rating (for UI “next match”).
    """
    forb = set(FORBIDDEN_ANY_YOLO.get(occ, set()))
    raw: List[Tuple[float, Dict[str, Any], Dict[str, float]]] = []

    def push(o: Dict[str, Any]) -> None:
        rating, sub = _combo_occasion_rating(occ, o, gender)
        raw.append((rating, dict(o), sub))

    bl = branch_limit

    if occ == "formal_event":
        tops = _sorted_pool(grouped["top"], {"formal_shirt"}, forb, bl)
        bottoms = _sorted_pool(grouped["bottom"], {"trousers"}, forb, bl)
        shoes = _sorted_pool(grouped["shoes"], _shoe_formal_leaning(gender), forb, bl)
        for t, b, sh in product(tops, bottoms, shoes):
            o: Dict[str, Any] = {"top": t, "bottom": b, "shoes": sh}
            acc = _pick_preferred_accessory(grouped, ("watch", "belt"), forb)
            if acc:
                o["accessory"] = acc
            push(o)

    elif occ == "office":
        tops = _sorted_pool(
            grouped["top"], {"formal_shirt", "longsleeve", "top"}, forb, bl
        )
        bottoms = _sorted_pool(grouped["bottom"], {"trousers"}, forb, bl)
        shoes = _sorted_pool(grouped["shoes"], {"boot", "heel"}, forb, bl)
        for t, b, sh in product(tops, bottoms, shoes):
            push({"top": t, "bottom": b, "shoes": sh})

    elif occ == "casual_day":
        tops = _sorted_pool(
            grouped["top"], {"t-shirt", "hoodie", "sweatshirt", "casual"}, forb, bl
        )
        bottoms = _sorted_pool(
            grouped["bottom"], {"jeans", "shorts", "trousers"}, forb, bl
        )
        shoes = _sorted_pool(
            grouped["shoes"], {"sneaker", "sport", "slide"}, forb, bl
        )
        for t, b, sh in product(tops, bottoms, shoes):
            push({"top": t, "bottom": b, "shoes": sh})

    elif occ == "gym":
        tops = _sorted_pool(grouped["top"], {"t-shirt"}, forb, bl)
        bottoms = _sorted_pool(grouped["bottom"], {"shorts", "trousers"}, forb, bl)
        shoes = _sorted_pool(grouped["shoes"], {"sneaker", "sport"}, forb, bl)
        for t, b, sh in product(tops, bottoms, shoes):
            push({"top": t, "bottom": b, "shoes": sh})

    elif occ == "travel":
        tops = _sorted_pool(
            grouped["top"], {"t-shirt", "hoodie", "sweatshirt"}, forb, bl
        )
        bottoms = _sorted_pool(grouped["bottom"], {"jeans", "trousers"}, forb, bl)
        shoes = _sorted_pool(grouped["shoes"], {"sneaker", "sport"}, forb, bl)
        for t, b, sh in product(tops, bottoms, shoes):
            o = {"top": t, "bottom": b, "shoes": sh}
            acc = _pick_best(grouped["accessory"], {"bag"}, forb)
            if acc:
                o["accessory"] = acc
            push(o)

    elif occ == "party":
        party_tops = {
            "blazer",
            "formal_shirt",
            "t-shirt",
            "top",
            "longsleeve",
            "vest",
            "cardigan",
            "sweaters",
            "casual",
            "sweatshirt",
            "hoodie",
            "pullover",
            "dress",
        }
        dresses = _sorted_pool(
            [x for x in grouped["top"] if _item_class(x) == "dress"],
            None,
            forb,
            bl,
        )
        stylish = _sorted_pool(
            [x for x in grouped["top"] if _item_class(x) in party_tops - {"dress"}],
            None,
            forb,
            bl,
        )
        bottoms = _sorted_pool(grouped["bottom"], {"jeans", "trousers"}, forb, bl)
        party_shoes = {"boot", "sneaker", "heel", "sport"}
        if _is_male(gender):
            party_shoes.discard("heel")
        shoe_list = _sorted_pool(grouped["shoes"], party_shoes, forb, bl)
        for d in dresses:
            for sh in shoe_list:
                o = {"top": d, "shoes": sh}
                acc = _pick_best(
                    grouped["accessory"], {"watch", "belt", "bag", "cap"}, forb
                )
                if acc:
                    o["accessory"] = acc
                push(o)
        for t, b, sh in product(stylish, bottoms, shoe_list):
            o = {"top": t, "bottom": b, "shoes": sh}
            acc = _pick_best(
                grouped["accessory"], {"watch", "belt", "bag", "cap"}, forb
            )
            if acc:
                o["accessory"] = acc
            push(o)

    elif occ == "date_night":
        date_tops = {
            "formal_shirt",
            "longsleeve",
            "blazer",
            "cardigan",
            "sweaters",
            "vest",
            "pullover",
            "top",
            "dress",
        }
        date_bottoms = {"jeans", "trousers", "skirt"}
        shoe_dn = _sorted_pool(grouped["shoes"], {"boot", "heel"}, forb, bl)
        dresses = _sorted_pool(
            [x for x in grouped["top"] if _item_class(x) == "dress"],
            None,
            forb,
            bl,
        )
        for d in dresses:
            for sh in shoe_dn:
                o = {"top": d, "shoes": sh}
                acc = _pick_preferred_accessory(grouped, ("watch", "bag"), forb)
                if acc:
                    o["accessory"] = acc
                push(o)
        tops_nb = _sorted_pool(
            grouped["top"], date_tops - {"dress"}, forb, bl
        )
        bottoms_nb = _sorted_pool(grouped["bottom"], date_bottoms, forb, bl)
        for t, b, sh in product(tops_nb, bottoms_nb, shoe_dn):
            o = {"top": t, "bottom": b, "shoes": sh}
            acc = _pick_preferred_accessory(grouped, ("watch", "bag"), forb)
            if acc:
                o["accessory"] = acc
            push(o)

    else:
        return []

    best_by_fp: Dict[Tuple[str, str, str], Tuple[float, Dict[str, Any], Dict[str, float]]] = {}
    for rating, outfit, sub in raw:
        fp = _fingerprint(outfit)
        prev = best_by_fp.get(fp)
        if prev is None or rating > prev[0]:
            best_by_fp[fp] = (rating, outfit, sub)

    ranked_vals = sorted(best_by_fp.values(), key=lambda x: -x[0])
    out: List[Dict[str, Any]] = []
    for i, (rating, outfit, sub) in enumerate(ranked_vals[:max_options], start=1):
        out.append(
            {
                "rank": i,
                "outfit": outfit,
                "scores": _confidence_scores(outfit),
                "preview_rating": rating,
                "subscores": sub,
            }
        )
    return out


def build_outfit(
    occasion: str, wardrobe: List[Dict[str, Any]], gender: Optional[str] = None
) -> Dict[str, Any]:
    occ = (occasion or "casual_day").lower()
    if occ not in OCCASIONS:
        return {"message": f"Unsupported occasion '{occasion}'", "supported_occasions": OCCASIONS}

    available = [w for w in wardrobe if w.get("status") == "available"]
    if not available:
        return {"message": "No available items in your wardrobe."}

    grouped_full = group_wardrobe(available)
    filtered = filter_wardrobe_for_occasion(available, occ, gender)
    grouped_strict = group_wardrobe(filtered)

    ranked = _rank_strict_outfit_combos(occ, grouped_strict, gender, max_options=5)
    if ranked:
        primary = ranked[0]
        return {
            "occasion": occ,
            "outfit": primary["outfit"],
            "scores": primary["scores"],
            "match_quality": "strict",
            "preview_rating": primary.get("preview_rating"),
            "ranked_options": ranked,
        }

    strict_res = _strict_build_outfit(occ, grouped_strict, gender)
    if strict_res.get("outfit"):
        strict_res["match_quality"] = "strict"
        return strict_res

    relaxed, relaxed_scores = _closest_match_outfit(grouped_full, occ, gender)
    if relaxed:
        return {
            "occasion": occ,
            "outfit": relaxed,
            "scores": relaxed_scores,
            "match_quality": "closest",
            "warnings": [
                strict_res.get("message", "Strict occasion rules could not be fully satisfied."),
                "Using the closest available pieces from your wardrobe for this preview.",
            ],
        }
    return strict_res


def rate_outfit(
    occasion: str, outfit: Dict[str, Any], gender: Optional[str] = None
) -> Dict[str, Any]:
    occ = (occasion or "casual_day").lower()
    occ_phrase = occ.replace("_", " ")
    label = _occasion_label(occ)

    if not outfit or not isinstance(outfit, dict):
        issues: List[str] = [f"No outfit provided for {label}"]
        suggestions: List[str] = [
            "Add top, bottom, and shoes matching the occasion rules",
        ]
        gap_presets = preset_queries_for_outfit_gaps(occ, {}, gender)
        shopping_products = build_shopping_links(
            suggestions,
            gender=gender,
            preset_queries=gap_presets,
        )
        print("SUGGESTIONS:", suggestions)
        print(
            "RATE_OUTFIT shopping_products:",
            len(shopping_products),
            "non_empty=",
            any(len(g.get("products") or []) > 0 for g in shopping_products),
        )
        print("SHOPPING_PRODUCTS:", shopping_products)
        if (suggestions or gap_presets) and not any(
            len(g.get("products") or []) > 0 for g in shopping_products
        ):
            print("WARNING: no shopping link groups returned")
        return {
            "rating": 0.0,
            "score": 0.0,
            "feedback": f"Outfit is incomplete for {occ_phrase}.",
            "issues": issues,
            "suggestions": suggestions,
            "shopping_products": shopping_products,
            "improved_outfit": {},
        }

    strict_issues, strict_suggestions, strict_score, strict_meta = validate_outfit_strict(
        occ, outfit, gender=gender
    )

    top = outfit.get("top")
    bottom = outfit.get("bottom")
    shoes = outfit.get("shoes")
    top_color = to_base_color((top or {}).get("color"))
    bottom_color = to_base_color((bottom or {}).get("color"))
    shoes_color = to_base_color((shoes or {}).get("color"))

    color_notes: List[str] = []
    color_score = 0.0
    if top and bottom and _item_class(top) != "dress":
        if bottom_color in COLOR_COMPATIBILITY.get(top_color, set()):
            color_score += 1.0
        else:
            color_notes.append("Top and bottom colors may clash")
    if shoes and bottom:
        if shoes_color in COLOR_COMPATIBILITY.get(bottom_color, set()):
            color_score += 0.5
        else:
            color_notes.append("Shoes could align better with the bottom")

    # Final rating: strict dominates; small color adjustment
    rating = max(0.0, min(10.0, round(strict_score + min(0.5, color_score * 0.15), 1)))

    issues = list(strict_issues) + color_notes
    suggestions = list(strict_suggestions)
    if color_notes and not any("neutral" in s for s in suggestions):
        suggestions.append("Try neutral tones for easier pairing")

    top_name = (top or {}).get("display_name", "top")
    bottom_name = (bottom or {}).get("display_name", "bottom")
    shoes_name = (shoes or {}).get("display_name", "shoes")

    if not strict_issues and not color_notes:
        feedback = (
            f"Strong match for {label}: {top_name}, {bottom_name}, {shoes_name}. "
            "Meets strict occasion rules."
        )
    elif strict_issues:
        feedback = (
            f"Needs fixes for {label}: " + "; ".join(strict_issues[:3])
            + ("." if len(strict_issues) <= 3 else f" (+{len(strict_issues) - 3} more).")
        )
    else:
        feedback = f"Mostly fits {label}; refine colors for a sharper look."

    signature = f"{occ}:{top_name}:{bottom_name}:{shoes_name}:{rating}"
    tone_idx = int(hashlib.md5(signature.encode("utf-8")).hexdigest(), 16) % 2
    if tone_idx and not strict_issues:
        feedback = f"Well-structured outfit for {label}. {feedback}"

    improved = dict(outfit)
    if occ in {"party", "date_night", "formal_event"} and not improved.get("accessory"):
        improved["accessory"] = {"display_name": "watch", "category": "watch", "color": "black"}

    gap_presets = preset_queries_for_outfit_gaps(occ, outfit, gender)
    shopping_products = build_shopping_links(
        suggestions,
        gender=gender,
        preset_queries=gap_presets,
    )
    print("SUGGESTIONS:", suggestions)
    print(
        "RATE_OUTFIT shopping_products:",
        len(shopping_products),
        "non_empty=",
        any(len(g.get("products") or []) > 0 for g in shopping_products),
    )
    print("SHOPPING_PRODUCTS:", shopping_products)
    if (suggestions or gap_presets) and not any(
        len(g.get("products") or []) > 0 for g in shopping_products
    ):
        print("WARNING: no shopping link groups returned")

    return {
        "rating": rating,
        "score": rating,
        "feedback": feedback,
        "subscores": {
            "strict_score": strict_score,
            "color_bonus": round(color_score, 2),
            "rules_engine": strict_meta,
        },
        "issues": issues,
        "suggestions": suggestions,
        "shopping_products": shopping_products,
        "improved_outfit": improved,
        "source": "rules",
    }


def recommend_outfit(wardrobe: List[Dict[str, Any]], occasion: str) -> Dict[str, Any]:
    result = build_outfit(occasion, wardrobe)
    if "outfit" not in result:
        return result
    outfit = result["outfit"]
    return {
        "top": outfit.get("top"),
        "bottom": outfit.get("bottom"),
        "shoes": outfit.get("shoes"),
        "meta": {
            "occasion": result.get("occasion"),
            "scores": result.get("scores", {}),
            "match_quality": result.get("match_quality"),
            "warnings": result.get("warnings"),
            "preview_rating": result.get("preview_rating"),
            "ranked_options": result.get("ranked_options"),
        },
    }
