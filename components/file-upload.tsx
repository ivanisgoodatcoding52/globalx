"use client"

import type React from "react"
import { useState, useRef } from "react"

interface FileUploadProps {
  onFileUploaded: (fileData: {
    url: string
    name: string
    type: string
    size: number
  }) => void
}

export function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const fileData = await response.json()
      onFileUploaded(fileData)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      alert(`File uploaded successfully: ${selectedFile.name}`)
    } catch (error) {
      console.error("Upload error:", error)
      alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsUploading(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="upload-area">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        style={{ display: "none" }}
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
      />

      {selectedFile ? (
        <div className="file-selected">
          <span style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedFile.name}
          </span>
          <button className="win7-button" style={{ padding: "1px 4px", fontSize: "9px" }} onClick={clearSelection}>
            ×
          </button>
          <button
            className="win7-button"
            style={{ padding: "1px 6px", fontSize: "9px" }}
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? "..." : "Send"}
          </button>
        </div>
      ) : (
        <button
          className="win7-button"
          style={{ padding: "2px 6px", fontSize: "10px" }}
          onClick={() => fileInputRef.current?.click()}
        >
          📎
        </button>
      )}
    </div>
  )
}
