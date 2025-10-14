// src/components/messaging/MessageForm.tsx
'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';

interface MessageFormProps {
    recipientId: string;
    onSend: () => void;
}

const MessageForm: React.FC<MessageFormProps> = ({ recipientId, onSend }) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            toast({
                variant: 'destructive',
                title: 'Message vide',
                description: "Veuillez écrire un message avant de l'envoyer.",
            });
            return;
        }

        setIsSending(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log(`Sending message to ${recipientId}: ${message}`);
        
        setIsSending(false);
        setMessage('');

        toast({
            title: 'Message Envoyé',
            description: 'Votre message a été envoyé avec succès. (Simulation)',
        });
        
        onSend(); // Close the modal after sending
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <Textarea
                placeholder="Écrivez votre message ici..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                disabled={isSending}
                className="resize-none"
            />
            <Button type="submit" disabled={isSending || !message.trim()} className="w-full">
                {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Send className="mr-2 h-4 w-4" />
                )}
                {isSending ? 'Envoi en cours...' : 'Envoyer le Message'}
            </Button>
        </form>
    );
}

export default MessageForm;
