#!/bin/bash

# Script pour initialiser et pousser vers le dépôt GitHub

echo "🚀 Démarrage de la configuration du dépôt et du push initial..."

# Fonction pour vérifier la connexion
check_github_connection() {
    echo "🔍 Vérification de la connexion à GitHub..."
    if git ls-remote origin > /dev/null 2>&1; then
        echo "✅ Connexion à GitHub réussie"
        return 0
    else
        echo "❌ Impossible de se connecter à GitHub"
        return 1
    fi
}

# Fonction pour configurer l'authentification
setup_authentication() {
    echo ""
    echo "🔐 Configuration de l'authentification GitHub"
    echo "Choisissez une méthode :"
    echo "1. SSH (recommandé - nécessite une clé SSH configurée)"
    echo "2. HTTPS avec Personal Access Token"
    echo "3. Annuler"
    echo ""
    read -p "Votre choix (1-3): " auth_choice
    
    case $auth_choice in
        1)
            echo "🔑 Configuration avec SSH..."
            git remote set-url origin git@github.com:ahmedyoussef-b/stricthome.git
            ;;
        2)
            echo "🔑 Configuration avec Personal Access Token..."
            read -s -p "Entrez votre Personal Access Token: " token
            echo ""
            git remote set-url origin https://${token}@github.com/ahmedyoussef-b/stricthome.git
            ;;
        3)
            echo "❌ Annulation du déploiement"
            exit 1
            ;;
        *)
            echo "❌ Choix invalide"
            setup_authentication
            ;;
    esac
}

# 1. Configure le dépôt distant
echo "🔧 Configuration du remote 'origin'..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/ahmedyoussef-b/stricthome.git

# 2. Vérifier l'authentification
if ! check_github_connection; then
    setup_authentication
fi

# 3. Renomme la branche actuelle en 'master'
echo "📋 Renommage de la branche en 'master'..."
git branch -M master

# 4. Ajoute tous les fichiers et fait un commit initial
echo "📦 Ajout de tous les fichiers..."
git add .

echo "📝 Création du commit initial..."
if git commit -m "Deploy: $(date +'%d/%m/%Y %H:%M:%S') - Initial commit"; then
    echo "✅ Commit créé avec succès"
else
    echo "ℹ️ Aucun changement à commettre ou commit vide"
    # Continuer même si pas de nouveau commit
fi

# 5. Pousse les changements
echo "📤 Push vers la branche 'master'..."
if git push -u origin master; then
    echo "✅ Push initial terminé avec succès !"
    echo "🌐 Votre dépôt est disponible sur : https://github.com/ahmedyoussef-b/stricthome"
else
    echo "❌ Échec du push"
    echo "💡 Tentative avec force push..."
    if git push -u -f origin master; then
        echo "✅ Push forcé réussi !"
    else
        echo "❌ Échec du push forcé"
        echo ""
        echo "🔧 Solutions possibles :"
        echo "   1. Vérifiez votre connexion internet"
        echo "   2. Vérifiez vos credentials GitHub"
        echo "   3. Essayez de configurer SSH :"
        echo "      git remote set-url origin git@github.com:ahmedyoussef-b/stricthome.git"
        echo "   4. Ou utilisez un token :"
        echo "      git remote set-url origin https://[TOKEN]@github.com/ahmedyoussef-b/stricthome.git"
        exit 1
    fi
fi

echo ""
echo "🎉 Déploiement terminé avec succès !"