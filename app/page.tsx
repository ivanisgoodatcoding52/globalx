"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { supabase, type Message, type User, type TypingIndicator } from "@/lib/supabase"
import { UsernameModal } from "@/components/username-modal"
import { MessageItem } from "@/components/message-item"
import { TypingIndicators } from "@/components/typing-indicators"
import { FileUpload } from "@/components/file-upload"

export default function ChatApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showUsernameModal, setShowUsernameModal] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle username submission
  const handleUsernameSubmit = async (username: string) => {
    try {
      // Check if username exists
      const { data: existingUser } = await supabase.from("users").select("*").eq("username", username).single()

      let user: User

      if (existingUser) {
        // Update last_seen for existing user
        const { data, error } = await supabase
          .from("users")
          .update({ last_seen: new Date().toISOString() })
          .eq("username", username)
          .select()
          .single()

        if (error) throw error
        user = data
      } else {
        // Create new user
        const { data, error } = await supabase.from("users").insert({ username }).select().single()

        if (error) throw error
        user = data
      }

      setCurrentUser(user)
      setShowUsernameModal(false)
      alert(`Welcome to the chat, ${username}!`)
    } catch (error) {
      console.error("Error setting username:", error)
      alert("Failed to join chat. Please try again.")
    }
  }

  // Load initial messages
  useEffect(() => {
    if (!currentUser) return

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100)

      if (error) {
        console.error("Error loading messages:", error)
        return
      }

      setMessages(data || [])
    }

    loadMessages()
  }, [currentUser])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentUser) return

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel("messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message])
      })
      .subscribe()

    // Subscribe to typing indicators
    const typingSubscription = supabase
      .channel("typing_indicators")
      .on("postgres_changes", { event: "*", schema: "public", table: "typing_indicators" }, async () => {
        const { data } = await supabase
          .from("typing_indicators")
          .select("*")
          .eq("is_typing", true)
          .gte("updated_at", new Date(Date.now() - 10000).toISOString()) // Last 10 seconds

        setTypingUsers(data || [])
      })
      .subscribe()

    // Subscribe to user presence
    const usersSubscription = supabase
      .channel("users")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, async () => {
        const { data } = await supabase
          .from("users")
          .select("*")
          .gte("last_seen", new Date(Date.now() - 300000).toISOString()) // Last 5 minutes

        setOnlineUsers(data || [])
      })
      .subscribe()

    return () => {
      messagesSubscription.unsubscribe()
      typingSubscription.unsubscribe()
      usersSubscription.unsubscribe()
    }
  }, [currentUser])

  // Update typing indicator
  const updateTypingIndicator = async (isTyping: boolean) => {
    if (!currentUser) return

    await supabase.from("typing_indicators").upsert(
      {
        user_id: currentUser.id,
        username: currentUser.username,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
  }

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set typing indicator
    updateTypingIndicator(true)

    // Clear typing indicator after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingIndicator(false)
    }, 3000)
  }

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser || isLoading) return

    setIsLoading(true)

    try {
      // Clear typing indicator
      await updateTypingIndicator(false)

      const { error } = await supabase.from("messages").insert({
        user_id: currentUser.id,
        username: currentUser.username,
        content: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Send file message
  const handleFileUploaded = async (fileData: {
    url: string
    name: string
    type: string
    size: number
  }) => {
    if (!currentUser) return

    try {
      const { error } = await supabase.from("messages").insert({
        user_id: currentUser.id,
        username: currentUser.username,
        file_url: fileData.url,
        file_name: fileData.name,
        file_type: fileData.type,
        file_size: fileData.size,
      })

      if (error) throw error
    } catch (error) {
      console.error("Error sending file message:", error)
      alert("Failed to send file. Please try again.")
    }
  }

  // Update user presence periodically
  useEffect(() => {
    if (!currentUser) return

    const updatePresence = () => {
      supabase.from("users").update({ last_seen: new Date().toISOString() }).eq("id", currentUser.id).then()
    }

    const interval = setInterval(updatePresence, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [currentUser])

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: '"Segoe UI", Tahoma, sans-serif' }}>
      <UsernameModal isOpen={showUsernameModal} onSubmit={handleUsernameSubmit} />

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-title">👥 Online Users ({onlineUsers.length})</div>
        <div className="user-list">
          {onlineUsers.map((user) => (
            <div key={user.id} className="user-item">
              <div className="online-dot"></div>
              <span>{user.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Window */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", margin: "8px" }}>
        <div className="chat-window" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="title-bar">
            <span>💬 Global Chat Room</span>
            <div className="window-controls">
              <div className="window-control">_</div>
              <div className="window-control">□</div>
              <div className="window-control">×</div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="message-area">
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} isCurrentUser={message.user_id === currentUser?.id} />
            ))}
            <TypingIndicators typingUsers={typingUsers} currentUsername={currentUser?.username || ""} />
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="input-area">
            <FileUpload onFileUploaded={handleFileUploaded} />
            <form onSubmit={sendMessage} style={{ display: "flex", flex: 1, gap: "4px" }}>
              <input
                className="message-input"
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type your message here..."
                disabled={isLoading}
              />
              <button type="submit" className="win7-button" disabled={!newMessage.trim() || isLoading}>
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
