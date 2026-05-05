import hashlib
import os
from itertools import product
from typing import Any, Dict, List, Optional, Set, Tuple

from ml.shopping import build_shopping_links, preset_queries_for_outfit_gaps
from ml.occasion_rules import (
    FORBIDDEN_ANY_YOLO,
    filter_wardrobe_for_occasion,
    validate_and_score,
)

# --- Groq AI Feedback Integration ---
try:
    from groq import Groq as _GroqClient
    _GROQ_KEY = os.getenv("GROQ_API_KEY", "").strip()
    if _GROQ_KEY:
        _groq_client = _GroqClient(api_key=_GROQ_KEY)
        print("✅ Groq AI feedback: ENABLED (llama-3.3-70b-versatile)")
    else:
        _groq_client = None
        print("ℹ️  Groq AI feedback: DISABLED (no GROQ_API_KEY in .env)")
except ImportError:
    _groq_client = None
    print("⚠️  groq not installed — run: pip install groq")


def _call_groq(prompt: str, max_tokens: int = 400, system_prompt: Optional[str] = None) -> Optional[str]:
    """Generic Groq call. Returns raw text or None on failure."""
    if not _groq_client:
        return None
    try:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        resp = _groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            max_tokens=max_tokens,
            temperature=0.8,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq error: {e}")
        return None


def _parse_bullets(text: str, header: str) -> List[str]:
    """Extract bullet list under a header from structured Groq output."""
    lines = text.split("\n")
    collecting = False
    results = []
    for line in lines:
        if header.lower() in line.lower():
            collecting = True
            continue
        if collecting:
            stripped = line.strip().lstrip("-•* ").strip()
            if stripped and not stripped.endswith(":"):
                # Stop at next section header
                if any(h in line for h in ["Rating:", "Feedback:", "Issues:", "Suggestions:", "Why ", "Explain"]):
                    break
                results.append(stripped)
            elif not stripped:
                continue
    return results


# All 22 YOLO clothing classes the model recognizes
_YOLO_CLASSES = (
    "blazer, cardigan, dress, formal_shirt, hoodie, jeans, longsleeve, pullover, "
    "shorts, skirt, slide, sneaker, sport (shoes), sweaters, sweatshirt, vest, "
    "boot, casual, heel, slide, sneaker, sport"
)


def _fmt_wardrobe(wardrobe: Optional[List[Dict]] = None) -> str:
    """Format wardrobe items into a compact readable list for Groq prompts."""
    if not wardrobe:
        return "(not provided)"
    lines = []
    for item in wardrobe[:30]:  # cap at 30 to stay within token limits
        cat = item.get("category") or item.get("label", "?")
        color = item.get("color", "?")
        name = item.get("display_name") or item.get("name") or f"{color} {cat}"
        lines.append(f"  - {name} ({cat}, {color})")
    return "\n".join(lines) if lines else "(empty wardrobe)"


def _generate_groq_feedback(
    occasion: str,
    top_name: str,
    bottom_name: str,
    shoes_name: str,
    colors: str,
    accessories: str,
    rating_10: float,
    rule_score_breakdown: Dict[str, Any],
    issues: List[str],
    rule_suggestions: List[str],
    gender: Optional[str] = None,
    wardrobe: Optional[List[Dict]] = None,
) -> Dict[str, Any]:
    """
    🎯 Prompt 1: Structured outfit analysis with wardrobe-aware suggestions.
    Returns dict with keys: feedback, ai_issues, ai_suggestions, ai_rating
    """
    gender_note = f"The wearer identifies as {gender}." if gender else ""
    wardrobe_block = _fmt_wardrobe(wardrobe)
    
    score_100 = rule_score_breakdown.get("total_100", 0)
    occ_pts = rule_score_breakdown.get("occasion_pts", 0)
    style_pts = rule_score_breakdown.get("style_pts", 0)
    color_pts = rule_score_breakdown.get("color_pts", 0)
    compat_pts = rule_score_breakdown.get("compat_pts", 0)

    system_prompt = """You are a strict fashion scoring engine.

Your job is to evaluate outfits based on predefined fashion rules.
You must return a structured score out of 100.

----------------------------------------
SCORING BREAKDOWN:

1. Occasion Fit (0–50)
- Perfect match with occasion → 45–50
- Acceptable → 30–44
- Weak → 10–29
- Completely inappropriate → 0–9

2. Style Compatibility (0–20)
- Items match well stylistically → 15–20
- Neutral → 8–14
- Clashing styles → 0–7

3. Outfit Combination (0–15)
- Good pairings (e.g., t-shirt + jeans) → 10–15
- Average → 5–9
- Bad combinations → 0–4

4. Color Harmony (0–15)
- Complementary / neutral → 10–15
- Okay → 5–9
- Clashing → 0–4

----------------------------------------
OCCASION RULES:

FORMAL EVENT:
- Allowed: blazer, formal_shirt, trousers, skirt, heel, boot
- Penalize: t-shirt, hoodie, shorts, sneaker, slide
- Strict scoring

OFFICE:
- Allowed: formal_shirt, blazer, cardigan, trousers
- Neutral: jeans, plain t-shirt
- Penalize: hoodie, shorts, slides

CASUAL:
- Most items allowed
- Slight penalty for overly formal outfits

PARTY:
- Stylish outfits preferred
- Penalize overly basic outfits

DATE NIGHT:
- Smart casual / semi-formal preferred
- Penalize sloppy or too casual items

GYM:
- Only sport, shorts, t-shirt, sneakers
- Heavy penalty for formal wear

TRAVEL:
- Comfort prioritized
- Penalize uncomfortable footwear (heels)

----------------------------------------
COMBINATION RULES:

Good combinations:
- blazer + formal_shirt → high score
- t-shirt + jeans → good
- hoodie + sneakers → good

Bad combinations:
- blazer + shorts → strong penalty
- formal_shirt + slides → penalty
- hoodie + heels → penalty

----------------------------------------
HARD RULES:

- If outfit is completely inappropriate → score must be below 20
- If perfect match → score must be above 85
- Never give random scores — justify logically

----------------------------------------
OUTPUT FORMAT (STRICT):

Rating: X/100

Breakdown:
- Occasion Fit: X/50
- Style: X/20
- Combination: X/15
- Color: X/15

Feedback:
(2–3 lines max)

Issues:
- bullet points

Suggestions:
- bullet points

----------------------------------------
RULES:

- Be concise
- Be consistent
- Do not hallucinate items
- Always follow scoring logic strictly
- DO NOT use any emojis in your response
"""

    user_prompt = f"""
Outfit:

Top: {top_name}
Bottom: {bottom_name}
Footwear: {shoes_name}
Accessories: {accessories or 'None'}
Colors: {colors}
Occasion: {occasion.replace('_', ' ')}
"""
    raw = _call_groq(user_prompt, max_tokens=400, system_prompt=system_prompt)
    if not raw:
        return {}

    # Parse rating
    ai_rating = rating_10
    for line in raw.split("\n"):
        if line.strip().lower().startswith("rating:"):
            try:
                # The prompt specifies "Rating: X/100"
                # We always convert to a 10-point scale for the UI
                raw_val = line.split(":")[1].strip().split("/")[0]
                val = float(raw_val)
                
                # Check if it's already /10 or /100
                if "/100" in line or val > 10.1:
                    ai_rating = round(val / 10.0, 1)
                else:
                    # If AI returned a small number without /100, it might be /10 already
                    ai_rating = round(val, 1)
            except Exception:
                pass
            break

    # Parse feedback block
    feedback_text = ""
    lines = raw.split("\n")
    in_feedback = False
    for line in lines:
        if "feedback:" in line.lower():
            in_feedback = True
            continue
        if in_feedback:
            if any(h in line.lower() for h in ["issues:", "suggestions:", "rating:"]):
                break
            if line.strip():
                feedback_text += line.strip() + " "

    return {
        "feedback": feedback_text.strip() or raw,
        "ai_issues": _parse_bullets(raw, "Issues:"),
        "ai_suggestions": _parse_bullets(raw, "Suggestions:"),
        "ai_rating": ai_rating,
    }


def _generate_why_it_works(
    occasion: str,
    top_name: str,
    bottom_name: str,
    shoes_name: str,
    colors: str,
    gender: Optional[str] = None,
    wardrobe: Optional[List[Dict]] = None,
) -> Optional[str]:
    """
    ✨ Prompt 2: "Why This Outfit Works" explainability.
    Returns a short paragraph or None.
    """
    gender_note = f"The wearer identifies as {gender}." if gender else ""
    prompt = f"""You are a fashion expert. {gender_note}
You know these clothing types: {_YOLO_CLASSES}.

Explain why this outfit works (or doesn't):

Top: {top_name}
Bottom: {bottom_name}
Shoes: {shoes_name}
Colors: {colors}
Occasion: {occasion.replace('_', ' ')}

Focus on:
- Color harmony
- Style balance
- Occasion suitability

Keep it short (3-4 lines max). No markdown, no bullet points.
"""
    return _call_groq(prompt, max_tokens=150)


def _generate_smart_shopping_queries(
    occasion: str,
    top_name: str,
    bottom_name: str,
    shoes_name: str,
    rule_suggestions: List[str],
    gender: Optional[str] = None,
    wardrobe: Optional[List[Dict]] = None,
) -> List[str]:
    """
    🛍️ Prompt 3: AI shopping queries for outfit GAPS only, gender-correct.
    Returns list of searchable product strings for SerpAPI.
    """
    g = "male" if not gender or gender.lower() in ("male", "m", "man", "men") else "female"
    gender_label = "men" if g == "male" else "women"
    wardrobe_block = _fmt_wardrobe(wardrobe)

    # Use the strictly prioritized rule suggestions as the needed fixes
    missing_str = "\n".join(f"  - {s}" for s in rule_suggestions[:3]) if rule_suggestions else "  - Accessory (watch, belt)"

    prompt = f"""You are a {gender_label}'s fashion stylist. IMPORTANT: You ONLY suggest {gender_label}'s clothing.

Current outfit:
Top: {top_name}
Bottom: {bottom_name}
Shoes: {shoes_name}
Occasion: {occasion.replace('_', ' ')}

The user's wardrobe:
{wardrobe_block}

Outfit Fixes Required (in priority order):
{missing_str}

Task: Suggest exactly 3 {gender_label}'s shopping search queries that fulfill the fixes required above.
Rules:
- Give exactly 3 queries. Prioritize the fixes in the exact order they appear above.
- Only suggest {gender_label}'s items (e.g. "men's slim chinos", "men's white sneakers")
- Each query must be specific and search-engine-ready (3-6 words max)
- No bullet points, no numbering, no explanation — just 3 lines of text
"""
    raw = _call_groq(prompt, max_tokens=100)
    if not raw:
        return []
    queries = [line.strip().lstrip("-•*123. ").strip() for line in raw.split("\n") if line.strip()]
    return [q for q in queries if 3 < len(q) < 80][:3]


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

    def _check_min_score(res: Dict[str, Any]) -> Dict[str, Any]:
        if "outfit" in res:
            _, _, score_10, _ = validate_and_score(occ, res["outfit"], gender)
            if score_10 < 3.0:
                from ml.occasion_rules import FORBIDDEN_ANY_YOLO, _cls
                forbidden = FORBIDDEN_ANY_YOLO.get(occ, set())
                partial_outfit = {}
                for slot in ("top", "bottom", "shoes"):
                    item = res["outfit"].get(slot)
                    if item and _cls(item) not in forbidden:
                        partial_outfit[slot] = item
                
                res["outfit"] = partial_outfit
                res["message"] = f"No complete outfit possible. Showing matching pieces for {occ.replace('_', ' ').title()}."
        return res

    ranked = _rank_strict_outfit_combos(occ, grouped_strict, gender, max_options=5)
    if ranked:
        primary = ranked[0]
        res = {
            "occasion": occ,
            "outfit": primary["outfit"],
            "scores": primary["scores"],
            "match_quality": "strict",
            "preview_rating": primary.get("preview_rating"),
            "ranked_options": ranked,
        }
        return _check_min_score(res)

    strict_res = _strict_build_outfit(occ, grouped_strict, gender)
    if strict_res.get("outfit"):
        strict_res["match_quality"] = "strict"
        return _check_min_score(strict_res)

    relaxed, relaxed_scores = _closest_match_outfit(grouped_full, occ, gender)
    if relaxed:
        res = {
            "occasion": occ,
            "outfit": relaxed,
            "scores": relaxed_scores,
            "match_quality": "closest",
            "warnings": [
                strict_res.get("message", "Strict occasion rules could not be fully satisfied."),
                "Using the closest available pieces from your wardrobe for this preview.",
            ],
        }
        return _check_min_score(res)
        
    return strict_res


def rate_outfit(
    occasion: str, outfit: Dict[str, Any], gender: Optional[str] = None,
    wardrobe: Optional[List[Dict]] = None,
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
            "feedback": "No appropriate outfit found in your wardrobe for this occasion.",
            "issues": issues,
            "suggestions": suggestions,
            "shopping_products": shopping_products,
            "improved_outfit": {},
        }

    strict_issues, strict_suggestions, rule_score_10, strict_meta = validate_outfit_strict(
        occ, outfit, gender=gender
    )

    top = outfit.get("top")
    bottom = outfit.get("bottom")
    shoes = outfit.get("shoes")
    
    issues = list(strict_issues)
    suggestions = list(strict_suggestions)

    # Final rating defaults to rule-based engine unless AI successfully overrides it
    rating = rule_score_10

    top_name = (top or {}).get("display_name", "top")
    bottom_name = (bottom or {}).get("display_name", "bottom")
    shoes_name = (shoes or {}).get("display_name", "shoes")
    accessory_name = (outfit.get("accessory") or {}).get("display_name", "")
    top_color = to_base_color((top or {}).get("color"))
    bottom_color_raw = to_base_color((bottom or {}).get("color"))
    shoes_color = to_base_color((shoes or {}).get("color"))
    colors_summary = ", ".join(filter(None, [top_color, bottom_color_raw, shoes_color]))

    # 🎯 Prompt 1: Structured AI feedback
    ai_result = _generate_groq_feedback(
        occasion=occ,
        top_name=top_name,
        bottom_name=bottom_name,
        shoes_name=shoes_name,
        colors=colors_summary,
        accessories=accessory_name,
        rating_10=rating,
        rule_score_breakdown=strict_meta,
        issues=issues,
        rule_suggestions=suggestions,
        gender=gender,
        wardrobe=wardrobe,
    )

    # Save rule-based score separately before Groq may override it
    rule_score = rating

    if ai_result and ai_result.get("ai_rating") is not None:
        # Groq rating is the exclusive final rating
        rating = max(0.0, min(10.0, round(float(ai_result["ai_rating"]), 1)))
        feedback = ai_result.get("feedback") or feedback
        if ai_result.get("ai_issues"):
            issues = ai_result["ai_issues"]
        if ai_result.get("ai_suggestions"):
            suggestions = ai_result["ai_suggestions"]
        print(f"✅ Groq rating used: {rating}/10 (rule-based was: {rule_score}/10)")
    elif ai_result and ai_result.get("feedback"):
        # Groq gave feedback but no parseable rating — use rule-based rating
        feedback = ai_result.get("feedback") or feedback
        if ai_result.get("ai_issues"):
            issues = ai_result["ai_issues"]
        if ai_result.get("ai_suggestions"):
            suggestions = ai_result["ai_suggestions"]
        print(f"⚠️  Groq gave feedback but no rating — using rule-based: {rule_score}/10")
    else:
        # Full rule-based fallback
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

    # ✨ Prompt 2: "Why This Outfit Works"
    why_it_works = _generate_why_it_works(
        occasion=occ,
        top_name=top_name,
        bottom_name=bottom_name,
        shoes_name=shoes_name,
        colors=colors_summary,
        gender=gender,
        wardrobe=wardrobe,
    )

    # Update rating with the AI's generated rating
    if "rating" in ai_result:
        rating = ai_result["rating"]

    # 🛍️ Prompt 3: Smart AI shopping queries → SerpAPI
    smart_queries = _generate_smart_shopping_queries(
        occasion=occ,
        top_name=top_name,
        bottom_name=bottom_name,
        shoes_name=shoes_name,
        rule_suggestions=suggestions,
        gender=gender,
        wardrobe=wardrobe,
    )

    improved = dict(outfit)
    if occ in {"party", "date_night", "formal_event"} and not improved.get("accessory"):
        improved["accessory"] = {"display_name": "watch", "category": "watch", "color": "black"}

    # Use AI-generated queries for shopping if available, else fall back to rule-based
    gap_presets = preset_queries_for_outfit_gaps(occ, outfit, gender)
    shopping_queries = smart_queries if smart_queries else suggestions
    shopping_products = build_shopping_links(
        shopping_queries,
        gender=gender,
        preset_queries=gap_presets if not smart_queries else [],
        is_smart_query=bool(smart_queries),
    )

    return {
        "rating": rating,
        "score": rating,
        "rule_score": rule_score,
        "feedback": feedback,
        "why_it_works": why_it_works,
        "subscores": {
            "rules_engine": strict_meta,
        },
        "issues": issues,
        "suggestions": suggestions,
        "shopping_products": shopping_products,
        "improved_outfit": improved,
        "source": "groq" if ai_result else "rules",
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
