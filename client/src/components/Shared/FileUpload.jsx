// client/src/components/Shared/FileUpload.jsx
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Image, FileText, Film, Music, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { validateFile } from '@/utils/validators'
import toast from 'react-hot-toast'

const fileTypes = [
  { icon: Image, label: 'Images', accept: 'image/*', color: 'text-blue-500' },
  { icon: Film, label: 'Videos', accept: 'video/*', color: 'text-purple-500' },
  { icon: Music, label: 'Audio', accept: 'audio/*', color: 'text-green-500' },
  { icon: FileText, label: 'Documents', accept: '.pdf,.doc,.docx,.txt', color: 'text-orange-500' },
]

export default function FileUpload({ onFileSelect, onClose }) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFiles = (files) => {
    const validFiles = []
    
    for (const file of files) {
      const validation = validateFile(file)
      if (validation.isValid) {
        validFiles.push(file)
      } else {
        toast.error(validation.error)
      }
    }

    if (validFiles.length > 0) {
      onFileSelect(validFiles)
    }
  }

  const handleTypeClick = (accept) => {
    if (inputRef.current) {
      inputRef.current.accept = accept
      inputRef.current.click()
    }
  }

  const handleInputChange = (e) => {
    const files = Array.from(e.target.files)
    handleFiles(files)
    e.target.value = ''
  }

  return (
    <div className="w-64 bg-background border rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Attach files</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* File type buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {fileTypes.map(({ icon: Icon, label, accept, color }) => (
          <button
            key={label}
            onClick={() => handleTypeClick(accept)}
            className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <Icon className={cn("h-6 w-6", color)} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted"
        )}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop files here or click above
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}