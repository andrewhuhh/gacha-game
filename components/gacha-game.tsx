"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Gift, Sparkles, Heart, Save, DollarSign, Clock, Zap, ChevronDown, ChevronUp, Trophy, Volume2, VolumeX } from "lucide-react"
import CharacterCard from "./character-card"
import CharacterDialog from "./character-dialog"
import PullAnimation from "./pull-animation"
import ConfettiAnimation from "./confetti-animation"
import UpgradeAnimation from "./upgrade-animation"
import MultiPullAnimation from "./multi-pull-animation"
import { type Character, characters, sellValues, baseRates } from "@/lib/characters"
import { addPullToLog } from "@/lib/multiplayer"
import { playSound, setMuted } from "@/lib/sounds"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CollectionStats {
  total: number
  unique: number
  byRarity: Record<string, number>
  byEdition: Record<string, { total: number, unique: number, max: number }>
}

interface LifetimeStats {
  totalPulls: number
  totalGemsMade: number
  totalCardsSold: number
  byRarity: Record<string, number>
}

interface EditionBonus {
  type: 'gem_boost' | 'timer_boost' | 'pull_discount' | 'luck_boost' | 'sell_boost' | 'all_stats'
  value: number
}

const EDITION_BONUSES: Record<string, { type: string, thresholds: Record<number, number> }> = {
  normal: { type: 'gem_boost', thresholds: { 30: 5, 75: 10, 100: 15 } },
  winter: { type: 'timer_boost', thresholds: { 30: 5, 75: 10, 100: 15 } },
  summer: { type: 'pull_discount', thresholds: { 30: 5, 75: 10, 100: 15 } },
  halloween: { type: 'luck_boost', thresholds: { 30: 5, 75: 10, 100: 15 } },
  special: { type: 'sell_boost', thresholds: { 30: 5, 75: 10, 100: 15 } },
  anniversary: { type: 'all_stats', thresholds: { 30: 2, 75: 4, 100: 6 } }
}

interface CollectionBonusDialogProps {
  edition: string
  stats: { total: number; unique: number; max: number }
  isOpen: boolean
  onClose: () => void
}

function CollectionBonusDialog({ edition, stats, isOpen, onClose }: CollectionBonusDialogProps) {
  const bonusConfig = EDITION_BONUSES[edition]
  if (!bonusConfig) return null

  const bonusType = bonusConfig.type.replace(/_/g, ' ')
  
  // Calculate breakpoint card requirements
  const getBreakpointCards = (percentage: number) => Math.ceil((stats.max * percentage) / 100)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="capitalize">{edition} Edition Bonuses</DialogTitle>
          <DialogDescription>
            Complete your collection to earn powerful bonuses!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {[30, 75, 100].map(threshold => {
            const breakpointCards = getBreakpointCards(threshold)
            const achieved = stats.unique >= breakpointCards
            return (
              <div key={threshold} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{threshold}% Collection</span>
                  <span>{stats.unique}/{breakpointCards} cards</span>
                </div>
                <Progress value={stats.unique} max={breakpointCards} className="h-2" />
                <Badge variant={achieved ? "default" : "secondary"} className={achieved ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                  +{bonusConfig.thresholds[threshold]}% {bonusType}
                </Badge>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function GachaGame() {
  interface CollectionCharacter extends Character {
    count: number
    isLocked?: boolean
  }

  const [collection, setCollection] = useState<CollectionCharacter[]>([])
  const [lastPull, setLastPull] = useState<CollectionCharacter | null>(null)
  const [pullResults, setPullResults] = useState<CollectionCharacter[]>([])
  const [currentPullIndex, setCurrentPullIndex] = useState(0)
  const [selectedCharacter, setSelectedCharacter] = useState<CollectionCharacter | null>(null)
  const [isPulling, setIsPulling] = useState(false)
  const [gems, setGems] = useState(8000)
  const [showRates, setShowRates] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [nextGemTime, setNextGemTime] = useState(60) // seconds until next gem reward
  const [gemAnimation, setGemAnimation] = useState<{ value: number; id: number } | null>(null)
  const [username, setUsername] = useState("Player" + Math.floor(Math.random() * 1000))
  const [showMultiplayer, setShowMultiplayer] = useState(false)
  const [pullsSinceLastSuperRare, setPullsSinceLastSuperRare] = useState(0)
  const [pullsSinceLastUltraRare, setPullsSinceLastUltraRare] = useState(0)
  const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats>({
    totalPulls: 0,
    totalGemsMade: 0,
    totalCardsSold: 0,
    byRarity: {
      common: 0,
      rare: 0,
      "super-rare": 0,
      "ultra-rare": 0,
      legendary: 0,
      mythic: 0
    }
  })
  const prevGemsRef = useRef(gems)
  const gemAnimIdRef = useRef(0)
  const [isMuted, setIsMuted] = useState(false)
  const [fountainTime, setFountainTime] = useState(0)
  const [fountainLastCollected, setFountainLastCollected] = useState(Date.now())
  const [showLog, setShowLog] = useState(true)
  const [recentPulls, setRecentPulls] = useState<{ character: Character; username: string }[]>([])
  const [selectedUpgradeCards, setSelectedUpgradeCards] = useState<Record<string, CollectionCharacter[]>>({
    common: [],
    rare: [],
    "super-rare": [],
    "ultra-rare": [],
    legendary: [],
  })
  const [isUpgradeMode, setIsUpgradeMode] = useState(false)
  const [selectedEditionBonus, setSelectedEditionBonus] = useState<string | null>(null)
  const [showUpgradeAnimation, setShowUpgradeAnimation] = useState(false)
  const [upgradeAnimationData, setUpgradeAnimationData] = useState<{
    sourceCards: CollectionCharacter[]
    resultCard?: CollectionCharacter
    success: boolean
  } | null>(null)
  const [showMultiPullAnimation, setShowMultiPullAnimation] = useState(false)

  // Calculate collection stats with edition tracking
  const collectionStats: CollectionStats = {
    total: collection.length,
    unique: new Set(collection.map((char) => char.name)).size,
    byRarity: collection.reduce((acc, char) => {
      acc[char.rarity] = (acc[char.rarity] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byEdition: Object.keys(EDITION_BONUSES).reduce((acc, edition) => {
      const editionChars = characters.filter(c => !c.variant || c.variant === edition)
      const collectedChars = collection.filter(c => !c.variant || c.variant === edition)
      acc[edition] = {
        total: collectedChars.length,
        unique: new Set(collectedChars.map(c => c.name)).size,
        max: editionChars.length
      }
      return acc
    }, {} as Record<string, { total: number, unique: number, max: number }>)
  }

  // Render a character card with selection and lock status
  const renderCharacterCard = (character: CollectionCharacter, variant?: string) => {
    const isSelected = selectedUpgradeCards[character.rarity]?.some(c => c.id === character.id)
    const canSelect = !character.isLocked && 
      (!selectedUpgradeCards[character.rarity] || 
       selectedUpgradeCards[character.rarity].length < 10)

    // In upgrade mode, render individual cards instead of stacked
    if (isUpgradeMode) {
      return Array(character.count).fill(null).map((_, index) => {
        const isThisCardSelected = selectedUpgradeCards[character.rarity]?.some((c, idx) => 
          c.id === character.id && 
          selectedUpgradeCards[character.rarity].slice(0, idx + 1).filter(sc => sc.id === c.id).length === index + 1
        )
        
        return (
          <div key={index} className={`relative ${!character.isLocked ? 'cursor-pointer' : ''}`}>
            <div className={`${isThisCardSelected ? 'ring-2 ring-blue-500' : ''} ${character.isLocked ? 'opacity-50' : ''}`}>
              <CharacterCard
                character={character}
                isNew={false}
                onClick={() => {
                  if (character.isLocked) return
                  if (isThisCardSelected) {
                    // Remove this specific instance
                    const selectedCards = selectedUpgradeCards[character.rarity] || []
                    const cardInstances = selectedCards.filter(c => c.id === character.id)
                    const instanceIndex = cardInstances.length - 1
                    setSelectedUpgradeCards(prev => ({
                      ...prev,
                      [character.rarity]: prev[character.rarity].filter((c, idx) => {
                        if (c.id !== character.id) return true
                        return selectedCards.slice(0, idx + 1).filter(sc => sc.id === c.id).length !== instanceIndex + 1
                      })
                    }))
                  } else if (canSelect) {
                    selectCardForUpgrade(character)
                  }
                }}
              />
            </div>
            {character.isLocked && (
              <div className="absolute top-1 left-1 bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
                🔒
              </div>
            )}
            {isThisCardSelected && (
              <div className="absolute top-1 left-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
                ✓
              </div>
            )}
          </div>
        )
      })
    }

    // Normal collection view with stacked cards
    return (
      <div className="relative">
        <div className={`${isSelected ? 'ring-2 ring-blue-500' : ''} ${character.isLocked ? 'opacity-50' : ''}`}>
          <CharacterCard
            character={character}
            isNew={false}
            onClick={() => setSelectedCharacter(character)}
          />
        </div>
        {character.count > 1 && (
          <div className="absolute top-1 right-1 bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
            {character.count}
          </div>
        )}
        {character.isLocked && (
          <div className="absolute top-1 left-1 bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
            🔒
          </div>
        )}
      </div>
    )
  }

  // Calculate edition bonuses
  const calculateEditionBonuses = () => {
    const bonuses: Record<string, number> = {
      gem_boost: 0,
      timer_boost: 0,
      pull_discount: 0,
      luck_boost: 0,
      sell_boost: 0
    }

    Object.entries(EDITION_BONUSES).forEach(([edition, config]) => {
      const stats = collectionStats.byEdition[edition]
      if (!stats) return

      const completion = (stats.unique / stats.max) * 100
      let bonus = 0

      // Find the highest threshold reached
      Object.entries(config.thresholds)
        .sort(([a], [b]) => Number(b) - Number(a))
        .some(([threshold, value]) => {
          if (completion >= Number(threshold)) {
            bonus = value
            return true
          }
          return false
        })

      if (config.type === 'all_stats') {
        Object.keys(bonuses).forEach(type => {
          bonuses[type] += bonus
        })
      } else {
        bonuses[config.type] += bonus
      }
    })

    return bonuses
  }

  // Helper function to get next rarity level
  const getNextRarity = (rarity: string) => {
    const rarityOrder = ["common", "rare", "super-rare", "ultra-rare", "legendary", "mythic"]
    const currentIndex = rarityOrder.indexOf(rarity)
    return currentIndex < rarityOrder.length - 1 ? rarityOrder[currentIndex + 1] : rarity
  }

  // Calculate collection milestone bonuses
  const collectionBonuses = {
    gemBoost: collectionStats.unique >= characters.length * 0.3 ? 5 : 0,
    timerBoost: collectionStats.unique >= characters.length * 0.75 ? 10 : 0,
    pullDiscount: collectionStats.unique >= characters.length ? 15 : 0,
  }

  // Calculate active effects from collection
  const activeEffects = collection.reduce(
    (acc, char) => {
      if (char.effect) {
        switch (char.effect.type) {
          case "gem_boost":
            acc.gemBoost += char.effect.value
            break
          case "luck_boost":
            acc.luckBoost += char.effect.value
            break
          case "timer_boost":
            acc.timerBoost += char.effect.value
            break
          case "pull_discount":
            acc.pullDiscount += char.effect.value
            break
          case "sell_boost":
            acc.sellBoost += char.effect.value
            break
          case "special":
            // Special effect adds to all boosts
            acc.gemBoost += char.effect.value
            acc.luckBoost += char.effect.value
            acc.timerBoost += char.effect.value
            acc.pullDiscount += char.effect.value
            acc.sellBoost += char.effect.value
            break
        }
      }
      return acc
    },
    { 
      gemBoost: collectionBonuses.gemBoost, 
      luckBoost: 0, 
      timerBoost: collectionBonuses.timerBoost, 
      pullDiscount: collectionBonuses.pullDiscount, 
      sellBoost: 0 
    }
  )

  // Apply effects to rates
  const adjustedRates = {
    common: Math.max(baseRates.common - activeEffects.luckBoost * 0.5, 50),
    rare: baseRates.rare,
    superRare: baseRates.superRare + activeEffects.luckBoost * 0.2,
    ultraRare: baseRates.ultraRare + activeEffects.luckBoost * 0.15,
    legendary: baseRates.legendary + activeEffects.luckBoost * 0.1,
    mythic: baseRates.mythic + activeEffects.luckBoost * 0.05,
  }

  // Normalize rates
  const totalRate = Object.values(adjustedRates).reduce((sum, rate) => sum + rate, 0)
  const normalizedRates = {
    common: (adjustedRates.common / totalRate) * 100,
    rare: (adjustedRates.rare / totalRate) * 100,
    superRare: (adjustedRates.superRare / totalRate) * 100,
    ultraRare: (adjustedRates.ultraRare / totalRate) * 100,
    legendary: (adjustedRates.legendary / totalRate) * 100,
    mythic: (adjustedRates.mythic / totalRate) * 100,
  }

  // Update gem animation when gems change
  useEffect(() => {
    const prevGems = prevGemsRef.current
    prevGemsRef.current = gems
    
    const diff = gems - prevGems
    if (diff !== 0) {
      gemAnimIdRef.current += 1
      setGemAnimation({ value: diff, id: gemAnimIdRef.current })
      const timeoutId = setTimeout(() => {
        setGemAnimation(null)
      }, 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [gems])

  // Pull a character
  const pullCharacter = (times: number = 1) => {
    const pullCost = Math.floor(100 * times * (1 - activeEffects.pullDiscount / 100))
    if (gems < pullCost || isPulling || lastPull !== null || pullResults.length > 0) return

    updateGems(-pullCost)
    setIsPulling(true)
    playSound('pull')
    
    // Update total pulls
    setLifetimeStats(prev => ({
      ...prev,
      totalPulls: prev.totalPulls + times
    }))

    setTimeout(() => {
      const results: CollectionCharacter[] = []
      
      for (let i = 0; i < times; i++) {
        // Check pity system
        const isPitySuperRare = pullsSinceLastSuperRare >= 11
        const isPityUltraRare = pullsSinceLastUltraRare >= 79

        let adjustedNormalizedRates = { ...normalizedRates }
        
        if (isPityUltraRare) {
          // Remove chances for anything below ultra-rare
          const ultraRareAndAbove = adjustedNormalizedRates.ultraRare + adjustedNormalizedRates.legendary + adjustedNormalizedRates.mythic
          adjustedNormalizedRates = {
            common: 0,
            rare: 0,
            superRare: 0,
            ultraRare: (adjustedNormalizedRates.ultraRare / ultraRareAndAbove) * 100,
            legendary: (adjustedNormalizedRates.legendary / ultraRareAndAbove) * 100,
            mythic: (adjustedNormalizedRates.mythic / ultraRareAndAbove) * 100,
          }
        } else if (isPitySuperRare) {
          // Remove chances for anything below super-rare
          const superRareAndAbove = adjustedNormalizedRates.superRare + adjustedNormalizedRates.ultraRare + 
                                  adjustedNormalizedRates.legendary + adjustedNormalizedRates.mythic
          adjustedNormalizedRates = {
            common: 0,
            rare: 0,
            superRare: (adjustedNormalizedRates.superRare / superRareAndAbove) * 100,
            ultraRare: (adjustedNormalizedRates.ultraRare / superRareAndAbove) * 100,
            legendary: (adjustedNormalizedRates.legendary / superRareAndAbove) * 100,
            mythic: (adjustedNormalizedRates.mythic / superRareAndAbove) * 100,
          }
        }

        const roll = Math.random() * 100
        let rarity: "common" | "rare" | "super-rare" | "ultra-rare" | "legendary" | "mythic"

        if (roll < adjustedNormalizedRates.mythic) {
          rarity = "mythic"
          setShowConfetti(true)
          setTimeout(() => {
            setShowConfetti(false)
            playSound('mythic')
          }, 3000)
          setPullsSinceLastSuperRare(0)
          setPullsSinceLastUltraRare(0)
        } else if (roll < adjustedNormalizedRates.mythic + adjustedNormalizedRates.legendary) {
          rarity = "legendary"
          setShowConfetti(true)
          setTimeout(() => {
            setShowConfetti(false)
            playSound('legendary')
          }, 3000)
          setPullsSinceLastSuperRare(0)
          setPullsSinceLastUltraRare(0)
        } else if (roll < adjustedNormalizedRates.mythic + adjustedNormalizedRates.legendary + adjustedNormalizedRates.ultraRare) {
          rarity = "ultra-rare"
          setShowConfetti(true)
          setTimeout(() => {
            setShowConfetti(false)
            playSound('ultraRare')
          }, 3000)
          setPullsSinceLastSuperRare(0)
          setPullsSinceLastUltraRare(0)
        } else if (
          roll <
          adjustedNormalizedRates.mythic + adjustedNormalizedRates.legendary + adjustedNormalizedRates.ultraRare + adjustedNormalizedRates.superRare
        ) {
          rarity = "super-rare"
          playSound('superRare')
          setPullsSinceLastSuperRare(0)
          setPullsSinceLastUltraRare(prev => prev + 1)
        } else if (
          roll <
          adjustedNormalizedRates.mythic +
            adjustedNormalizedRates.legendary +
            adjustedNormalizedRates.ultraRare +
            adjustedNormalizedRates.superRare +
            adjustedNormalizedRates.rare
        ) {
          rarity = "rare"
          playSound('rare')
          setPullsSinceLastSuperRare(prev => prev + 1)
          setPullsSinceLastUltraRare(prev => prev + 1)
        } else {
          rarity = "common"
          playSound('reveal')
          setPullsSinceLastSuperRare(prev => prev + 1)
          setPullsSinceLastUltraRare(prev => prev + 1)
        }

        // Update lifetime rarity stats
        setLifetimeStats(prev => ({
          ...prev,
          byRarity: {
            ...prev.byRarity,
            [rarity]: (prev.byRarity[rarity] || 0) + 1
          }
        }))

        const rarityCharacters = characters.filter((char) => char.rarity === rarity)
        const character: CollectionCharacter = {
          ...rarityCharacters[Math.floor(Math.random() * rarityCharacters.length)],
          count: 1
        }
        results.push(character)
        
        // Add to multiplayer pull log
        updatePullLog(character, username)
      }

      setPullResults(results)
      setCurrentPullIndex(0)
      
      // For 10-pulls, show the new animation
      if (times === 10) {
        setShowMultiPullAnimation(true)
      } else {
        setLastPull(results[0])
      }

      setTimeout(() => {
        setIsPulling(false)
      }, 2000)
    }, 1500)
  }

  // Handle next card in multi-pull
  const handleNextCard = () => {
    if (currentPullIndex < pullResults.length - 1) {
      setCurrentPullIndex(prev => prev + 1)
    }
  }

  // Handle previous card in multi-pull
  const handlePreviousCard = () => {
    if (currentPullIndex > 0) {
      setCurrentPullIndex(prev => prev - 1)
    }
  }

  // Update gems with animation
  const updateGems = (amount: number) => {
    setGems((prev) => prev + amount)
  }

  // Save character to collection
  const saveToCollection = () => {
    if (lastPull) {
      playSound('save')
      setCollection((prev) => {
        // If the character has an effect, always add it as a new entry with a unique ID
        if (lastPull.effect) {
          const uniqueId = Date.now() + Math.random()
          return [...prev, { ...lastPull, id: uniqueId, count: 1 }]
        }

        // For non-effect characters, stack them as before
        const existingChar = prev.find(c => c.name === lastPull.name && !c.effect)
        if (existingChar) {
          return prev.map(c => 
            c.name === lastPull.name && !c.effect
              ? { ...c, count: c.count + 1 }
              : c
          )
        }
        return [...prev, { ...lastPull, id: Date.now() + Math.random(), count: 1 }]
      })
      
      // If there are more pulls to show, show the next one
      if (currentPullIndex < pullResults.length - 1) {
        setCurrentPullIndex(prev => prev + 1)
        setLastPull(pullResults[currentPullIndex + 1])
      } else {
        setLastPull(null)
        setPullResults([])
        setCurrentPullIndex(0)
      }
    }
  }

  // Sell character
  const sellCharacter = (character: CollectionCharacter, amount: number = 1) => {
    playSound('sell')
    const sellValue = Math.floor(sellValues[character.rarity] * (1 + activeEffects.sellBoost / 100) * amount)
    updateGems(sellValue)
    
    // Update lifetime stats
    setLifetimeStats(prev => ({
      ...prev,
      totalGemsMade: prev.totalGemsMade + sellValue,
      totalCardsSold: prev.totalCardsSold + amount
    }))
    
    if (character === lastPull) {
      // If there are more pulls to show, show the next one
      if (currentPullIndex < pullResults.length - 1) {
        setCurrentPullIndex(prev => prev + 1)
        setLastPull(pullResults[currentPullIndex + 1])
      } else {
        setLastPull(null)
        setPullResults([])
        setCurrentPullIndex(0)
      }
    } else {
      setCollection((prev) => {
        // For cards with effects, remove the exact card by ID
        if (character.effect) {
          return prev.filter(c => c.id !== character.id)
        }

        // For non-effect cards, handle stacking
        const char = prev.find(c => c.id === character.id)
        if (!char || char.count <= amount) {
          return prev.filter(c => c.id !== character.id)
        }
        return prev.map(c => 
          c.id === character.id
            ? { ...c, count: c.count - amount }
            : c
        )
      })
    }
    setSelectedCharacter(null)
  }

  // Get pull count for a character
  const getCharacterPullCount = (character: Character) => {
    return collection.filter((c) => c.id === character.id).length
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600'
      case 'rare': return 'text-blue-600'
      case 'super-rare': return 'text-purple-600'
      case 'ultra-rare': return 'text-yellow-600'
      case 'legendary': return 'text-orange-600'
      case 'mythic': return 'text-pink-600'
      default: return 'text-gray-600'
    }
  }

  // Free gems every minute, affected by gem boost
  useEffect(() => {
    const timerSpeed = 1 + activeEffects.timerBoost / 100
    const interval = setInterval(() => {
      setNextGemTime((prev) => {
        if (prev <= 1) {
          // Apply gem boost
          const gemReward = Math.floor(50 * (1 + activeEffects.gemBoost / 100))
          updateGems(gemReward)
          return 60 // Reset to 60 seconds
        }
        return prev - timerSpeed
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [activeEffects.gemBoost, activeEffects.timerBoost])

  // Calculate fountain reward using exponential growth
  const calculateFountainReward = (minutes: number) => {
    // Using the exponential curve y = a * e^(bx)
    // Solved for a and b given our constraints:
    // At x=1: 10 = a * e^b
    // At x=25: 1000 = a * e^(25b)
    const b = Math.log(100) / 24 // Growth rate
    const a = 10 / Math.exp(b) // Initial value coefficient
    
    const reward = Math.floor(a * Math.exp(b * minutes))
    return Math.min(reward, 1000) // Cap at 1000
  }

  // Collect fountain reward
  const collectFountain = () => {
    const reward = calculateFountainReward(fountainTime)
    if (reward > 0) {
      playSound('save')
      updateGems(reward)
      setFountainTime(0)
      setFountainLastCollected(Date.now())
    }
  }

  // Update fountain timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedMinutes = (Date.now() - fountainLastCollected) / (60 * 1000)
      setFountainTime(Math.min(elapsedMinutes, 25))
    }, 1000)

    return () => clearInterval(interval)
  }, [fountainLastCollected])

  // Update addPullToLog to also update local state
  const updatePullLog = (character: Character, username: string) => {
    addPullToLog(character, username)
    setRecentPulls(prev => [{character, username}, ...prev].slice(0, 50))
  }

  // Calculate upgrade success chance
  const calculateUpgradeChance = (cards: CollectionCharacter[]) => {
    if (cards.length !== 10) return 0
    
    // Count how many of each unique card we have
    const cardCounts = cards.reduce((acc, card) => {
      acc[card.id] = (acc[card.id] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    // If all cards are the same, 100% chance
    if (Object.keys(cardCounts).length === 1) return 100

    // Otherwise, base 50% + up to 50% based on similarity
    const uniqueCards = Object.keys(cardCounts).length
    const similarityBonus = (10 - uniqueCards) * (50 / 9) // Each unique card reduces chance by ~5.56%
    return Math.floor(50 + similarityBonus)
  }

  // Attempt upgrade
  const attemptUpgrade = (rarity: string) => {
    const cards = selectedUpgradeCards[rarity]
    if (cards.length !== 10) return

    const chance = calculateUpgradeChance(cards)
    const success = Math.random() * 100 < chance

    // Get a random card of the next rarity for success case
    const nextRarity = getNextRarity(rarity)
    const possibleCards = characters.filter(c => c.rarity === nextRarity)
    let newCard: CollectionCharacter | undefined
    
    if (success) {
      newCard = {
        ...possibleCards[Math.floor(Math.random() * possibleCards.length)],
        count: 1,
        id: Date.now() + Math.random()
      }
    }

    // Show animation
    setUpgradeAnimationData({
      sourceCards: cards,
      resultCard: newCard,
      success
    })
    setShowUpgradeAnimation(true)

    // Wait for animation to complete before updating state
    setTimeout(() => {
      if (success && newCard) {
        // Remove the used cards
        setCollection(prev => {
          let newCollection = [...prev]
          cards.forEach(card => {
            const index = newCollection.findIndex(c => c.id === card.id)
            if (newCollection[index].count > 1) {
              newCollection[index] = { ...newCollection[index], count: newCollection[index].count - 1 }
            } else {
              newCollection = newCollection.filter(c => c.id !== card.id)
            }
          })
          
          // Add the new card
          const existingCard = newCollection.find(c => c.id === newCard.id)
          if (existingCard) {
            newCollection = newCollection.map(c => 
              c.id === newCard.id ? { ...c, count: c.count + 1 } : c
            )
          } else {
            newCollection.push(newCard)
          }
          
          return newCollection
        })

        // Show success effects
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
        playSound('legendary')
      } else {
        // Failed upgrade
        playSound('sell')
        // Return half of the cards
        const returnCount = Math.floor(cards.length / 2)
        const returnedCards = cards.slice(0, returnCount)
        
        // Remove all selected cards
        setCollection(prev => {
          let newCollection = [...prev]
          cards.forEach(card => {
            const index = newCollection.findIndex(c => c.id === card.id)
            if (newCollection[index].count > 1) {
              newCollection[index] = { ...newCollection[index], count: newCollection[index].count - 1 }
            } else {
              newCollection = newCollection.filter(c => c.id !== card.id)
            }
          })
          
          // Return half of the cards
          returnedCards.forEach(card => {
            const existingCard = newCollection.find(c => c.id === card.id)
            if (existingCard) {
              newCollection = newCollection.map(c => 
                c.id === card.id ? { ...c, count: c.count + 1 } : c
              )
            } else {
              newCollection.push({ ...card, count: 1 })
            }
          })
          
          return newCollection
        })
      }

      // Clear selected cards
      setSelectedUpgradeCards(prev => ({ ...prev, [rarity]: [] }))
    }, 4000) // Wait for animation to complete
  }

  // Select card for upgrade
  const selectCardForUpgrade = (card: CollectionCharacter) => {
    if (card.isLocked) return
    
    setSelectedUpgradeCards(prev => {
      const currentSelected = prev[card.rarity] || []
      if (currentSelected.length >= 10) return prev
      
      // Check if we have enough of this card left
      const selectedCount = currentSelected.filter(c => c.id === card.id).length
      const availableCount = collection.find(c => c.id === card.id)?.count || 0
      if (selectedCount >= availableCount) return prev

      return {
        ...prev,
        [card.rarity]: [...currentSelected, card]
      }
    })
  }

  // Remove card from upgrade selection
  const removeFromUpgrade = (rarity: string, index: number) => {
    setSelectedUpgradeCards(prev => ({
      ...prev,
      [rarity]: prev[rarity].filter((_, i) => i !== index)
    }))
  }

  // Add toggle lock function
  const toggleLock = (character: CollectionCharacter) => {
    setCollection(prev => prev.map(c => 
      c.id === character.id 
        ? { ...c, isLocked: !c.isLocked }
        : c
    ))
  }

  const renderEditionSection = (variant: string, color: string) => {
    const filteredCollection = collection.filter(c => 
      (!c.variant && variant === "normal") || c.variant === variant
    )
    if (filteredCollection.length === 0) return null

    return (
      <div className={`${variant !== "normal" ? "border-t border-pink-200 pt-4" : ""}`}>
        <h3 className={`font-semibold text-${color}-700 mb-2 flex justify-between items-center`}>
          <span>{variant.charAt(0).toUpperCase() + variant.slice(1)} Edition</span>
          <div className="flex items-center gap-2">
            {!isUpgradeMode && (
              <Button
                variant="ghost"
                size="sm"
                className={`text-${color}-600 hover:text-${color}-700`}
                onClick={() => setSelectedEditionBonus(variant)}
              >
                <Trophy className="w-4 h-4" />
              </Button>
            )}
            <span className="text-sm">
              {filteredCollection.length}/
              {characters.filter(c => (!c.variant && variant === "normal") || c.variant === variant).length}
            </span>
          </div>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {filteredCollection.map((character, index) => (
            <React.Fragment key={index}>
              {renderCharacterCard(character, variant)}
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr_300px] gap-6 w-full relative">
        {/* Left side - Pull section */}
        <div className="w-full rounded-xl bg-white p-4 shadow-lg border border-pink-200">
          <div className="text-center mb-6">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-bold text-pink-600">Sanrio Gacha</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsMuted(!isMuted)
                  setMuted(!isMuted)
                }}
                className="hover:bg-pink-100"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-pink-600" />
                ) : (
                  <Volume2 className="h-4 w-4 text-pink-600" />
                )}
              </Button>
            </div>
            <div className="flex justify-center items-center gap-2 mb-2">
              <div className="relative">
                <Badge variant="outline" className="bg-pink-100 text-pink-700 px-3 py-1">
                  <Sparkles className="w-4 h-4 mr-1" />
                  <span className="font-semibold">{gems} Gems</span>
                </Badge>
                <AnimatePresence>
                  {gemAnimation && (
                    <motion.div
                      key={gemAnimation.id}
                      initial={{ opacity: 1, y: 0 }}
                      animate={{ opacity: 0, y: gemAnimation.value > 0 ? -20 : 20 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.5 }}
                      className={`absolute left-1/2 -translate-x-1/2 ${
                        gemAnimation.value > 0 ? "text-green-500" : "text-red-500"
                      } font-bold`}
                    >
                      {gemAnimation.value > 0 ? `+${gemAnimation.value}` : gemAnimation.value}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Badge variant="outline" className="bg-purple-100 text-purple-700 px-3 py-1">
                <Heart className="w-4 h-4 mr-1" />
                <span className="font-semibold">
                  {collectionStats.unique}/{characters.length} Collected
                </span>
              </Badge>
            </div>
            <div className="flex items-center gap-2 max-w-xs mx-auto">
              <Clock className="w-4 h-4 text-pink-400" />
              <Progress value={((60 - nextGemTime) / 60) * 100} className="h-2" />
              <span className="text-xs text-pink-500">{Math.ceil(nextGemTime)}s</span>
            </div>

            {/* Active effects display */}
            {(activeEffects.gemBoost > 0 ||
              activeEffects.luckBoost > 0 ||
              activeEffects.timerBoost > 0 ||
              activeEffects.pullDiscount > 0 ||
              activeEffects.sellBoost > 0) && (
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {activeEffects.gemBoost > 0 && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                    <Sparkles className="w-3 h-3 mr-1" />+{activeEffects.gemBoost}% Gems
                  </Badge>
                )}
                {activeEffects.luckBoost > 0 && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    <Zap className="w-3 h-3 mr-1" />+{activeEffects.luckBoost}% Luck
                  </Badge>
                )}
                {activeEffects.timerBoost > 0 && (
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                    <Clock className="w-3 h-3 mr-1" />+{activeEffects.timerBoost}% Speed
                  </Badge>
                )}
                {activeEffects.pullDiscount > 0 && (
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                    <Gift className="w-3 h-3 mr-1" />
                    {activeEffects.pullDiscount}% Discount
                  </Badge>
                )}
                {activeEffects.sellBoost > 0 && (
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                    <DollarSign className="w-3 h-3 mr-1" />+{activeEffects.sellBoost}% Sell
                  </Badge>
                )}
              </div>
            )}
          </div>

          <AnimatePresence>
            {isPulling ? (
              <PullAnimation 
                currentPull={currentPullIndex + 1}
                totalPulls={pullResults.length || 1}
              />
            ) : lastPull ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="mb-6"
              >
                <CharacterCard character={lastPull} isNew={true} onClick={() => setSelectedCharacter(lastPull)} />
                <div className="flex gap-2 mt-4">
                  <Button onClick={saveToCollection} className="flex-1 bg-green-500 hover:bg-green-600">
                    <Save className="w-4 h-4 mr-2" />
                    Save to Collection
                  </Button>
                  <Button
                    onClick={() => sellCharacter(lastPull)}
                    variant="outline"
                    className="flex-1 border-amber-300 text-amber-600 hover:bg-amber-50"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Sell for {Math.floor(sellValues[lastPull.rarity] * (1 + activeEffects.sellBoost / 100))} Gems
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="h-64 flex items-center justify-center mb-6 rounded-lg bg-pink-50 border-2 border-dashed border-pink-200">
                <div className="text-center text-pink-400">
                  <Gift className="w-12 h-12 mx-auto mb-2" />
                  <p>Pull to get a cute character!</p>
                </div>
              </div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              {!isPulling && !lastPull && (
                <>
                  <Button
                    onClick={() => pullCharacter(1)}
                    disabled={gems < Math.floor(100 * (1 - activeEffects.pullDiscount / 100))}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded-full shadow-md"
                  >
                    Pull (${Math.floor(100 * (1 - activeEffects.pullDiscount / 100))} Gems)
                  </Button>
                  <Button
                    onClick={() => pullCharacter(10)}
                    disabled={gems < Math.floor(1000 * (1 - activeEffects.pullDiscount / 100))}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded-full shadow-md"
                  >
                    10 Pulls (${Math.floor(1000 * (1 - activeEffects.pullDiscount / 100))} Gems)
                  </Button>
                </>
              )}
            </div>
            {isPulling && (
              <p className="text-center text-sm text-gray-500">Please wait while your character is being revealed...</p>
            )}
            {lastPull && (
              <p className="text-center text-sm text-gray-500">Choose whether to save or sell your character</p>
            )}
          </div>
        </div>

        {/* Middle - Collection */}
        <div className="w-full rounded-xl bg-white p-4 shadow-lg border border-pink-200">
          <Tabs defaultValue="collection" className="w-full" onValueChange={(value) => setIsUpgradeMode(value === 'upgrade')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="collection">Collection</TabsTrigger>
              <TabsTrigger value="upgrade">Upgrade</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            {/* Collection Tab Content */}
            <TabsContent value="collection" className="mt-4">
              {collection.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No characters collected yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {isUpgradeMode && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h3 className="font-semibold text-blue-700 mb-2">Upgrade Mode</h3>
                      <p className="text-sm text-blue-600">Select 10 cards of the same rarity to attempt an upgrade. Higher success rate when using similar cards!</p>
                      <div className="mt-2 text-xs text-blue-500">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Using 10 identical cards guarantees success</li>
                          <li>Failed upgrades return half of the cards used</li>
                          <li>Click on a selected card to remove it</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {renderEditionSection("normal", "pink")}
                  {renderEditionSection("winter", "blue")}
                  {renderEditionSection("summer", "yellow")}
                  {renderEditionSection("halloween", "orange")}
                  {renderEditionSection("special", "purple")}
                  {renderEditionSection("anniversary", "pink")}
                </div>
              )}
            </TabsContent>

            {/* New Upgrade Tab Content */}
            <TabsContent value="upgrade" className="mt-4">
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-blue-700 mb-2">Upgrade Mode</h3>
                  <p className="text-sm text-blue-600">Select 10 cards of the same rarity to attempt an upgrade. Higher success rate when using similar cards!</p>
                  <div className="mt-2 text-xs text-blue-500">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Using 10 identical cards guarantees success</li>
                      <li>Failed upgrades return half of the cards used</li>
                      <li>Click on a selected card to remove it</li>
                    </ul>
                  </div>
                </div>

                {/* Show collection for selection */}
                <div className="space-y-6">
                  {renderEditionSection("normal", "pink")}
                  {renderEditionSection("winter", "blue")}
                  {renderEditionSection("summer", "yellow")}
                  {renderEditionSection("halloween", "orange")}
                  {renderEditionSection("special", "purple")}
                  {renderEditionSection("anniversary", "pink")}

                  {/* Selected Cards for Upgrade */}
                  {Object.entries(selectedUpgradeCards).map(([rarity, cards]) => 
                    cards.length > 0 && (
                      <div key={rarity} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-700 capitalize mb-2">{rarity} → {getNextRarity(rarity)}</h4>
                        <div className="grid grid-cols-5 gap-2 mb-2">
                          {cards.map((card, index) => (
                            <div key={index} className="relative cursor-pointer" onClick={() => removeFromUpgrade(rarity, index)}>
                              <CharacterCard character={card} isNew={false} />
                            </div>
                          ))}
                          {Array(10 - cards.length).fill(null).map((_, index) => (
                            <div key={`empty-${index}`} className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-200" />
                          ))}
                        </div>
                        <Button
                          onClick={() => attemptUpgrade(rarity)}
                          disabled={cards.length !== 10}
                          className="w-full"
                          variant="outline"
                        >
                          {cards.length === 10 ? (
                            <>Attempt Upgrade ({calculateUpgradeChance(cards)}% chance)</>
                          ) : (
                            <>Select {10 - cards.length} more card{10 - cards.length !== 1 ? 's' : ''}</>
                          )}
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Stats Tab Content */}
            <TabsContent value="stats" className="mt-4">
              <div className="space-y-6">
                {/* Current Collection Stats */}
                <div>
                  <h3 className="font-semibold text-pink-700 mb-2">Current Collection</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Common:</span>
                      <span>{collectionStats.byRarity.common || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rare:</span>
                      <span>{collectionStats.byRarity.rare || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Super Rare:</span>
                      <span>{collectionStats.byRarity["super-rare"] || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ultra Rare:</span>
                      <span>{collectionStats.byRarity["ultra-rare"] || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Legendary:</span>
                      <span>{collectionStats.byRarity.legendary || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mythic:</span>
                      <span>{collectionStats.byRarity.mythic || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Lifetime Stats */}
                <div className="border-t border-pink-200 pt-4">
                  <h3 className="font-semibold text-pink-700 mb-2">Lifetime Stats</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Pulls:</span>
                      <span>{lifetimeStats.totalPulls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cards Sold:</span>
                      <span>{lifetimeStats.totalCardsSold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gems Made:</span>
                      <span>{lifetimeStats.totalGemsMade}</span>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-pink-700 mt-3 mb-2">Total Found</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Common:</span>
                      <span>{lifetimeStats.byRarity.common}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rare:</span>
                      <span>{lifetimeStats.byRarity.rare}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Super Rare:</span>
                      <span>{lifetimeStats.byRarity["super-rare"]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ultra Rare:</span>
                      <span>{lifetimeStats.byRarity["ultra-rare"]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Legendary:</span>
                      <span>{lifetimeStats.byRarity.legendary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mythic:</span>
                      <span>{lifetimeStats.byRarity.mythic}</span>
                    </div>
                  </div>
                </div>

                {/* Pity Progress */}
                <div className="border-t border-pink-200 pt-4">
                  <h3 className="font-semibold text-pink-700 mb-2">Pity Progress</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-purple-600">Super Rare Pity:</span>
                        <span>{pullsSinceLastSuperRare}/12</span>
                      </div>
                      <Progress value={(pullsSinceLastSuperRare / 12) * 100} className="h-2 bg-purple-100" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-yellow-600">Ultra Rare Pity:</span>
                        <span>{pullsSinceLastUltraRare}/80</span>
                      </div>
                      <Progress value={(pullsSinceLastUltraRare / 80) * 100} className="h-2 bg-yellow-100" />
                    </div>
                  </div>
                </div>

                {/* Collection Summary */}
                <div className="border-t border-pink-200 pt-4">
                  <div className="flex justify-between font-semibold">
                    <span className="text-pink-700">Total Saved:</span>
                    <span>{collectionStats.total}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-pink-700">Unique Characters:</span>
                    <span>
                      {collectionStats.unique}/{characters.length}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right side - Bonuses & Info */}
        <div className="w-full space-y-4">
          {/* Prize Fountain */}
          <div className="rounded-xl bg-white p-4 shadow-lg border border-pink-200">
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-700 mb-2">Prize Fountain</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(fountainTime / 25) * 100} 
                    className="h-2 bg-blue-100" 
                  />
                  <span className="text-xs text-blue-600 min-w-[3rem]">
                    {Math.floor(fountainTime)}m
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">Current Reward:</span>
                  <span className="font-semibold text-blue-700">
                    {calculateFountainReward(fountainTime)} Gems
                  </span>
                </div>
                <Button
                  onClick={collectFountain}
                  disabled={fountainTime < 1}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  Collect Reward
                </Button>
                <p className="text-xs text-blue-600 mt-1">
                  Max reward of 1000 gems at 25 minutes
                </p>
              </div>
            </div>
          </div>

          {/* Rates */}
          <div className="rounded-xl bg-white p-4 shadow-lg border border-pink-200">
            <h3 className="font-semibold text-pink-700 mb-2">Pull Rates</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                <span>
                  Common: {normalizedRates.common.toFixed(1)}% (Sell: {sellValues.common} gems)
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
                <span>
                  Rare: {normalizedRates.rare.toFixed(1)}% (Sell: {sellValues.rare} gems)
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-400 mr-2"></div>
                <span>
                  Super Rare: {normalizedRates.superRare.toFixed(1)}% (Sell: {sellValues["super-rare"]} gems)
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                <span>
                  Ultra Rare: {normalizedRates.ultraRare.toFixed(1)}% (Sell: {sellValues["ultra-rare"]} gems)
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
                <span>
                  Legendary: {normalizedRates.legendary.toFixed(1)}% (Sell: {sellValues.legendary} gems)
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-pink-400 mr-2"></div>
                <span>
                  Mythic: {normalizedRates.mythic.toFixed(1)}% (Sell: {sellValues.mythic} gems)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Character Dialog */}
      {selectedCharacter && (
        <CharacterDialog
          character={selectedCharacter}
          isOpen={!!selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          onSell={(amount) => !selectedCharacter.isLocked && sellCharacter(selectedCharacter, amount)}
          onToggleLock={() => toggleLock(selectedCharacter)}
          pullCount={getCharacterPullCount(selectedCharacter)}
          activeEffects={activeEffects}
        />
      )}

      {/* Floating Pull Log */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-pink-200 overflow-hidden"
      >
        <div 
          className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold cursor-pointer flex items-center justify-between"
          onClick={() => setShowLog(prev => !prev)}
        >
          <span>Recent Pulls</span>
          {showLog ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
        <AnimatePresence>
          {showLog && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="max-h-64 overflow-y-auto p-3 space-y-2">
                {recentPulls.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm">No pulls yet</p>
                ) : (
                  recentPulls.map((pull, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        <img src={pull.character.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-700">{pull.username}</p>
                        <p className="text-xs text-gray-500">
                          Pulled {pull.character.name} ({pull.character.rarity})
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {showConfetti && <ConfettiAnimation />}

      {/* Bonus Dialog */}
      {selectedEditionBonus && (
        <CollectionBonusDialog
          edition={selectedEditionBonus}
          stats={collectionStats.byEdition[selectedEditionBonus]}
          isOpen={!!selectedEditionBonus}
          onClose={() => setSelectedEditionBonus(null)}
        />
      )}

      {/* Upgrade Animation */}
      {showUpgradeAnimation && upgradeAnimationData && (
        <UpgradeAnimation
          isOpen={showUpgradeAnimation}
          onClose={() => setShowUpgradeAnimation(false)}
          sourceCards={upgradeAnimationData.sourceCards}
          resultCard={upgradeAnimationData.resultCard}
          success={upgradeAnimationData.success}
        />
      )}

      {/* Multi-pull Animation */}
      {showMultiPullAnimation && pullResults.length > 0 && (
        <MultiPullAnimation
          isOpen={showMultiPullAnimation}
          onClose={() => {
            setShowMultiPullAnimation(false)
            setLastPull(null)
            setPullResults([])
            setCurrentPullIndex(0)
          }}
          pulls={pullResults}
          currentIndex={currentPullIndex}
          onSave={() => {
            // Save current card
            const currentCard = pullResults[currentPullIndex]
            setCollection((prev) => {
              // If the character has an effect, always add it as a new entry with a unique ID
              if (currentCard.effect) {
                const uniqueId = Date.now() + Math.random()
                return [...prev, { ...currentCard, id: uniqueId, count: 1 }]
              }

              // For non-effect characters, stack them as before
              const existingChar = prev.find(c => c.name === currentCard.name && !c.effect)
              if (existingChar) {
                return prev.map(c => 
                  c.name === currentCard.name && !c.effect
                    ? { ...c, count: c.count + 1 }
                    : c
                )
              }
              return [...prev, { ...currentCard, id: Date.now() + Math.random(), count: 1 }]
            })

            // Play save sound
            playSound('save')

            // Move to next card or close if last card
            if (currentPullIndex < pullResults.length - 1) {
              setCurrentPullIndex(prev => prev + 1)
            } else {
              setShowMultiPullAnimation(false)
              setLastPull(null)
              setPullResults([])
              setCurrentPullIndex(0)
            }
          }}
          onSell={() => {
            // Sell current card
            const currentCard = pullResults[currentPullIndex]
            const sellValue = Math.floor(sellValues[currentCard.rarity] * (1 + activeEffects.sellBoost / 100))
            updateGems(sellValue)
            
            // Update lifetime stats
            setLifetimeStats(prev => ({
              ...prev,
              totalGemsMade: prev.totalGemsMade + sellValue,
              totalCardsSold: prev.totalCardsSold + 1
            }))

            // Play sell sound
            playSound('sell')

            // Move to next card or close if last card
            if (currentPullIndex < pullResults.length - 1) {
              setCurrentPullIndex(prev => prev + 1)
            } else {
              setShowMultiPullAnimation(false)
              setLastPull(null)
              setPullResults([])
              setCurrentPullIndex(0)
            }
          }}
          sellValue={Math.floor(sellValues[pullResults[currentPullIndex].rarity] * (1 + activeEffects.sellBoost / 100))}
        />
      )}
    </>
  )
}

