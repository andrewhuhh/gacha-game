"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ConfettiProps {
  colors?: string[]
  pieces?: number
  duration?: number
}

export default function ConfettiAnimation({
  colors = ["#FF69B4", "#87CEFA", "#FFD700", "#98FB98", "#FFA07A"],
  pieces = 100,
  duration = 3000,
}: ConfettiProps) {
  const [confetti, setConfetti] = useState<
    Array<{
      id: number
      x: number
      y: number
      rotation: number
      scale: number
      color: string
    }>
  >([])

  const generateConfetti = useCallback(() => {
    return Array.from({ length: pieces }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20 - Math.random() * 10,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
  }, [colors, pieces])

  useEffect(() => {
    let mounted = true

    // Generate confetti only if component is mounted
    if (mounted) {
      setConfetti(generateConfetti())
    }

    // Clean up confetti after animation completes
    const timer = setTimeout(() => {
      if (mounted) {
        setConfetti([])
      }
    }, duration)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [colors, pieces, duration, generateConfetti])

  return (
    <AnimatePresence>
      {confetti.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute w-3 h-3"
              style={{
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? "50%" : "0%",
                zIndex: 50,
              }}
              initial={{
                y: piece.y,
                x: piece.x,
                rotate: 0,
                scale: 0,
              }}
              animate={{
                y: `${100 + Math.random() * 20}%`,
                x: `${piece.x + (Math.random() * 20 - 10)}%`,
                rotate: piece.rotation + Math.random() * 360,
                scale: piece.scale,
              }}
              exit={{
                opacity: 0,
                scale: 0,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

