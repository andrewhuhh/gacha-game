import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { type Character } from "@/lib/characters"
import CharacterCard from "./character-card"
import { Button } from "@/components/ui/button"

interface MultiPullAnimationProps {
  isOpen: boolean
  onClose: () => void
  pulls: Character[]
  currentIndex: number
  onSave: () => void
  onSell: () => void
  sellValue: number
}

export default function MultiPullAnimation({
  isOpen,
  onClose,
  pulls,
  currentIndex,
  onSave,
  onSell,
  sellValue
}: MultiPullAnimationProps) {
  const currentCard = pulls[currentIndex]
  const totalPulls = pulls.length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-indigo-900 to-purple-900 border-none text-white">
        <div className="relative h-[500px] flex items-center justify-center overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0">
            {/* Animated particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: 0,
                  opacity: 0 
                }}
                animate={{
                  y: [null, -20],
                  scale: [0, 1.5],
                  opacity: [0, 0.5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>

          {/* Pull counter */}
          <div className="absolute top-4 left-0 right-0 text-center">
            <div className="text-xl font-bold text-white">
              Pull {currentIndex + 1} of {totalPulls}
            </div>
          </div>

          {/* Card display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="relative"
              initial={{ scale: 0.8, opacity: 0, rotateY: -180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateY: 180 }}
              transition={{
                type: "spring",
                duration: 0.5,
              }}
            >
              <div className="relative">
                <CharacterCard character={currentCard} isNew={true} />
                
                {/* Rarity-based glow effect */}
                <motion.div
                  className="absolute -inset-4 rounded-lg opacity-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  style={{
                    background: `radial-gradient(circle, ${getRarityColor(currentCard.rarity)} 0%, transparent 70%)`
                  }}
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action buttons */}
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            <Button 
              onClick={onSave}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              Save to Collection
            </Button>
            <Button
              onClick={onSell}
              variant="outline"
              className="flex-1 border-amber-300 text-amber-300 hover:bg-amber-500/20"
            >
              Sell for {sellValue} Gems
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to get rarity-based glow color
function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'mythic': return 'rgba(236, 72, 153, 0.3)' // pink
    case 'legendary': return 'rgba(249, 115, 22, 0.3)' // orange
    case 'ultra-rare': return 'rgba(234, 179, 8, 0.3)' // yellow
    case 'super-rare': return 'rgba(147, 51, 234, 0.3)' // purple
    case 'rare': return 'rgba(59, 130, 246, 0.3)' // blue
    default: return 'rgba(156, 163, 175, 0.3)' // gray
  }
} 