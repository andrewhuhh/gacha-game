"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, MessageSquare, Trophy } from "lucide-react"
import {
  getRecentPulls,
  getRecentChatMessages,
  addChatMessage,
  simulateOtherUsersPulling,
  simulateOtherUsersChatting,
  type PullLog,
  type ChatMessage,
} from "@/lib/multiplayer"
import { characters } from "@/lib/characters"
import { formatDistanceToNow } from "date-fns"

interface MultiplaterPanelProps {
  username: string
}

export default function MultiplayerPanel({ username }: MultiplaterPanelProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [pullLogs, setPullLogs] = useState<PullLog[]>([])
  const [message, setMessage] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Fetch initial data
  useEffect(() => {
    setChatMessages(getRecentChatMessages())
    setPullLogs(getRecentPulls())

    // Set up interval to simulate other users
    const interval = setInterval(() => {
      simulateOtherUsersPulling(characters)
      simulateOtherUsersChatting()

      // Update our state
      setChatMessages(getRecentChatMessages())
      setPullLogs(getRecentPulls())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Send a chat message
  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = addChatMessage(message, username)
      setChatMessages([newMessage, ...chatMessages])
      setMessage("")
    }
  }

  // Handle Enter key in chat input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-pink-200 overflow-hidden">
      <Tabs defaultValue="chat">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>Global Chat</span>
          </TabsTrigger>
          <TabsTrigger value="pulls" className="flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            <span>Recent Pulls</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="p-0">
          <div className="flex flex-col h-[300px]">
            <ScrollArea className="flex-1 p-3">
              <div className="flex flex-col-reverse gap-2">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.username === username ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg ${
                        msg.username === username ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <div className="flex flex-col items-start gap-1 mt-1 text-xs text-gray-500">
                      <span className="font-medium">{msg.username}</span>
                      <span> •</span>
                      <span>{formatDistanceToNow(msg.timestamp, { addSuffix: true })}</span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pulls" className="p-0">
          <ScrollArea className="h-[300px] p-3">
            <div className="space-y-3">
              {pullLogs.map((pull) => {
                const rarityColor =
                  pull.character.rarity === "common"
                    ? "bg-gray-100 text-gray-700"
                    : pull.character.rarity === "rare"
                      ? "bg-blue-100 text-blue-700"
                      : pull.character.rarity === "super-rare"
                        ? "bg-purple-100 text-purple-700"
                        : pull.character.rarity === "ultra-rare"
                          ? "bg-yellow-100 text-yellow-700"
                          : pull.character.rarity === "legendary"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-pink-100 text-pink-700"

                return (
                  <div key={pull.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <img
                        src={pull.character.image || "/placeholder.svg"}
                        alt={pull.character.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">{pull.username}</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(pull.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-medium text-sm">{pull.character.name}</span>
                        <Badge className={`text-xs ${rarityColor}`}>{pull.character.rarity}</Badge>
                        {pull.character.variant && pull.character.variant !== "normal" && (
                          <Badge variant="outline" className="text-xs">
                            {pull.character.variant}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {pullLogs.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  <p>No pulls recorded yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

