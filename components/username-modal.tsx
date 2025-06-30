"use client"

import type React from "react"
import { useState } from "react"

interface UsernameModalProps {
  isOpen: boolean
  onSubmit: (username: string) => void
}

export function UsernameModal({ isOpen, onSubmit }: UsernameModalProps) {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setIsLoading(true)
    await onSubmit(username.trim())
    setIsLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-window">
        <div className="title-bar">
          <span>Join Chat</span>
          <div className="window-controls">
            <div className="window-control">_</div>
            <div className="window-control">□</div>
            <div className="window-control">×</div>
          </div>
        </div>
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Enter your username:
              </label>
              <input
                id="username"
                className="form-input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                disabled={isLoading}
              />
            </div>
            <div className="button-group">
              <button type="submit" className="win7-button" disabled={!username.trim() || isLoading}>
                {isLoading ? "Joining..." : "Join Chat"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
