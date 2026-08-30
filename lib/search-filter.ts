// lib/search-filter.ts

const BANNED_TERMS = [
  "xxx",
  "adult",
  "porn",
  "sex",
];

const OVERRIDE_CODE = "057";

export function processSearchTerm(input: string | null | undefined) {
  const original = (input ?? "").trim().toLowerCase();

  if (!original) {
    return {
      allowed: false,
      searchTerm: "",
      override: false,
    };
  }

  // 1. Pehle check karo ki kya query override code (057) se end ho rahi hai ya nahi
  const endsWithOverride = original.endsWith(OVERRIDE_CODE);

  if (endsWithOverride) {
    // Agar 057 se end ho rahi hai, toh 057 hata kar cleaned term nikal lo
    const cleaned = original
      .slice(0, -OVERRIDE_CODE.length)
      .trim();

    // Check karo ki kya cleaned term ke andar koi banned term aata hai
    const containsBanned = BANNED_TERMS.some((term) => cleaned.includes(term));

    if (containsBanned) {
      return {
        allowed: true,
        searchTerm: cleaned, // Jaise "xxx057" se "xxx" ban jayega aur allow ho jayega
        override: true,
      };
    }
  }

  // 2. Agar 057 nahi laga hai, toh check karo kya query mein koi bhi banned term aata hai (chahe aage kuch bhi likha ho jaise "xxxw", "sex video", etc.)
  const containsBanned = BANNED_TERMS.some((term) => original.includes(term));

  if (containsBanned) {
    // Agar banned term mil gaya aur 057 nahi tha, toh seedha block kar do
    return {
      allowed: false,
      searchTerm: original,
      override: false,
      blockedTerm: original,
    };
  }

  // 3. Normal search jo banned terms mein nahi aati (jaise "spider-man", "action movie")
  return {
    allowed: true,
    searchTerm: original,
    override: false,
  };
}