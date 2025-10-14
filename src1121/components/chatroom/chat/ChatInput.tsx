import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ 
  value, 
  onChange, 
  onSend, 
  placeholder = "Tapez votre message...",
  disabled = false
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="flex-1"
        disabled={disabled}
      />
      <Button
        onClick={onSend}
        disabled={disabled || !value.trim()}
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}