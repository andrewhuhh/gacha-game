export interface Character {
  id: number
  name: string
  image: string
  rarity: "common" | "rare" | "super-rare" | "ultra-rare" | "legendary" | "mythic"
  variant?: "normal" | "winter" | "summer" | "halloween" | "special" | "anniversary" | "limited"
  effect?: {
    type: "gem_boost" | "luck_boost" | "timer_boost" | "pull_discount" | "sell_boost" | "special"
    value: number
    description: string
  }
}

// Helper function to generate character variants
const createVariants = (baseChar: Omit<Character, "id">, startId: number): Character[] => {
  const variants: Character[] = [{ ...baseChar, id: startId, variant: "normal" }]

  // Only create variants for rare and above
  if (baseChar.rarity === "common") return variants

  // Add winter variant
  if (["rare", "super-rare", "ultra-rare", "legendary", "mythic"].includes(baseChar.rarity)) {
    variants.push({
      ...baseChar,
      id: startId + 1000, // Offset winter variants by 1000
      name: `${baseChar.name} (Winter)`,
      variant: "winter",
      rarity: baseChar.rarity === "rare" ? "rare" : baseChar.rarity === "super-rare" ? "super-rare" : "ultra-rare",
    })
  }

  // Add summer variant
  if (["super-rare", "ultra-rare", "legendary", "mythic"].includes(baseChar.rarity)) {
    variants.push({
      ...baseChar,
      id: startId + 2000, // Offset summer variants by 2000
      name: `${baseChar.name} (Summer)`,
      variant: "summer",
      rarity: baseChar.rarity === "super-rare" ? "super-rare" : "ultra-rare",
    })
  }

  // Add special variant with effect for ultra-rare and above
  if (["ultra-rare", "legendary", "mythic"].includes(baseChar.rarity)) {
    variants.push({
      ...baseChar,
      id: startId + 3000, // Offset special variants by 3000
      name: `${baseChar.name} (Special)`,
      variant: "special",
      rarity: "legendary",
      effect: {
        type: "gem_boost",
        value: 10,
        description: "+10% passive gem income",
      },
    })
  }

  // Add anniversary variant with effect for legendary and mythic
  if (["legendary", "mythic"].includes(baseChar.rarity)) {
    variants.push({
      ...baseChar,
      id: startId + 4000, // Offset anniversary variants by 4000
      name: `${baseChar.name} (Anniversary)`,
      variant: "anniversary",
      rarity: "mythic",
      effect: {
        type: "luck_boost",
        value: 5,
        description: "+5% chance for higher rarity pulls",
      },
    })
  }

  return variants
}

// Base characters
const baseCharacters = [
  // Common characters
  {
    name: "Hello Kitty",
    image: "/images/hello-kitty.webp",
    rarity: "common" as const,
  },
  {
    name: "Keroppi",
    image: "/images/keropi.webp",
    rarity: "common" as const,
  },
  {
    name: "Chococat",
    image: "/images/chococat.webp",
    rarity: "common" as const,
  },
  {
    name: "Badtz-Maru",
    image: "/images/badtz-maru.webp",
    rarity: "common" as const,
  },
  {
    name: "Pompompurin",
    image: "/images/pompompourin.webp",
    rarity: "common" as const,
  },

  // Rare characters
  {
    name: "My Melody",
    image: "/images/melody.webp",
    rarity: "rare" as const,
  },
  {
    name: "Pochaco",
    image: "/images/pochaco.webp",
    rarity: "rare" as const,
  },
  {
    name: "Twin Stars",
    image: "/images/twin-stars.webp",
    rarity: "rare" as const,
  },

  // Super Rare characters
  {
    name: "Cinnamoroll",
    image: "/images/cinnamaroll.webp",
    rarity: "super-rare" as const,
  },
  {
    name: "Kuromi",
    image: "/images/kuromi.webp",
    rarity: "super-rare" as const,
  },

  // Ultra Rare characters
  {
    name: "Hello Kitty",
    image: "/images/hello-kitty.webp",
    rarity: "ultra-rare" as const,
    effect: {
      type: "gem_boost",
      value: 5,
      description: "+5% passive gem income",
    },
  },
  {
    name: "Kuromi",
    image: "/images/kuromi.webp",
    rarity: "ultra-rare" as const,
    effect: {
      type: "timer_boost",
      value: 10,
      description: "10% faster gem timer",
    },
  },
  {
    name: "My Melody",
    image: "/images/melody.webp",
    rarity: "ultra-rare" as const,
    effect: {
      type: "sell_boost",
      value: 15,
      description: "+15% sell value",
    },
  },

  // Legendary characters
  {
    name: "Hello Kitty",
    image: "/images/hello-kitty.webp",
    rarity: "legendary" as const,
    variant: "limited",
    effect: {
      type: "luck_boost",
      value: 3,
      description: "+3% chance for higher rarity pulls",
    },
  },
  {
    name: "Cinnamoroll",
    image: "/images/cinnamaroll.webp",
    rarity: "legendary" as const,
    variant: "limited",
    effect: {
      type: "pull_discount",
      value: 5,
      description: "5% discount on pulls",
    },
  },

  // Mythic characters
  {
    name: "Hello Kitty & Friends",
    image: "/images/hello-kitty.webp",
    rarity: "mythic" as const,
    variant: "anniversary",
    effect: {
      type: "special",
      value: 1,
      description: "All boosts +1%",
    },
  },
]

// Generate all character variants
let currentId = 1
export const characters: Character[] = []

baseCharacters.forEach((baseChar) => {
  const variants = createVariants(baseChar as Omit<Character, "id">, currentId)
  // Add effect-specific offset to IDs for cards with effects
  variants.forEach(char => {
    if (char.effect) {
      char.id += 10000 // Add large offset to ensure uniqueness
    }
  })
  characters.push(...variants)
  currentId += variants.length
})

// Add more characters to reach 142 total
// This is a simplified approach - in a real game, you'd have unique images and properties for each
while (characters.length < 142) {
  const randomBase = baseCharacters[Math.floor(Math.random() * baseCharacters.length)]
  const randomVariant = Math.random() > 0.5 ? "halloween" : "special"
  const randomRarity =
    Math.random() > 0.8
      ? "legendary"
      : Math.random() > 0.6
        ? "ultra-rare"
        : Math.random() > 0.4
          ? "super-rare"
          : Math.random() > 0.2
            ? "rare"
            : "common"

  const hasEffect = Math.random() > 0.7
  const baseId = characters.length + 1
  
  characters.push({
    id: hasEffect ? baseId + 10000 : baseId, // Add offset for effect cards
    name: `${randomBase.name} (${randomVariant} ${characters.length})`,
    image: randomBase.image,
    rarity: randomRarity as any,
    variant: randomVariant as any,
    ...(hasEffect && {
      effect: {
        type: ["gem_boost", "luck_boost", "timer_boost", "pull_discount", "sell_boost"][
          Math.floor(Math.random() * 5)
        ] as any,
        value: Math.floor(Math.random() * 10) + 1,
        description: `Random effect +${Math.floor(Math.random() * 10) + 1}%`,
      },
    }),
  })
}

// Sell values based on rarity
export const sellValues = {
  common: 30,
  rare: 80,
  "super-rare": 200,
  "ultra-rare": 500,
  legendary: 1000,
  mythic: 2500,
}

// Pull rates
export const baseRates = {
  common: 70,
  rare: 20,
  superRare: 8,
  ultraRare: 1.5,
  legendary: 0.4,
  mythic: 0.1,
}

