#!/bin/bash
set -e

# Construire le backend
echo "Construction du backend avec Gradle..."
cd backend
chmod +x ./gradlew
./gradlew build -x test

# Construire le frontend
echo "Construction du frontend avec Angular..."
cd ../frontend
npm ci
npm run build -- --configuration=production --output-path=dist/browser

# Copier les fichiers du frontend dans les ressources statiques du backend
echo "Copie des fichiers statiques..."
mkdir -p ../backend/src/main/resources/static
cp -r dist/browser/* ../backend/src/main/resources/static/

echo "Build terminé !" 