// This is a simulated multiplayer system
// In a real app, this would connect to a database

import type { Character } from "./characters"

export interface PullLog {
  id: string
  username: string
  character: Character
  timestamp: number
}

export interface ChatMessage {
  id: string
  username: string
  message: string
  timestamp: number
}

// Simulated data
const usernames = [
  "KittyFan123",
  "MelodyLover",
  "SanrioCollector",
  "KawaiiGamer",
  "CinnamonRoll",
  "KuroLove",
  "PompomFriend",
  "HelloKittyFan",
  "TwinStarDreamer",
]

// Generate a random username
export const getRandomUsername = () => {
  return usernames[Math.floor(Math.random() * usernames.length)]
}

// Simulated pull logs
let pullLogs: PullLog[] = []

// Simulated chat messages
let chatMessages: ChatMessage[] = [
  {
    id: "1",
    username: "KittyFan123",
    message: "Hello everyone! Just joined the game!",
    timestamp: Date.now() - 3600000,
  },
  {
    id: "2",
    username: "MelodyLover",
    message: "Welcome! Hope you get some good pulls!",
    timestamp: Date.now() - 3500000,
  },
  {
    id: "3",
    username: "SanrioCollector",
    message: "I just got a mythic Hello Kitty!",
    timestamp: Date.now() - 3400000,
  },
  {
    id: "4",
    username: "KawaiiGamer",
    message: "So lucky! I'm still trying to get Kuromi",
    timestamp: Date.now() - 3300000,
  },
]

// Add a pull to the log
export const addPullToLog = (character: Character, username: string = getRandomUsername()): PullLog => {
  const newPull = {
    id: Math.random().toString(36).substring(2, 9),
    username,
    character,
    timestamp: Date.now(),
  }

  pullLogs = [newPull, ...pullLogs].slice(0, 50) // Keep only the last 50 pulls
  return newPull
}

// Get recent pulls
export const getRecentPulls = (): PullLog[] => {
  return [...pullLogs]
}

// Add a chat message
export const addChatMessage = (message: string, username: string): ChatMessage => {
  const newMessage = {
    id: Math.random().toString(36).substring(2, 9),
    username,
    message,
    timestamp: Date.now(),
  }

  chatMessages = [newMessage, ...chatMessages].slice(0, 100) // Keep only the last 100 messages
  return newMessage
}

// Get recent chat messages
export const getRecentChatMessages = (): ChatMessage[] => {
  return [...chatMessages]
}

// Simulate other users pulling characters
export const simulateOtherUsersPulling = (characters: Character[]) => {
  if (Math.random() > 0.7) {
    // 30% chance of a simulated pull
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)]
    addPullToLog(randomCharacter)
  }
}

// Simulate other users chatting
export const simulateOtherUsersChatting = () => {
  if (Math.random() > 0.9) {
    // 10% chance of a simulated chat
    const messages = [
      "Just pulled another common...",
      "Anyone got a Legendary yet?",
      "I love this game!",
      "Saving up for a 10-pull",
      "Hello everyone!",
      "Any tips for getting rare characters?",
      "I need more gems!",
      "Kuromi is my favorite!",
      "Hello Kitty forever!",
      "Just got my first Ultra Rare!",
    ]

    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    addChatMessage(randomMessage, getRandomUsername())
  }
}

