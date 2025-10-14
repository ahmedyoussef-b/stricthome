// src/components/announcements/AnnouncementContent.tsx
import Link from 'next/link';
import Image from 'next/image';
import { FileText } from 'lucide-react';
import type { AnnouncementWithClass } from "@/types/index";

interface AnnouncementContentProps {
  announcement: AnnouncementWithClass;
}

const AnnouncementContent: React.FC<AnnouncementContentProps> = ({ announcement }) => {
  try {
    const fileInfo = JSON.parse(announcement.description || '{}');
    
    const textContent = fileInfo.text ? (
      <p className="text-muted-foreground whitespace-pre-wrap break-words mb-3">{fileInfo.text}</p>
    ) : null;

    let filesContent = null;
    if (fileInfo.files && Array.isArray(fileInfo.files) && fileInfo.files.length > 0) {
      if (fileInfo.files.length > 1) {
        filesContent = (
          <div className="max-w-lg grid grid-cols-2 sm:grid-cols-3 gap-2">
            {fileInfo.files.map((file: any, index: number) => (
              <Link key={index} href={file.url} target="_blank" rel="noopener noreferrer" className="block w-full relative aspect-square rounded-md overflow-hidden group bg-muted/50">
                <Image
                  src={file.url}
                  alt={`${announcement.title} - image ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  className="group-hover:opacity-80 transition-opacity"
                />
              </Link>
            ))}
          </div>
        );
      } else {
        const file = fileInfo.files[0];
        const fileType = file.type === 'raw' ? 'pdf' : file.type;

        if (fileType === 'image') {
          filesContent = (
            <Link href={file.url} target="_blank" rel="noopener noreferrer" className="block w-full max-w-md relative aspect-video bg-muted/20 rounded-lg overflow-hidden group-hover:opacity-90 transition-opacity">
              <Image 
                src={file.url} 
                alt={announcement.title} 
                fill
                sizes="(max-width: 768px) 100vw, 33vw" 
                className="object-contain"
              />
            </Link>
          );
        } else {
          filesContent = (
            <Link href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
              <FileText className="h-4 w-4"/>
              Voir le document
            </Link>
          );
        }
      }
    } else if (fileInfo.fileUrl && fileInfo.fileType) {
        // Legacy support
        const fileType = fileInfo.fileType === 'raw' ? 'pdf' : fileInfo.fileType;
        if (fileType === 'image') {
          filesContent = (
             <Link href={fileInfo.fileUrl} target="_blank" rel="noopener noreferrer" className="block w-full max-w-md relative aspect-video bg-muted/20 rounded-lg overflow-hidden group-hover:opacity-90 transition-opacity">
              <Image 
                src={fileInfo.fileUrl} 
                alt={announcement.title} 
                fill
                sizes="(max-width: 768px) 100vw, 33vw" 
                className="object-contain"
              />
            </Link>
          );
        } else {
            filesContent = (
                <Link href={fileInfo.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                    <FileText className="h-4 w-4"/>
                    Voir le document
                </Link>
            );
        }
    }

    if (textContent || filesContent) {
        return (
            <div>
                {textContent}
                {filesContent}
            </div>
        );
    }

    return <p className="text-muted-foreground whitespace-pre-wrap break-words">{announcement.description}</p>;

  } catch (e) {
    return <p className="text-muted-foreground whitespace-pre-wrap break-words">{announcement.description}</p>;
  }
};

export default AnnouncementContent;
