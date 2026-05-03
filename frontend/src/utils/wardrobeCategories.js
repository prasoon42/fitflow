/**
 * Maps detector / DB category strings to Wardrobe UI tabs (Upperwear, Lowerwear, …).
 * Fine-grained classes (t-shirt, jeans) stay on each item; tabs use broad groups.
 */

const LOWERWEAR_CLASSES = new Set(['jeans', 'trousers', 'shorts', 'skirt']);

const SHOE_CLASSES = new Set(['boot', 'heel', 'slide', 'sneaker', 'sport']);

const ACCESSORY_CLASSES = new Set(['watch', 'belt', 'cap', 'bag', 'sunglasses']);

/** Jacket / knit layers — also listed under Upperwear so "all tops" stay together. */
const OUTERWEAR_CLASSES = new Set([
    'blazer',
    'cardigan',
    'hoodie',
    'pullover',
    'sweaters',
    'sweatshirt',
    'vest',
]);

/**
 * Broad closet group for primary tabs (Upperwear / Lowerwear / Shoes / Accessories).
 * All torso pieces including tees, shirts, dresses, and outer layers → Upperwear.
 */
export function getWardrobeBroadGroup(category) {
    const c = (category || '').toLowerCase().trim();
    if (!c) return 'Upperwear';
    if (c === 'lowerwear') return 'Lowerwear';
    if (c === 'upperwear' || c === 'outerwear') return 'Upperwear';
    if (LOWERWEAR_CLASSES.has(c)) return 'Lowerwear';
    if (SHOE_CLASSES.has(c)) return 'Shoes';
    if (ACCESSORY_CLASSES.has(c)) return 'Accessories';
    return 'Upperwear';
}

/** True if item belongs on the Outerwear sub-tab (layers / legacy Outerwear). */
export function isOuterwearCategory(category) {
    const c = (category || '').toLowerCase().trim();
    return OUTERWEAR_CLASSES.has(c) || c === 'outerwear';
}

/**
 * @param {{ category?: string }} item
 * @param {string} activeCategory tab label: All, Upperwear, Lowerwear, … or a model class like "t-shirt"
 */
export function matchesWardrobeTab(item, activeCategory) {
    if (activeCategory === 'All') return true;
    const raw = (item.category || '').trim();
    const c = raw.toLowerCase();

    if (activeCategory === 'Upperwear') {
        return getWardrobeBroadGroup(item.category) === 'Upperwear';
    }
    if (activeCategory === 'Lowerwear') {
        return getWardrobeBroadGroup(item.category) === 'Lowerwear';
    }
    if (activeCategory === 'Shoes') {
        return getWardrobeBroadGroup(item.category) === 'Shoes';
    }
    if (activeCategory === 'Accessories') {
        return getWardrobeBroadGroup(item.category) === 'Accessories';
    }
    if (activeCategory === 'Outerwear') {
        return isOuterwearCategory(item.category);
    }
    // Model-level tab (e.g. "t-shirt", "Jeans") from detectedCategories
    return c === activeCategory.toLowerCase();
}
