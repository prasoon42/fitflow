"""
Production occasion rules: 21 conceptual clothing buckets mapped from YOLO / wardrobe categories.

Used for: wardrobe filtering before build_outfit, strict validation, hybrid scoring.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Set, Tuple

# --- YOLO model class names (detect.py / wardrobe category field) ---
YOLO_CLASSES = frozenset(
    {
        "blazer",
        "boot",
        "cardigan",
        "casual",
        "dress",
        "formal_shirt",
        "heel",
        "hoodie",
        "jeans",
        "longsleeve",
        "shorts",
        "skirt",
        "slide",
        "sneaker",
        "sport",
        "sweaters",
        "sweatshirt",
        "t-shirt",
        "top",
        "trousers",
        "vest",
        "pullover",
    }
)

# --- 21 user-facing buckets (canonical) ---
BUCKET_TOP = frozenset(
    {"tshirt", "shirt", "formal_shirt", "polo", "hoodie", "sweater", "jacket"}
)
BUCKET_BOTTOM = frozenset({"jeans", "trousers", "chinos", "shorts", "skirt"})
BUCKET_SHOES = frozenset({"sneakers", "formal_shoes", "boots", "heels", "sandals"})
BUCKET_ACCESSORY = frozenset({"watch", "belt", "bag", "cap"})

# Map each detector class → single bucket (polo inferred from name when category is top).
YOLO_TO_BUCKET: Dict[str, str] = {
    "t-shirt": "tshirt",
    "sweatshirt": "tshirt",
    "casual": "tshirt",
    "longsleeve": "shirt",
    "top": "shirt",
    "formal_shirt": "formal_shirt",
    "hoodie": "hoodie",
    "sweaters": "sweater",
    "pullover": "sweater",
    "cardigan": "sweater",
    "blazer": "jacket",
    "vest": "jacket",
    "jeans": "jeans",
    "trousers": "trousers",
    "shorts": "shorts",
    "skirt": "skirt",
    "sneaker": "sneakers",
    "sport": "sneakers",
    "boot": "boots",
    "heel": "heels",
    "slide": "sandals",
    "dress": "dress",
}


def _item_class_raw(item: Optional[Dict[str, Any]]) -> str:
    if not item:
        return ""
    return (item.get("category") or "").lower().strip()


def item_bucket(item: Optional[Dict[str, Any]]) -> str:
    """
    Map wardrobe item to one of the 21 buckets (or 'dress', 'unknown', accessory literals).
    """
    if not item:
        return ""
    cat = _item_class_raw(item)
    name = (item.get("display_name") or item.get("name") or "").lower()

    if cat in BUCKET_ACCESSORY or cat in {"sunglasses"}:
        if cat == "sunglasses":
            return "cap"
        return cat if cat in BUCKET_ACCESSORY else "cap"

    if cat == "dress":
        return "dress"

    if cat == "top":
        if "polo" in name:
            return "polo"
        if any(x in name for x in ("tee", "t-shirt", "tshirt", "graphic", "casual tee")):
            return "tshirt"
        return "shirt"

    return YOLO_TO_BUCKET.get(cat, cat or "unknown")


def is_formal_shoe_bucket(item: Optional[Dict[str, Any]]) -> bool:
    """Formal dress shoes: boots or heels (YOLO has no separate oxford class)."""
    b = item_bucket(item)
    return b in {"boots", "heels"}


def is_formal_shoe_yolo(cat: str) -> bool:
    return cat in {"boot", "heel"}


# ----- Wardrobe filter: only items allowed for ANY slot on this occasion -----
FORBIDDEN_ANY_BUCKET: Dict[str, Set[str]] = {
    "formal_event": {"tshirt", "hoodie", "shorts", "sneakers", "sandals", "polo"},
    "office": {"shorts", "sandals", "cap"},
    "party": set(),
    "date_night": {"tshirt", "shorts", "sneakers"},
    "casual_day": {"formal_shoes"},
    "gym": {"jeans", "boots", "heels"},
    "travel": {"heels"},
}

FORBIDDEN_ANY_YOLO: Dict[str, Set[str]] = {
    "formal_event": {"t-shirt", "hoodie", "shorts", "sneaker", "sport", "slide", "casual", "sweatshirt"},
    "office": {"shorts", "slide", "jeans"},
    "party": set(),
    "date_night": {"t-shirt", "shorts", "sneaker", "sport"},
    "casual_day": {"boot", "heel"},
    "gym": {"jeans", "boot", "heel", "blazer", "formal_shirt"},
    "travel": {"heel"},
}


def filter_wardrobe_for_occasion(
    wardrobe: List[Dict[str, Any]],
    occasion: str,
    gender: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Drop items that can never belong on this occasion (strict pipeline)."""
    occ = (occasion or "").lower()
    fb_bucket = FORBIDDEN_ANY_BUCKET.get(occ, set())
    fb_yolo = FORBIDDEN_ANY_YOLO.get(occ, set())
    out: List[Dict[str, Any]] = []
    for item in wardrobe:
        if item.get("status") != "available":
            continue
        cat = _item_class_raw(item)
        bk = item_bucket(item)
        if bk in fb_bucket:
            continue
        if cat in fb_yolo:
            continue
        if occ == "formal_event" and bk == "cap":
            continue
        if occ == "office" and cat == "cap":
            continue
        if occ == "date_night" and cat in {"sneaker", "sport"}:
            continue
        if occ == "gym" and cat in {"jeans", "boot", "heel", "blazer", "formal_shirt"}:
            continue
        g = (gender or "").lower()
        if occ == "formal_event" and bk == "heels" and g in ("male", "m", "man", "men"):
            continue
        if occ == "office" and cat in {"t-shirt", "jeans", "hoodie"}:
            continue
        if occ == "date_night" and cat in {"hoodie", "sweatshirt", "hoodie"}:
            continue
        if occ == "date_night" and cat in {"t-shirt", "sweatshirt", "casual"}:
            continue
        out.append(item)
    return out


# ----- Scoring weights (production hybrid) -----
PENALTY_MISSING_REQUIRED = 3.0
PENALTY_FORBIDDEN = 4.0
PENALTY_ACCESSORY = 1.0
BONUS_PERFECT = 1.0
SCORE_MAX = 10.0


def _norm_gender(g: Optional[str]) -> str:
    v = (g or "").lower().strip()
    if v in ("male", "m", "man", "men"):
        return "male"
    if v in ("female", "f", "woman", "women", "girl"):
        return "female"
    return ""


def _occ_label(occ: str) -> str:
    return (occ or "").replace("_", " ").title()


_SUPPORTED_OCC = frozenset(
    {"formal_event", "office", "party", "date_night", "casual_day", "gym", "travel"}
)


def validate_and_score(
    occasion: str,
    outfit: Dict[str, Any],
    gender: Optional[str] = None,
) -> Tuple[List[str], List[str], float, Dict[str, Any]]:
    """
    Strict rule checks + smart suggestions + hybrid score (10 max).
    Returns (issues, suggestions, score, debug_meta).
    """
    occ = (occasion or "casual_day").lower()
    if occ not in _SUPPORTED_OCC:
        return (
            [f"Unknown occasion {occasion}"],
            ["Pick a supported occasion"],
            0.0,
            {"unsupported": True},
        )
    label = _occ_label(occ)
    g = _norm_gender(gender)
    top, bottom, shoes, acc = (
        outfit.get("top"),
        outfit.get("bottom"),
        outfit.get("shoes"),
        outfit.get("accessory"),
    )
    issues: List[str] = []
    suggestions: List[str] = []
    missing_n = 0
    forbidden_n = 0
    accessory_penalty = False

    def add_missing(msg: str, sugg: str) -> None:
        nonlocal missing_n
        missing_n += 1
        issues.append(msg)
        suggestions.append(sugg)

    def add_forbidden(msg: str, sugg: str) -> None:
        nonlocal forbidden_n
        forbidden_n += 1
        issues.append(msg)
        suggestions.append(sugg)

    ct, cb, cs = _item_class_raw(top), _item_class_raw(bottom), _item_class_raw(shoes)
    bt, bb, bs = item_bucket(top), item_bucket(bottom), item_bucket(shoes)
    acc_cat = _item_class_raw(acc)
    has_accessory = bool(acc and acc_cat)

    # ---- formal_event: formal_shirt, trousers, formal_shoes; forbidden tshirt, hoodie, shorts, sneakers, sandals, cap
    if occ == "formal_event":
        for item, role in ((top, "top"), (bottom, "bottom"), (shoes, "shoes")):
            if not item:
                add_missing(
                    f"Missing {role} for {label}",
                    "Add formal_shirt, tailored trousers, and dress shoes (boots or heels)" if role == "top" else f"Add required {role} for {label}",
                )
        if top and ct != "formal_shirt":
            add_forbidden(
                f"Formal Event requires formal_shirt; found {ct or bt}",
                "Replace with a formal_shirt for black-tie or formal settings",
            )
        if bottom and cb != "trousers":
            add_forbidden(
                f"Formal Event requires trousers; found {cb}",
                "Replace with tailored trousers (chinos map to the same class here)",
            )
        if shoes:
            if not is_formal_shoe_yolo(cs):
                add_forbidden(
                    f"Formal Event requires dress shoes (boots/heels); found {cs}",
                    "Replace sneakers or sandals with leather boots or heels",
                )
            if g == "male" and cs == "heel":
                add_forbidden("Heels are atypical for mens formal; use dress boots", "Replace heels with leather boots")
        if acc and acc_cat == "cap":
            add_forbidden("Cap is not appropriate for formal event", "Remove cap or use a watch or leather belt instead")
        for cls in (ct, cb, cs):
            if cls in {"t-shirt", "hoodie", "shorts", "sneaker", "sport", "slide"}:
                add_forbidden(
                    f"Item class {cls} is forbidden for {label}",
                    f"Replace {cls} with an allowed formal piece for {label}",
                )

    # ---- office: shirt|formal_shirt / trousers|chinos / formal_shoes|boots
    elif occ == "office":
        if not top:
            add_missing(f"Missing top for {label}", "Add formal_shirt or longsleeve dress shirt for office")
        elif ct in {"t-shirt", "hoodie", "sweatshirt", "casual"}:
            add_forbidden(
                f"Office needs shirt or formal_shirt family; found {ct}",
                "Replace with formal_shirt or longsleeve (not a tee or hoodie)",
            )
        elif ct in {"formal_shirt", "longsleeve"}:
            pass
        elif ct == "top":
            if bt == "tshirt":
                add_forbidden("T-shirt is not valid office top in strict rules", "Use formal_shirt or longsleeve")
        else:
            add_forbidden(
                f"Office allows formal_shirt, longsleeve, or dress-shirt-style top; found {ct}",
                "Replace with formal_shirt or longsleeve",
            )

        if not bottom:
            add_missing(f"Missing bottom for {label}", "Add trousers or chinos (wardrobe class trousers)")
        elif cb != "trousers":
            add_forbidden(
                f"Office requires trousers or chinos only; found {cb}",
                "Replace jeans or shorts with tailored trousers",
            )

        if not shoes:
            add_missing(f"Missing shoes for {label}", "Add formal leather boots or equivalent dress shoes")
        elif cs not in {"boot", "heel"}:
            add_forbidden(
                f"Office requires formal_shoes or boots; found {cs}",
                "Replace sneakers or sandals with leather boots",
            )
        if acc and acc_cat == "cap":
            add_forbidden("Caps are forbidden for office (strict)", "Remove cap or switch to watch or belt")

    # ---- party: shirt|tshirt|jacket + jeans|trousers + boots|sneakers|heels; accessory bonus penalty if absent
    elif occ == "party":
        is_dress = bool(top and ct == "dress")
        if not top:
            add_missing(f"Missing top for {label}", "Add a shirt, tee, blazer, or dress")
        elif not is_dress:
            allowed_party_top = {
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
            }
            if ct not in allowed_party_top:
                add_forbidden(
                    f"Party top should be shirt, tee, sweater, or jacket class; found {ct}",
                    "Try blazer, formal_shirt, t-shirt, or longsleeve",
                )
            if not bottom:
                add_missing(f"Missing bottom for {label}", "Add jeans or trousers")
            elif cb not in {"jeans", "trousers"}:
                add_forbidden(
                    f"Party pairing uses jeans or trousers; found {cb}",
                    "Swap for jeans or slim trousers",
                )
        if not shoes:
            add_missing(f"Missing shoes for {label}", "Add boots, sneakers, or heels")
        elif cs not in {"boot", "sneaker", "heel", "sport"}:
            add_forbidden(
                f"Party footwear should be boots, sneakers, or heels; found {cs}",
                "Replace with boots or clean sneakers for the party",
            )
        if not has_accessory:
            accessory_penalty = True
            issues.append(f"Add at least one accessory for {label} (watch, belt, or bag)")
            suggestions.append("Add a watch, belt, or crossbody bag to complete the party look")

    # ---- date_night: shirt|jacket|sweater, jeans|trousers|skirt, boots|heels; sneakers forbidden; watch|bag required
    elif occ == "date_night":
        is_dress = bool(top and ct == "dress")
        allowed_dn_top = {
            "formal_shirt",
            "longsleeve",
            "blazer",
            "cardigan",
            "sweaters",
            "vest",
            "pullover",
            "top",
        }
        if not top:
            add_missing(f"Missing top for {label}", "Add a shirt, sweater, jacket, or dress")
        elif is_dress:
            pass
        elif ct in {"t-shirt", "hoodie", "sweatshirt", "casual"} or bt == "tshirt":
            add_forbidden(
                f"Date night needs a sharper top than {ct}",
                "Use formal_shirt, longsleeve, blazer, sweater, or structured top — not a casual tee",
            )
        elif ct not in allowed_dn_top:
            add_forbidden(
                f"Date night top should read polished; found {ct}",
                "Swap for formal_shirt, blazer, sweater, or longsleeve",
            )

        if top and not is_dress:
            if not bottom:
                add_missing(f"Missing bottom for {label}", "Add jeans, trousers, or a skirt")
            elif cb not in {"jeans", "trousers", "skirt"}:
                add_forbidden(
                    f"Date night bottom should be jeans, trousers, or skirt; found {cb}",
                    "Replace shorts with trousers or a skirt",
                )

        if not shoes:
            add_missing(f"Missing shoes for {label}", "Add boots or heels for date night")
        elif cs in {"sneaker", "sport"}:
            add_forbidden(
                "Sneakers are forbidden for Date Night (strict)",
                "Replace sneakers with ankle boots or heels",
            )
        elif cs not in {"boot", "heel"}:
            add_forbidden(
                f"Date Night allows boots or heels only; found {cs}",
                "Wear boots or heels instead of sandals or slides",
            )

        name_a = (acc.get("display_name") or "").lower() if acc else ""
        has_watch_or_bag = acc_cat in {"watch", "bag"} or any(
            x in name_a for x in ("watch", "bag", "clutch", "crossbody")
        )
        if not has_watch_or_bag:
            accessory_penalty = True
            issues.append(f"Date Night expects a watch or bag for {label}")
            suggestions.append("Add a classic watch or an evening bag")

    # ---- casual_day
    elif occ == "casual_day":
        if not top:
            add_missing(f"Missing top for {label}", "Add a tee, hoodie, or polo")
        elif bt not in {"tshirt", "hoodie", "polo"} and ct not in {"t-shirt", "hoodie", "sweatshirt", "casual"}:
            add_forbidden(
                f"Casual day expects relaxed tops; found {ct}",
                "Use a t-shirt, hoodie, or polo",
            )
        if not bottom:
            add_missing(f"Missing bottom for {label}", "Add jeans, shorts, or chinos")
        elif bb not in {"jeans", "shorts", "trousers"} and cb not in {"jeans", "shorts", "trousers"}:
            add_forbidden(
                f"Casual bottom should be jeans, shorts, or chinos; found {cb}",
                "Swap for jeans or chinos",
            )
        if not shoes:
            add_missing(f"Missing shoes for {label}", "Add sneakers or sandals")
        elif cs not in {"sneaker", "sport", "slide"}:
            add_forbidden(
                f"Casual day expects sneakers or sandals; found {cs}",
                "Replace dress shoes with sneakers or slides",
            )
        if cs in {"boot", "heel"}:
            add_forbidden("Formal shoes are discouraged on Casual Day", "Wear sneakers or sandals instead")

    # ---- gym
    elif occ == "gym":
        if not top:
            add_missing(f"Missing top for {label}", "Add a performance tee (t-shirt)")
        elif ct != "t-shirt":
            add_forbidden(f"Gym top should be a tee/tank (mapped to t-shirt); found {ct}", "Use a breathable t-shirt")
        if not bottom:
            add_missing(f"Missing bottom for {label}", "Add shorts or joggers")
        elif cb not in {"shorts", "trousers"}:
            add_forbidden(
                f"Gym expects shorts or joggers (trousers); found {cb}",
                "Swap jeans for shorts or joggers",
            )
        if not shoes:
            add_missing(f"Missing shoes for {label}", "Add trainers (sneakers)")
        elif cs not in {"sneaker", "sport"}:
            add_forbidden(
                f"Gym requires trainers (sneakers); found {cs}",
                "Replace with running sneakers",
            )
        for cls in (ct, cb, cs):
            if cls in {"jeans", "boot", "heel", "blazer", "formal_shirt"}:
                add_forbidden(f"{cls} is not appropriate for gym", f"Remove {cls} for training")

    # ---- travel
    elif occ == "travel":
        if not top:
            add_missing(f"Missing top for {label}", "Add a t-shirt or hoodie for travel")
        elif ct not in {"t-shirt", "hoodie", "sweatshirt"}:
            add_forbidden(
                f"Travel works best with tee or hoodie; found {ct}",
                "Pack a t-shirt or hoodie",
            )
        if not bottom:
            add_missing(f"Missing bottom for {label}", "Add jeans or chinos")
        elif cb not in {"jeans", "trousers"}:
            add_forbidden(
                f"Travel expects jeans or chinos; found {cb}",
                "Use jeans or chinos for comfort",
            )
        if not shoes:
            add_missing(f"Missing shoes for {label}", "Add sneakers for walking")
        elif cs not in {"sneaker", "sport"}:
            add_forbidden(
                f"Travel wants sneakers; found {cs}",
                "Wear supportive sneakers for transit",
            )
        if cs == "heel":
            add_forbidden("Heels are discouraged for travel comfort", "Switch to sneakers")
        if has_accessory and acc_cat == "bag":
            pass
        elif not has_accessory:
            suggestions.append("Bonus: add a crossbody bag or backpack for travel")

    # Dedupe suggestions
    seen: Set[str] = set()
    deduped: List[str] = []
    for s in suggestions:
        if s not in seen:
            seen.add(s)
            deduped.append(s)
    suggestions = deduped

    score = SCORE_MAX
    score -= PENALTY_MISSING_REQUIRED * missing_n
    score -= PENALTY_FORBIDDEN * forbidden_n
    if accessory_penalty:
        score -= PENALTY_ACCESSORY
    if missing_n == 0 and forbidden_n == 0 and not accessory_penalty:
        score = min(SCORE_MAX, score + BONUS_PERFECT)

    score = max(0.0, min(SCORE_MAX, round(score, 1)))
    if not top and not bottom and not shoes:
        score = 0.0

    meta = {
        "missing_required_count": missing_n,
        "forbidden_count": forbidden_n,
        "accessory_penalty": accessory_penalty,
    }
    return issues, suggestions, score, meta


def clothing_fit_buckets_doc() -> Dict[str, Any]:
    """API/helper: describe bucket taxonomy."""
    return {
        "tops": sorted(BUCKET_TOP),
        "bottoms": sorted(BUCKET_BOTTOM),
        "footwear": sorted(BUCKET_SHOES),
        "accessories": sorted(BUCKET_ACCESSORY),
        "yolo_to_bucket": dict(sorted(YOLO_TO_BUCKET.items())),
    }
