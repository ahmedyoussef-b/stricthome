// src/components/Whiteboard.tsx
'use client'
import { Tldraw } from '@tldraw/tldraw'
import type { Editor } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { pusherClient } from '@/lib/pusher/client'

// Interface pour les événements du tableau blanc que nous enverrons via Pusher
interface BroadcastMessage {
  sessionId: string
  userId: string
  instanceId: string
  changes: any // Les modifications apportées au tableau blanc
}

export function Whiteboard({ sessionId }: { sessionId: string }) {
	const [editor, setEditor] = useState<Editor | null>(null)
	const { data: authSession } = useSession()

	const setEditorCB = useCallback((editor: Editor) => {
		editor.user.updateUserPreferences({
			id: authSession?.user.id,
			name: authSession?.user.name ?? 'Anonymous',
		})
		setEditor(editor)
	}, [authSession])

	useEffect(() => {
		if (!editor || !sessionId || !authSession?.user?.id) return

		// S'abonner au canal Pusher pour cette session de tableau blanc
		const channelName = `presence-session-${sessionId}`
		const channel = pusherClient.subscribe(channelName)
		const instanceId = editor.store.id

		// Écouter les événements des autres utilisateurs
		const handleReceive = (data: BroadcastMessage) => {
			// Ne pas appliquer les modifications si elles proviennent de la même instance de tableau blanc
			if (data.instanceId !== instanceId) {
				editor.store.mergeRemoteChanges(() => {
					const { changes } = data
					const toRemove = changes.removed
					const toPut = [...changes.added, ...changes.updated]
					editor.store.remove(toRemove)
					editor.store.put(toPut)
				})
			}
		}

		channel.bind('tldraw-changes', handleReceive)

		// Envoyer nos propres modifications aux autres utilisateurs
		const handleChange = (change: any) => {
			if (change.source !== 'user') return

			const toRemove = Object.keys(change.changes.removed)
			const updatedValues = Object.values(change.changes.updated)
			const toPut = Object.values(change.changes.added).concat(
				updatedValues.map((update: unknown) => {
					// Type guard pour s'assurer que c'est un tuple [any, any]
					if (Array.isArray(update) && update.length === 2) {
						return update[1]
					}
					return update
				})
			)

			// Ne rien envoyer s'il n'y a pas de modifications
			if (toRemove.length === 0 && toPut.length === 0) return

			// Envoyer les modifications à notre API qui les diffusera via Pusher
			fetch('/api/pusher/tldraw', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					channelName: channelName,
					eventName: 'tldraw-changes',
					data: {
						instanceId,
						changes: {
							added: toPut,
							updated: [], // Pas nécessaire de gérer 'updated' séparément ici
							removed: toRemove,
						},
					}
				}),
			})
		}

		const cleanup = editor.store.listen(handleChange)

		return () => {
			cleanup()
			channel.unbind('tldraw-changes', handleReceive)
			pusherClient.unsubscribe(channelName)
		}
	}, [editor, sessionId, authSession])

	return (
		<div className="relative h-full w-full">
			<Tldraw
				onMount={setEditorCB}
				// Force le mode sombre pour une meilleure visibilité dans le thème actuel
				forceMobile
			/>
		</div>
	)
}
