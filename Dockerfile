FROM openjdk:17-jdk-slim

WORKDIR /app

COPY backend/build/libs/*.jar app.jar

# Variables d'environnement (Render substituera automatiquement PORT)
ENV PORT=8080

# Exposer le port dynamique
EXPOSE ${PORT}

# Commande pour démarrer l'application avec le port dynamique
CMD ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"] 