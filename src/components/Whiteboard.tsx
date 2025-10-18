// src/components/Whiteboard.tsx
'use client'
import { Tldraw, makeReactCtor, TldrawEditor, defaultShapes } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

// Interface pour les événements du tableau blanc que nous enverrons via Pusher
interface BroadcastMessage {
  sessionId: string
  userId: string
  instanceId: string
  changes: any // Les modifications apportées au tableau blanc
}

export function Whiteboard({ sessionId }: { sessionId: string }) {
	const [editor, setEditor] = useState<TldrawEditor | null>(null)
	const { data: authSession } = useSession()

	const setEditorCB = useCallback((editor: TldrawEditor) => {
		editor.user.updateUserPreferences({
			id: authSession?.user.id,
			name: authSession?.user.name ?? 'Anonymous',
		})
		setEditor(editor)
	}, [authSession])

	useEffect(() => {
		if (!editor || !sessionId) return

		// S'abonner au canal Pusher pour cette session de tableau blanc
		const channel = pusherClient.subscribe(`tldraw-${sessionId}`)
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
			const toPut = Object.values(change.changes.added).concat(
				Object.values(change.changes.updated).map(([from, to]) => to)
			)

			// Ne rien envoyer s'il n'y a pas de modifications
			if (toRemove.length === 0 && toPut.length === 0) return

			// Envoyer les modifications à notre API qui les diffusera via Pusher
			fetch('/api/pusher/tldraw', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId,
					userId: authSession?.user.id,
					instanceId,
					changes: {
						added: toPut.filter(r => r.typeName === 'shape'),
						updated: [], // Pas nécessaire de gérer 'updated' séparément ici
						removed: toRemove,
					},
				}),
			})
		}

		const cleanup = editor.store.listen(handleChange)

		return () => {
			cleanup()
			channel.unbind('tldraw-changes', handleReceive)
			pusherClient.unsubscribe(`tldraw-${sessionId}`)
		}
	}, [editor, sessionId, authSession])

	return (
		<div style={{ position: 'fixed', inset: 0 }}>
			<Tldraw
				// Passez les formes par défaut à l'éditeur
				shapes={defaultShapes}
				onMount={setEditorCB}
				// Force le mode sombre pour une meilleure visibilité dans le thème actuel
				forceMobile
			/>
		</div>
	)
}
