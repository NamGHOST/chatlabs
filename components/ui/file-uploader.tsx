import React from "react"
import { useDropzone } from "react-dropzone"
import { Card } from "./card"
import { IconUpload } from "@tabler/icons-react"

interface FileUploaderProps {
  onFileSelected: (file: File) => void
  accept?: string
  maxSize?: number
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  accept,
  maxSize
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: accept ? { [accept]: [] } : undefined,
    maxSize,
    multiple: false,
    onDrop: (files: File[]) => {
      if (files[0]) {
        onFileSelected(files[0])
      }
    }
  })

  return (
    <Card
      {...getRootProps()}
      className={`hover:border-primary cursor-pointer border-2 border-dashed p-8 text-center ${
        isDragActive ? "border-primary bg-primary/10" : ""
      }`}
    >
      <input {...getInputProps()} />
      <IconUpload className="mx-auto size-8" />
      <p className="mt-2">
        {isDragActive
          ? "Drop the file here"
          : "Drag & drop an image here, or click to select"}
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        {maxSize ? `Max size: ${maxSize / 1024 / 1024}MB` : ""}
      </p>
    </Card>
  )
}
