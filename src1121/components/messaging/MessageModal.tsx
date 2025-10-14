// src/components/messaging/MessageModal.tsx
'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import MessageForm from './MessageForm';

interface MessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    recipientId: string;
}

const MessageModal: React.FC<MessageModalProps> = ({ isOpen, onClose, recipientName, recipientId }) => {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Envoyer un message à {recipientName}</DialogTitle>
                    <DialogDescription>
                        Votre message sera envoyé directement au parent. (Simulation)
                    </DialogDescription>
                </DialogHeader>
                <MessageForm recipientId={recipientId} onSend={onClose} />
            </DialogContent>
        </Dialog>
    );
}

export default MessageModal;
