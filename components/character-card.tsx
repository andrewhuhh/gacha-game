"use client"

import { motion } from "framer-motion"
import type { Character } from "@/lib/characters"
import { Star, Zap } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CharacterCardProps {
  character: Character
  isNew: boolean
  onClick?: () => void
}

export default function CharacterCard({ character, isNew, onClick }: CharacterCardProps) {
  const rarityColors = {
    common: "bg-pink-100 border-pink-300",
    rare: "bg-blue-100 border-blue-300",
    "super-rare": "bg-purple-100 border-purple-300",
    "ultra-rare": "bg-yellow-100 border-yellow-300 animate-pulse",
    legendary: "bg-gradient-to-r from-orange-300 to-yellow-300 border-orange-400",
    mythic: "bg-gradient-to-r from-pink-400 to-purple-400 border-pink-500",
  }

  const rarityStars = {
    common: 1,
    rare: 2,
    "super-rare": 3,
    "ultra-rare": 4,
    legendary: 5,
    mythic: 6,
  }

  const variantBadges = {
    normal: "",
    winter: "bg-blue-200 text-blue-800",
    summer: "bg-yellow-200 text-yellow-800",
    halloween: "bg-orange-200 text-orange-800",
    special: "bg-purple-200 text-purple-800",
    anniversary: "bg-pink-200 text-pink-800",
    limited: "bg-red-200 text-red-800",
  }

  return (
    <motion.div
      initial={isNew ? { scale: 0.8, opacity: 0, y: 20 } : false}
      animate={isNew ? { scale: 1, opacity: 1, y: 0 } : false}
      transition={{ type: "spring", duration: 0.5 }}
      className={`relative rounded-lg overflow-hidden border-2 ${rarityColors[character.rarity]} ${
        isNew ? "shadow-lg" : ""
      } ${onClick ? "cursor-pointer hover:scale-105 transition-transform" : ""}`}
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden">
        <img src={character.image || "/placeholder.svg"} alt={character.name} className="w-full h-full object-cover" />
        {isNew && (
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          />
        )}

        {/* Variant badge */}
        {character.variant && character.variant !== "normal" && (
          <div
            className={`absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded-full ${variantBadges[character.variant]}`}
          >
            {character.variant}
          </div>
        )}
      </div>
      <div className="p-1 text-center bg-white">
        <p className="text-xs font-medium truncate">{character.name}</p>
        <div className="flex justify-center mt-1">
          {[...Array(rarityStars[character.rarity])].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      </div>

      {/* Effect indicator */}
      {character.effect && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute bottom-1 right-1 bg-white rounded-full p-0.5 shadow-md">
                <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{character.effect.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {isNew && (
        <motion.div
          className="absolute top-2 right-2 bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: "spring" }}
        >
          NEW!
        </motion.div>
      )}
    </motion.div>
  )
}

