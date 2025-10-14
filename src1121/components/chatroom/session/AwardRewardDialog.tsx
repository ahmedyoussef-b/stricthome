import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift } from 'lucide-react';
import { BADGE_TEMPLATES } from '@/lib/redux/slices/session/types';
import { useState } from 'react';

interface AwardRewardDialogProps {
  participants: Array<{ id: string; name: string }>;
  onAward: (data: {
    studentId: string;
    points: number;
    badge?: {
      type: string;
      name: string;
      description: string;
      icon: React.ReactNode;
    };
    reason: string;
  }) => void;
}

export function AwardRewardDialog({ participants, onAward }: AwardRewardDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [points, setPoints] = useState('10');
  const [badgeType, setBadgeType] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!selectedStudent || !points || !reason) return;

    const badge = badgeType ? BADGE_TEMPLATES.find(b => b.type === badgeType) : undefined;

    onAward({
      studentId: selectedStudent,
      points: parseInt(points),
      badge: badge ? {
        type: badge.type,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
      } : undefined,
      reason,
    });

    // Reset form
    setSelectedStudent('');
    setPoints('10');
    setBadgeType('');
    setReason('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full flex items-center gap-2">
          <Gift className="w-4 h-4" />
          Attribuer une récompense manuelle
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attribuer une récompense</DialogTitle>
          <DialogDescription>
            Récompensez un élève pour sa participation ou ses efforts.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="student">Élève</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner un élève" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="mt-1"
              min="1"
              max="100"
            />
          </div>
          
          <div>
            <Label htmlFor="badge">Badge (optionnel)</Label>
            <Select value={badgeType} onValueChange={setBadgeType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Aucun badge" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun badge</SelectItem>
                {BADGE_TEMPLATES.map((badge) => (
                  <SelectItem key={badge.type} value={badge.type}>
                    {badge.icon} {badge.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="reason">Raison</Label>
            <Textarea
              id="reason"
              placeholder="Pourquoi cette récompense ?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedStudent || !points || !reason}
          >
            Attribuer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}