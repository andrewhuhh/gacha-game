"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, DollarSign, Heart, Lock, Unlock } from "lucide-react"
import { type Character, sellValues } from "@/lib/characters"

interface CharacterDialogProps {
  character: Character & { count?: number; isLocked?: boolean }
  isOpen: boolean
  onClose: () => void
  onSell: (amount: number) => void
  onToggleLock: () => void
  pullCount: number
  activeEffects: {
    gemBoost: number
    luckBoost: number
    timerBoost: number
    pullDiscount: number
    sellBoost: number
  }
}

export default function CharacterDialog({
  character,
  isOpen,
  onClose,
  onSell,
  onToggleLock,
  pullCount,
  activeEffects
}: CharacterDialogProps) {
  const [isLockedState, setIsLockedState] = useState(character.isLocked)

  useEffect(() => {
    setIsLockedState(character.isLocked)
  }, [character.isLocked])

  const rarityColors = {
    common: "bg-pink-100 text-pink-700",
    rare: "bg-blue-100 text-blue-700",
    "super-rare": "bg-purple-100 text-purple-700",
    "ultra-rare": "bg-yellow-100 text-yellow-700",
    legendary: "bg-orange-100 text-orange-700",
    mythic: "bg-pink-100 text-pink-700",
  }

  const rarityStars = {
    common: 1,
    rare: 2,
    "super-rare": 3,
    "ultra-rare": 4,
    legendary: 5,
    mythic: 6,
  }

  const calculateSellValue = (amount: number) => {
    return Math.floor(sellValues[character.rarity] * (1 + activeEffects.sellBoost / 100) * amount)
  }

  const handleToggleLock = () => {
    setIsLockedState(!isLockedState)
    onToggleLock()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{character.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-48 h-48 rounded-lg overflow-hidden">
            <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(rarityStars[character.rarity])].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            
            <Badge className={rarityColors[character.rarity]}>
              {character.rarity.replace("-", " ").toUpperCase()}
            </Badge>

            {character.variant && character.variant !== "normal" && (
              <Badge variant="outline" className="capitalize">
                {character.variant}
              </Badge>
            )}

            {character.effect && (
              <Badge variant="outline" className="bg-yellow-50">
                {character.effect.description}
              </Badge>
            )}

            <div className="text-sm text-gray-500">
              {character.count ? (
                <>Owned: {character.count}</>
              ) : (
                <>Pulled {pullCount} time{pullCount !== 1 ? "s" : ""}</>
              )}
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className={isLockedState ? "bg-pink-50 text-pink-600" : ""}
              onClick={handleToggleLock}
            >
              {isLockedState ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
              {isLockedState ? "Locked" : "Lock"}
            </Button>
            <div className="flex-1 flex gap-2">
              {character.count && character.count > 1 ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 border-amber-300 text-amber-600 hover:bg-amber-50"
                    onClick={() => onSell(1)}
                    disabled={isLockedState}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Sell 1
                    <span className="text-xs ml-1">
                      (+{calculateSellValue(1)})
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-amber-300 text-amber-600 hover:bg-amber-50"
                    onClick={() => onSell(character.count || 1)}
                    disabled={isLockedState}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Sell All ({character.count})
                    <span className="text-xs ml-1">
                      (+{calculateSellValue(character.count || 1)})
                    </span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1 border-amber-300 text-amber-600 hover:bg-amber-50"
                  onClick={() => onSell(1)}
                  disabled={isLockedState}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Sell
                  <span className="text-xs ml-1">
                    (+{calculateSellValue(1)})
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 