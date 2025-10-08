// app/session/[id]/page.tsx
import SessionClient from './SessionClient';

// On garde cette structure de page serveur simple et stable.
export default function SessionPage({ params }: { params: { id: string } }) {
  // Le composant client principal gère toute la complexité.
  return <SessionClient sessionId={params.id} />;
}
