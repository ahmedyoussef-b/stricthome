#!/bin/bash

# Script pour initialiser et pousser vers le dépôt GitHub

echo "🚀 Démarrage de la configuration du dépôt et du push initial..."

# 1. Configure le dépôt distant (supprime l'ancien s'il existe)
echo "🔧 Configuration du remote 'origin'..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/ahmedyoussef-b/stricthome.git

# 2. Renomme la branche actuelle en 'master'
echo "BRANCH: Renommage de la branche en 'master'..."
git branch -M master

# 3. Ajoute tous les fichiers et fait un commit initial
echo "📦 Ajout de tous les fichiers..."
git add .
echo "📝 Création du commit initial..."
git commit -m "Commit initial" || echo "ℹ️ Aucun nouveau changement à commettre."

# 4. Pousse les changements vers la branche master en forçant et en configurant l'upstream
echo "📤 Pousse des changements vers la branche 'master' de origin..."
git push -u -f origin master

echo "✅ Push initial terminé avec succès !"
