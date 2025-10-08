// app/session/[id]/page.tsx
import SessionClient from './SessionClient';

export default function SessionPage({ params }: { params: { id: string } }) {
  // Cette page serveur ne fait que rendre le composant client principal.
  // Toute la logique complexe (hooks, états, etc.) est contenue dans SessionClient
  // pour garantir un cycle de vie stable.
  return <SessionClient sessionId={params.id} />;
}
