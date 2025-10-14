// src/components/chatroom/session/ChatPanel.tsx
'use client';
import { CloudinaryUploadWidgetResults } from "next-cloudinary";
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Paperclip, FileText, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { sendMessage } from '@/lib/redux/slices/sessionSlice';
import type { SafeUser } from '@/types';
import { CldUploadWidget } from "next-cloudinary";
import { useToast } from "@/hooks/use-toast";
import { ChatroomMessage, UploadedFile } from "@/lib/redux/slices/session/types";
import Link from "next/link";


interface ChatPanelProps {
  user: SafeUser | null;
  isHost: boolean;
}

export default function ChatPanel({ user, isHost }: ChatPanelProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const activeSession = useAppSelector(state => state.session.activeSession);
  const messages = activeSession?.messages || [];
  const [newMessage, setNewMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<UploadedFile | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user || !activeSession) return null;

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachedFile) return;
    
    setIsSending(true);
    const messageContent = {
      text: newMessage.trim(),
      file: attachedFile,
    };

    try {
      await dispatch(sendMessage({
        sessionId: activeSession.id,
        content: JSON.stringify(messageContent),
      })).unwrap();
      setNewMessage('');
      setAttachedFile(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur d'envoi",
        description: error.message || "Impossible d'envoyer le message.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleUploadSuccess = (result: CloudinaryUploadWidgetResults) => {
    if (result.event === "success") {
      const info = result.info;
      if (info && typeof info === 'object' && 'secure_url' in info && 'resource_type' in info && 'original_filename' in info && 'format' in info) {
        setAttachedFile({
          url: info.secure_url,
          type: info.resource_type,
          name: info.original_filename,
          format: info.format,
        });
      }

      if (info && typeof info === 'object' && 'original_filename' in info) {
        toast({ title: "Fichier prêt", description: `${(info as any).original_filename} est prêt à être envoyé.` });
      } else {
        toast({ title: "Fichier prêt", description: "Le fichier est prêt à être envoyé." });
      }
    }
  };

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const renderMessageContent = (msg: ChatroomMessage) => {
    try {
      const content = JSON.parse(msg.content);
      return (
        <div className="space-y-2">
          {content.text && <p className="text-sm whitespace-pre-wrap">{content.text}</p>}
          {content.file && (
            <div className="mt-2">
              {content.file.type === 'image' ? (
                // Using a simple img tag for now to avoid hydration issues with next/image in certain contexts
                // Consider using a component that wraps next/image with error handling or a dynamic import if needed
                <Link href={content.file.url} target="_blank" rel="noopener noreferrer">
                  <img src={content.file.url} alt={content.file.name} className="rounded-md object-cover max-w-full h-auto w-48" />
                </Link>
              ) : content.file.name ? (
                <Link href={content.file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-muted/50 rounded-md hover:bg-muted">
                  <FileText className="h-5 w-5 text-primary" />
                  {/* Ensure content.file.name is not undefined before rendering */}
                  <span className="text-xs font-medium truncate">{content.file.name}</span>
                </Link>
              ) : null} {/* Added the 'else' case with null */}

            </div>
          )}
        </div>
      );
    } catch (e) {
      return <p className="text-sm whitespace-pre-wrap">{msg.content}</p>;
    }
  };

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Chat de la session</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg: ChatroomMessage) => (
              <div key={msg.id} className={`flex items-start gap-3 ${msg.authorId === user.id ? 'justify-end' : ''}`}>
                {msg.authorId !== user.id && (
                  <img src={(msg.author).img || `https://api.dicebear.com/8.x/bottts/svg?seed=${(msg.author as any).name}`} alt={(msg.author as any).name || 'avatar'} className="w-8 h-8 rounded-full" />
                )}
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.authorId === user.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold">{(msg.author).name}</p>
                    <p className="text-xs opacity-70">{formatTime(msg.createdAt)}</p>
                  </div>
                  {renderMessageContent(msg)}
                </div>
                 {msg.authorId === user.id && (
                  <img src={user.img || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.name}`} alt={user.name || 'avatar'} className="w-8 h-8 rounded-full" />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background">
          {attachedFile && (
            <div className="mb-2 p-2 border rounded-md flex items-center justify-between text-sm bg-muted/50">
                <div className="flex items-center gap-2 truncate">
                    {attachedFile.type === 'image' ? <ImageIcon size={16}/> : <FileText size={16}/>}
                    <span className="truncate">{attachedFile.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachedFile(null)}>
                    <X size={16}/>
                </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Votre message..."
              onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
              className="bg-card"
              disabled={isSending}
            />
            <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
                options={{ multiple: false }}
                onSuccess={handleUploadSuccess}
                onError={(error) => toast({ variant: "destructive", title: "Erreur d'upload", description: "Vérifiez la configuration Cloudinary." })}
            >
                {({ open }) => (
                     <Button variant="ghost" size="icon" onClick={() => open()} disabled={isSending || !!attachedFile}>
                        <Paperclip className="w-5 h-5" />
                    </Button>
                )}
            </CldUploadWidget>

            <Button onClick={handleSendMessage} size="icon" title="Envoyer" disabled={isSending || (!newMessage.trim() && !attachedFile)}>
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
