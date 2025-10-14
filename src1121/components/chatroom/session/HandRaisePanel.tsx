
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hand, HandMetal, Users, Clock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { lowerHand, clearAllRaisedHands } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';

interface HandRaisePanelProps {
  isTeacher?: boolean;
}

export default function HandRaisePanel({ isTeacher = false }: HandRaisePanelProps) {
  const dispatch = useAppDispatch();
  const { activeSession } = useAppSelector(state => state.session);

  if (!activeSession) {
    return null;
  }

  const raisedHandsData = (activeSession.raisedHands || []).map(studentId => {
    const participant = activeSession.participants.find(p => p.id === studentId);
    return participant;
  }).filter(Boolean);

  const handleLowerHand = (studentId: string) => {
    const student = activeSession.participants.find(p => p.id === studentId);
    if (student) {
      dispatch(lowerHand(studentId));
      dispatch(addNotification({
        type: 'hand_lowered',
        title: 'Main baissée',
        message: `${student.name} a baissé la main`,
      }));
    }
  };

  const handleClearAllHands = () => {
    dispatch(clearAllRaisedHands());
    dispatch(addNotification({
      type: 'all_hands_cleared',
      title: 'Toutes les mains baissées',
      message: 'Toutes les levées de main ont été effacées',
    }));
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(dateString).getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}min`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)}h`;
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hand className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Levées de main</CardTitle>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {raisedHandsData.length}
          </Badge>
        </div>
        <CardDescription>
          {raisedHandsData.length === 0 
            ? "Aucune main levée actuellement"
            : `${raisedHandsData.length} élève${raisedHandsData.length > 1 ? 's ont' : ' a'} levé la main`
          }
        </CardDescription>
      </CardHeader>
      
      {raisedHandsData.length > 0 && (
        <CardContent className="space-y-4">
          <ScrollArea className="max-h-60">
            <div className="space-y-2">
              {raisedHandsData.map((student, index) => (
                <div
                  key={student?.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={student?.img || `https://api.dicebear.com/8.x/bottts/svg?seed=${student?.name}`}
                        alt={student?.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <HandMetal className="w-2 h-2 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{student?.name}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {student?.raisedHandAt && formatTimeAgo(student.raisedHandAt)}
                        <span className="ml-1">#{index + 1}</span>
                      </div>
                    </div>
                  </div>
                  
                  {isTeacher && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLowerHand(student?.id || '')}
                      className="text-xs px-2 py-1"
                    >
                      Baisser
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {isTeacher && raisedHandsData.length > 1 && (
            <div className="pt-2 border-t">
              <Button
                onClick={handleClearAllHands}
                variant="outline"
                size="sm"
                className="w-full text-gray-600 hover:text-gray-800"
              >
                Baisser toutes les mains
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
