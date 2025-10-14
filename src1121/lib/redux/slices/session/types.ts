// src/lib/redux/slices/session/types.ts
import { SafeUser } from '@/types';
import { ThumbsUp, ThumbsDown, Laugh, Meh, Smile, SmilePlus, Heart } from 'lucide-react';
import { Role } from '@prisma/client';

export type BadgeType = 'participation' | 'correct_answer' | 'helpful' | 'creative' | 'leader' | 'consistent';
export type ReactionType = 'thumbs_up' | 'thumbs_down' | 'heart' | 'laugh' | 'understood' | 'confused';
export type SessionType = 'CLASS' | 'MEETING';
export type RewardActionType = 'manual' | 'quiz_correct' | 'participation' | 'poll_vote';


export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
  quizId?: string; // Make quizId optional here
}

export interface QuizAnswer {
  questionId: string;
  selectedOption: number;
  studentId: string;
  isCorrect: boolean;
  answeredAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  currentQuestionIndex: number;
  timeRemaining: number;
  isActive: boolean;
  startTime?: string;
  endTime?: string;
}
export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  createdAt: string;
  isActive: boolean;
  endedAt?: string;
}


export interface Badge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  icon: string | React.ReactNode;
  earnedAt: string;
}

export interface SessionParticipant {
  id: string; // This should be the unique ID of the participant (user ID)
  userId: string; // Ensure userId is always present
  name: string;
  email: string;
  role: Role;
  img?: string | null;
  isOnline: boolean;
  isInSession: boolean;
  hasRaisedHand?: boolean;
  raisedHandAt?: string;
  points: number;
  badges: Badge[];
  isMuted?: boolean;
  breakoutRoomId?: string | null;
}

export interface ClassRoom {
  id: number;
  name: string;
  students: SessionParticipant[];
  abbreviation: string | null;
  capacity: number;
  building: string | null;
}

export interface Reaction {
  id: string;
  studentId: string;
  studentName: string;
  type: ReactionType;
  timestamp: string;
}

export interface RewardAction {
  id: string;
  studentId: string;
  studentName: string;
  type: RewardActionType;
  points: number;
  badge?: Badge;
  reason: string;
  timestamp: string;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  participantIds: string[];
}

export interface TimerState {
  duration: number;
  remaining: number;
  isActive: boolean;
}

export interface BreakoutTimer {
  duration: number;
  remaining: number;
}

export interface UploadedFile {
    url: string;
    type: string;
    name?: string;
    format: string;
}

export interface ChatroomMessage {
  id: string;
  content: string; // Now a JSON string: { text: string, file: UploadedFile | null }
  authorId: string;
  chatroomSessionId: string;
  createdAt: string;
  author: Partial<SafeUser>;
}

export interface ChatMessage { 
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
  userRole: 'admin' | 'teacher';
};

export interface ActiveSession {
  title: any;
  id: string;
  hostId: string;
  sessionType: SessionType;
  classId: string;
  className: string;
  participants: SessionParticipant[];
  startTime: string;
  raisedHands: string[];
  reactions: Reaction[];
  polls: Poll[];
  activePoll?: Poll;
  quizzes: Quiz[];
  activeQuiz?: Quiz;
  rewardActions: RewardAction[];
  classTimer: TimerState | null;
  spotlightedParticipantId?: string | null;
  breakoutRooms: BreakoutRoom[] | null;
  breakoutTimer: BreakoutTimer | null;
  messages: ChatroomMessage[];
}

export interface SessionState {
  classes: ClassRoom[];
  selectedClass: ClassRoom | null;
  selectedStudents: string[];
  meetingCandidates: SessionParticipant[];
  selectedTeachers: string[];
  activeSession: ActiveSession | null;
  loading: boolean;
  chatMessages: ChatMessage[];
  signaledPresence: string[]; // Nouveau champ pour suivre les signaux de présence
}

export const initialState: SessionState = {
  classes: [],
  selectedClass: null,
  selectedStudents: [],
  meetingCandidates: [],
  selectedTeachers: [],
  activeSession: null,
  loading: false,
  chatMessages: [],
  signaledPresence: [], // Initialisation
};

// --- CONSTANTS MOVED HERE ---
export interface SessionTemplatePoll {
  question: string;
  options: string[];
}

export interface SessionTemplateQuiz {
  question: string;
  options: string[];
  correctAnswer: string;
  duration: number;
}
export interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  quizzes: Omit<Quiz, 'id' | 'startTime' | 'isActive' | 'currentQuestionIndex' | 'answers' | 'timeRemaining'>[];
  polls: SessionTemplatePoll[];
}


export const reactionIcons = {
  thumbs_up: ThumbsUp,
  thumbs_down: ThumbsDown,
  heart: Heart,
  laugh: Laugh,
  understood: Smile,
  confused: Meh,
};

export const reactionLabels = {
  thumbs_up: 'J aime',
  thumbs_down: 'Je n aime pas',
  heart: 'J adore',
  laugh: 'Drôle',
  understood: 'Compris !',
  confused: 'Confus(e)',
};

export const BADGE_TEMPLATES: Omit<Badge, 'id' | 'earnedAt'>[] = [
    { type: 'participation', name: 'Participant actif', description: 'Pour une participation remarquable', icon: '🙋' },
    { type: 'correct_answer', name: 'Expert', description: 'Pour des réponses correctes', icon: '🎯' },
    { type: 'helpful', name: 'Entraide', description: 'Pour avoir aidé ses camarades', icon: '🤝' },
    { type: 'creative', name: 'Créatif', description: 'Pour des idées originales', icon: '💡' },
    { type: 'leader', name: 'Leader', description: 'Pour avoir pris des initiatives', icon: '👑' },
    { type: 'consistent', name: 'Persévérant', description: 'Pour la régularité', icon: '⭐' },
];
