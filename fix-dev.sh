#!/bin/bash
echo "🧹 Nettoyage du cache Next.js..."
rm -rf .next
rm -rf node_modules/.cache

echo "📦 Réinstallation des dépendances..."
npm install

echo "🚀 Redémarrage du serveur de développement..."
npm run dev
