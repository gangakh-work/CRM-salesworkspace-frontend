import { Upload } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface FileUploadProps {
  accept?: string
  multiple?: boolean
  onFilesSelected?: (files: FileList) => void
  className?: string
  disabled?: boolean
  label?: string
  description?: string
}

export function FileUpload({
  accept,
  multiple,
  onFilesSelected,
  className,
  disabled,
  label = 'Upload files',
  description = 'Drag and drop or click to browse',
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      onFilesSelected?.(files)
    }
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        if (!disabled) handleFiles(e.dataTransfer.files)
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <Upload className="mb-3 size-8 text-muted-foreground" />
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
