/* Simple fetch helpers for meal-override endpoints */

export async function fetchMealOverrides() {
    const resp = await fetch("/api/meal-overrides");
    const data = await resp.json();
    return Array.isArray(data) ? data : [];
}

export async function toggleMealOverride(dateYMD, mealType) {
    await fetch("/api/meal-overrides/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateYMD, meal_type: mealType }),
    });
}
