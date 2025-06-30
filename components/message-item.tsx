"use client"

import type { Message } from "@/lib/supabase"

interface MessageItemProps {
  message: Message
  isCurrentUser: boolean
}

export function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const renderFilePreview = () => {
    if (!message.file_url || !message.file_type) return null

    if (message.file_type.startsWith("image/")) {
      return (
        <div className="file-preview">
          <img
            src={message.file_url || "/placeholder.svg"}
            alt={message.file_name}
            onClick={() => window.open(message.file_url, "_blank")}
            style={{ cursor: "pointer" }}
          />
        </div>
      )
    }

    if (message.file_type.startsWith("video/")) {
      return (
        <div className="file-preview">
          <video src={message.file_url} controls />
        </div>
      )
    }

    return (
      <div className="file-info">
        <div className="file-icon">📄</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: "bold",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {message.file_name}
          </div>
          <div style={{ fontSize: "9px", color: "#666" }}>
            {message.file_size ? formatFileSize(message.file_size) : ""}
          </div>
        </div>
        <button
          className="win7-button"
          style={{ padding: "2px 6px", fontSize: "9px" }}
          onClick={() => window.open(message.file_url, "_blank")}
        >
          Open
        </button>
      </div>
    )
  }

  return (
    <div className={`message-item ${isCurrentUser ? "own" : ""}`}>
      <div className="message-avatar">{message.username.charAt(0).toUpperCase()}</div>
      <div>
        <div className="message-header">
          <strong>{message.username}</strong> - {formatTime(message.created_at)}
        </div>
        {message.content && <div className={`message-content ${isCurrentUser ? "own" : ""}`}>{message.content}</div>}
        {renderFilePreview()}
      </div>
    </div>
  )
}
