#!/bin/bash

# Les modules seront chargés par le script principal
# Aucune importation n'est nécessaire ici

# Fonction pour démarrer le backend
start_backend() {
    local port=$1
    local pid_file="/tmp/scoreboard_pid_$$"
    
    # LOG_FILE est maintenant défini globalement, pas besoin de le créer ici
    
    # Créer un fichier temporaire pour stocker la sortie d'erreur du run
    RUN_ERROR_LOG=$(mktemp)

    # Démarrer le backend en arrière-plan 
    # - Rediriger toute la sortie vers le fichier de log
    # - Ne récupérer que les erreurs importantes pour l'affichage terminal
    cd backend || error "Le répertoire backend n'existe pas"
    
    # Créer une regex pour filtrer les messages d'erreur critiques
    ERROR_PATTERN="ERROR|SEVERE|Exception|FATAL|CRITICAL|Failed|failure|Failure|Error:"
    
    # Démarrer avec redirection appropriée
    ./gradlew run --quiet > >(tee -a "$LOG_FILE" >/dev/null) 2> >(tee -a "$LOG_FILE" | (grep -E "$ERROR_PATTERN" || true) | tee "$RUN_ERROR_LOG" >/dev/null) &
    
    local BACKEND_PID=$!
    cd ..
    
    # Stocker le PID dans un fichier
    echo "$BACKEND_PID" > "$pid_file"

    # Attendre que le service backend soit prêt (jusqu'à 20 secondes)
    for i in {1..20}; do
        sleep 1
        debug "Vérification du service (tentative $i/20)..."
        # Vérifier si le processus est toujours en cours d'exécution
        if ! ps -p $BACKEND_PID > /dev/null; then
            warning "Le backend n'a pas pu démarrer. Voir les détails ci-dessous:"
            cat "$RUN_ERROR_LOG"
            rm -f "$RUN_ERROR_LOG" "$pid_file"
            error "Le backend n'a pas pu démarrer. Vérifiez les logs dans $LOG_FILE pour plus de détails."
        fi
        # Vérifier si le service écoute sur le port
        if lsof -i:$port -t >/dev/null 2>&1 || nc -z localhost $port 2>/dev/null; then
            log "Service démarré avec succès au bout de $i secondes." 0
            break
        fi
        # Si nous atteignons la fin de la boucle sans succès
        if [ $i -eq 20 ]; then
            warning "Le service (PID: $BACKEND_PID) n'écoute toujours pas sur le port $port après 20 secondes."
            warning "Contenu du log d'erreur:"
            cat "$RUN_ERROR_LOG"
            warning "Le service va être arrêté."
            kill $BACKEND_PID 2>/dev/null
            rm -f "$RUN_ERROR_LOG" "$pid_file"
            error "Échec du démarrage du service sur le port $port. Vérifiez les logs dans $LOG_FILE pour plus de détails."
        fi
    done

    # Supprimer le fichier d'erreur temporaire du run
    rm -f "$RUN_ERROR_LOG"
    
    # Le PID est dans le fichier, pas besoin de le retourner via echo
}

# Fonction pour arrêter les services
stop_services() {
    local pid=$1
    log "Arrêt des services..."
    kill $pid 2>/dev/null
    # Restaurer le titre de la fenêtre du terminal
    echo -ne "\033]0;Terminal\007"
}

# Fonction pour afficher les informations de l'application démarrée
show_service_info() {
    local port=$1
    local log_file=$2
    local pid=$3
    
    debug "Dans show_service_info: port=$port, log_file=$log_file, pid=$pid"
    
    # Vérifier explicitement que le service est bien en cours d'exécution
    if ! ps -p $pid > /dev/null; then
        error "Le service n'est plus en cours d'exécution. Vérifiez les logs pour plus de détails."
    fi
    
    debug "Processus backend en cours d'exécution, vérification du port..."

    # Vérifier explicitement que le service écoute sur le port
    if ! lsof -i:$port -t >/dev/null 2>&1; then
        error "Le service ne semble pas écouter sur le port $port. Vérifiez les logs pour plus de détails."
    fi

    log "Application démarrée:" 0
    log "Backend et Frontend: http://localhost:$port" 0
    log "Swagger UI: http://localhost:$port/swagger-ui" 0
    log "Les logs sont disponibles dans backend/$log_file" 0
} 