'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Image, Film, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FileUploadProps {
  label: string
  accept?: string
  maxSize?: number
  onUpload: (file: File) => Promise<void>
  onRemove?: () => void
  currentFile?: { name: string; url?: string } | null
  className?: string
  required?: boolean
  disabled?: boolean
}

export function FileUpload({
  label,
  accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.mp4',
  maxSize = 50 * 1024 * 1024,
  onUpload,
  onRemove,
  currentFile,
  className = '',
  required = false,
  disabled = false,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return Image
    if (['mp4', 'avi', 'mov', 'mkv'].includes(ext || '')) return Film
    return FileText
  }

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum (${(maxSize / 1024 / 1024).toFixed(0)}MB)`
    }
    if (accept) {
      const allowedExts = accept.split(',').map(e => e.trim().toLowerCase())
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!allowedExts.includes(fileExt)) {
        return `File type ${fileExt} is not allowed. Accepted: ${accept}`
      }
    }
    return null
  }

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setUploadState('error')
      return
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    setUploadState('uploading')
    setProgress(0)

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      await onUpload(file)
      clearInterval(progressInterval)
      setProgress(100)
      setUploadState('success')
    } catch (err) {
      clearInterval(progressInterval)
      setUploadState('error')
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }, [onUpload, maxSize, accept])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile, disabled])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }, [disabled])

  const handleDragLeave = useCallback(() => setIsDragOver(false), [])

  const handleClick = () => {
    if (!disabled && fileInputRef.current) fileInputRef.current.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemove = () => {
    setUploadState('idle')
    setProgress(0)
    setError(null)
    setPreview(null)
    onRemove?.()
  }

  const FileIcon = currentFile ? getFileIcon(currentFile.name) : FileText

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <AnimatePresence mode="wait">
        {currentFile && uploadState !== 'uploading' ? (
          <motion.div
            key="file-preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <FileIcon className="w-6 h-6 text-green-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentFile.name}</p>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Uploaded
              </p>
            </div>
            {!disabled && (
              <button onClick={handleRemove} className="p-1 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </motion.div>
        ) : uploadState === 'uploading' ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Uploading...</span>
              <span className="text-sm text-blue-600 ml-auto">{progress}%</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              disabled ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' :
              isDragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : error
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
          >
            {error ? (
              <>
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <p className="text-xs text-gray-500 mt-1">Click to try again</p>
              </>
            ) : (
              <>
                <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isDragOver ? 'Drop file here' : 'Click to upload or drag & drop'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {accept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')} - Max {(maxSize / 1024 / 1024).toFixed(0)}MB
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
