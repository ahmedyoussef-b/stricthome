// components/PrivateBrowserInstructions.tsx
export function PrivateBrowserInstructions() {
  return (
    <details className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8 dark:bg-blue-900/20 dark:border-blue-700/50">
      <summary className="cursor-pointer font-medium text-blue-800 dark:text-blue-200">
        🔒 Instructions pour la navigation privée
      </summary>
      <div className="mt-3 text-blue-700 dark:text-blue-300 text-sm space-y-3">
        <p>
          En navigation privée, les navigateurs demandent la permission à chaque visite. Si vous avez accidentellement bloqué l'accès :
        </p>
        <p><strong>Pour Chrome/Firefox :</strong></p>
        <ol className="list-decimal list-inside space-y-1 pl-2">
          <li>Cliquez sur l'icône 🔒 dans la barre d'adresse.</li>
          <li>Dans "Autorisations", sélectionnez "Autoriser" pour la Caméra et le Micro.</li>
          <li>Actualisez la page.</li>
        </ol>
        <p><strong>Pour Safari :</strong></p>
        <ol className="list-decimal list-inside space-y-1 pl-2">
          <li>Allez dans le menu Safari → Préférences → Sites web.</li>
          <li>Sélectionnez "Caméra" ou "Microphone" dans la liste à gauche.</li>
          <li>Trouvez ce site dans la liste et changez son statut à "Autoriser".</li>
          <li>Actualisez la page.</li>
        </ol>
      </div>
    </details>
  );
}
