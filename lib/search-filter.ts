// lib/search-filter.ts

const BANNED_TERMS = [
  "xxx",
  "adult",
  "porn",
  "sex",
];

const OVERRIDE_CODE = "057";

// Agar backend API direct "sex" ya "porn" keyword par result nahi deti, 
// toh yahan aap mapping set kar sakte hain ki 057 lagane par API ko kya bhejna hai.
const BACKEND_MAPPINGS: Record<string, string> = {
  "xxx": "xxx",       // Agar xxx chal jata hai
  "sex": "romance",   // Example: Agar sex likhne par API block kare, toh aap yahan koi aur term ya tag daal sakte hain jo API accept kare
  "porn": "adult",    // Example: porn057 likhne par API ko "adult" bhej sakte hain
  "adult": "adult",
};

export function processSearchTerm(input: string | null | undefined) {
  const original = (input ?? "").trim().toLowerCase();

  if (!original) {
    return {
      allowed: false,
      searchTerm: "",
      override: false,
    };
  }

  // 1. Check karo ki kya query override code (057) se end ho rahi hai
  const endsWithOverride = original.endsWith(OVERRIDE_CODE);

  if (endsWithOverride) {
    const cleaned = original
      .slice(0, -OVERRIDE_CODE.length)
      .trim();

    const containsBanned = BANNED_TERMS.some((term) => cleaned.includes(term));

    if (containsBanned) {
      // Yahan hum decide karte hain ki API ko kya keyword bhejna hai
      // Agar mapping mein word hai toh wo jayega, nahi toh cleaned term jayegi
      const finalTerm = BACKEND_MAPPINGS[cleaned] || cleaned;

      return {
        allowed: true,
        searchTerm: finalTerm,
        override: true,
      };
    }
  }

  // 2. Normal check: Agar 057 nahi hai aur banned term hai toh block kar do
  const containsBanned = BANNED_TERMS.some((term) => original.includes(term));

  if (containsBanned) {
    return {
      allowed: false,
      searchTerm: original,
      override: false,
      blockedTerm: original,
    };
  }

  // 3. Normal searches
  return {
        allowed: true,
    searchTerm: original,
    override: false,
  };
}