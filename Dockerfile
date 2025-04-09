FROM node:18 AS frontend-builder
WORKDIR /app
COPY frontend/ ./frontend/
RUN cd frontend && npm ci && npm run build -- --configuration=production --output-path=dist/browser

FROM gradle:7.6-jdk17 AS backend-builder
WORKDIR /app
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist/browser/ ./backend/src/main/resources/static/
RUN cd backend && gradle build -x test

FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=backend-builder /app/backend/build/libs/*.jar app.jar

# Variables d'environnement (Render substituera automatiquement PORT)
ENV PORT=8080

# Exposer le port dynamique
EXPOSE ${PORT}

# Commande pour démarrer l'application avec le port dynamique
CMD ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"] 