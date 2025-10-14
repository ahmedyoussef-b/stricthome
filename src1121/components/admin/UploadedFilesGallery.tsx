"use client";

import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import Image from "next/image";

interface UploadedFile {
  url: string;
  type: string;
}

interface UploadedFilesGalleryProps {
  files: UploadedFile[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export function UploadedFilesGallery({ files, onRemove, disabled }: UploadedFilesGalleryProps) {
  return (
    <div className="mt-2 p-4 border rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
      {files.map((file, index) => (
        <div key={index} className="relative group">
          <div className="aspect-square w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            {file.type === 'image' ? 
              <Image src={file.url} alt={`Preview ${index}`} fill sizes="100px" className="object-cover" /> : 
              <FileText className="h-10 w-10 text-muted-foreground" />}
          </div>
          <p className="text-xs truncate mt-1 text-muted-foreground">{file.url.split('/').pop()}</p>
          <Button 
            type="button" 
            variant="destructive" 
            size="icon" 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(index)} 
            disabled={disabled}
          >
            <Trash2 className="h-3 w-3"/>
          </Button>
        </div>
      ))}
    </div>
  );
}