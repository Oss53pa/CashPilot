'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onUpload: (file: File) => void;
  label?: string;
}

export function FileUpload({
  accept,
  maxSize,
  onUpload,
  label = 'Upload a file',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (accept) {
        const accepted = accept.split(',').map((t) => t.trim());
        const matches = accepted.some((type) => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.replace('/*', '/'));
          }
          return file.type === type;
        });
        if (!matches) {
          setError('File type not accepted.');
          return;
        }
      }

      if (maxSize && file.size > maxSize) {
        setError(`File exceeds maximum size of ${(maxSize / (1024 * 1024)).toFixed(1)} MB.`);
        return;
      }

      setFileName(file.name);
      onUpload(file);
    },
    [accept, maxSize, onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Drag and drop or click to browse
        </p>
        {fileName && (
          <p className="mt-2 text-sm text-primary">{fileName}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
