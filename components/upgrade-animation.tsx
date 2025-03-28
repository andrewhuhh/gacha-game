import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { type Character } from "@/lib/characters"
import CharacterCard from "./character-card"

interface UpgradeAnimationProps {
  isOpen: boolean
  onClose: () => void
  sourceCards: Character[]
  resultCard?: Character
  success: boolean
}

export default function UpgradeAnimation({
  isOpen,
  onClose,
  sourceCards,
  resultCard,
  success
}: UpgradeAnimationProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-indigo-900 to-purple-900 border-none text-white">
        <div className="relative h-[400px] flex items-center justify-center overflow-hidden">
          {/* Source cards animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-5 gap-2">
              {sourceCards.map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, y: 100, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    y: 0, 
                    opacity: 1,
                    transition: { delay: index * 0.1 }
                  }}
                  exit={{
                    scale: 0,
                    y: -50,
                    opacity: 0,
                    transition: { 
                      delay: index * 0.05,
                      duration: 0.5 
                    }
                  }}
                >
                  <CharacterCard character={card} isNew={false} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Magical circle and particles */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { delay: 1.5, duration: 0.5 }
            }}
          >
            <div className="relative w-48 h-48">
              {/* Rotating magical circle */}
              <motion.div
                className="absolute inset-0 border-4 border-purple-400 rounded-full"
                style={{ 
                  backgroundImage: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)",
                  backgroundSize: "200% 200%"
                }}
                animate={{
                  rotate: 360,
                  backgroundPosition: ["0% 0%", "200% 200%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              
              {/* Particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-purple-400 rounded-full"
                  style={{
                    left: "50%",
                    top: "50%",
                  }}
                  animate={{
                    x: [0, Math.cos(i * 30 * Math.PI / 180) * 100],
                    y: [0, Math.sin(i * 30 * Math.PI / 180) * 100],
                    opacity: [1, 0],
                    scale: [1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Result card animation */}
          <AnimatePresence>
            {resultCard && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 2, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  transition: { 
                    delay: 2,
                    type: "spring",
                    duration: 0.8
                  }
                }}
              >
                <div className="relative">
                  <CharacterCard character={resultCard} isNew={true} />
                  {success && (
                    <motion.div
                      className="absolute -inset-4 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.5 }}
                      style={{
                        background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)"
                      }}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success/Fail text */}
          <AnimatePresence>
            {resultCard && (
              <motion.div
                className="absolute top-4 left-0 right-0 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: 2.5 }
                }}
              >
                <div className={`text-2xl font-bold ${success ? 'text-green-400' : 'text-red-400'}`}>
                  {success ? 'Upgrade Success!' : 'Upgrade Failed'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
} 