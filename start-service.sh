#!/bin/bash

# Le mode débogage peut être activé au besoin
# set -x

# Rendre les scripts du dossier lib exécutables
SCRIPT_DIR="$(dirname "$0")"
chmod +x "$SCRIPT_DIR/lib/"*.sh 2>/dev/null || true

# Charger les modules dans l'ordre de dépendance
source "$SCRIPT_DIR/lib/utils.sh"
source "$SCRIPT_DIR/lib/port_manager.sh"
source "$SCRIPT_DIR/lib/config_manager.sh"
source "$SCRIPT_DIR/lib/service_manager.sh"

# Port par défaut
DEFAULT_PORT=9090

# ASCII Art pour SCORE BOARD
cat << "EOF"
  _____  _____ ____  _____  ______    ____   ____          _____  _____  
 / ____|/ ____/ __ \|  __ \|  ____|  |  _ \ / __ \   /\   |  __ \|  __ \ 
| (___ | |   | |  | | |__) | |__     | |_) | |  | | /  \  | |__) | |  | |
 \___ \| |   | |  | |  _  /|  __|    |  _ <| |  | |/ /\ \ |  _  /| |  | |
 ____) | |___| |__| | | \ \| |____   | |_) | |__| / ____ \| | \ \| |__| |
|_____/ \_____\____/|_|  \_\______|  |____/ \____/_/    \_\_|  \_\_____/ 
                                                                         
Portfolio - Luc CLEMENT - Contact: lucclement38@gmail.com
EOF
echo

# Créer un dossier pour les logs s'il n'existe pas
mkdir -p logs

# Initialiser le fichier de log avec l'horodatage
LOG_DATE=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="logs/scoreboard_${LOG_DATE}.log"
export LOG_FILE

# Fonction d'aide
show_help() {
    local default_port=$1
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -p, --port PORT    Définir le port à utiliser (par défaut: $default_port)"
    echo "  -q, --quiet        Mode silencieux (affiche uniquement les erreurs)"
    echo "  -v, --verbose      Mode verbeux (affiche tous les messages de débogage)"
    echo "  -h, --help         Afficher cette aide"
    exit 0
}

# Traitement des arguments
PORT=$DEFAULT_PORT
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -p|--port)
            PORT="$2"
            shift
            shift
            ;;
        -q|--quiet)
            VERBOSITY_LEVEL=0
            shift
            ;;
        -v|--verbose)
            VERBOSITY_LEVEL=2
            shift
            ;;
        -h|--help)
            show_help $DEFAULT_PORT
            ;;
        *)
            warning "Option inconnue: $1"
            show_help $DEFAULT_PORT
            ;;
    esac
done

# Vérifier les dépendances nécessaires
check_dependencies

# Informer l'utilisateur du mode de verbosité
case $VERBOSITY_LEVEL in
    0)
        log "Mode silencieux activé. Seules les erreurs seront affichées dans le terminal." 0
        log "Tous les messages sont enregistrés dans $LOG_FILE" 0
        ;;
    1)
        log "Mode normal activé. Les messages informatifs et les erreurs seront affichés dans le terminal."
        log "Tous les messages sont enregistrés dans $LOG_FILE"
        ;;
    2)
        log "Mode verbeux activé. Tous les messages, y compris le débogage, seront affichés dans le terminal."
        log "Tous les messages sont également enregistrés dans $LOG_FILE"
        debug "Messages de débogage activés"
        ;;
esac

# Sortir la valeur de PORT pour débogage
log "Port initial à vérifier: $PORT"

# Vérifier que le port est disponible
# Cette fonction vérifie si le port est libre et demande à l'utilisateur quoi faire s'il est occupé
# Elle peut modifier la variable PORT si l'utilisateur choisit un autre port
check_port $PORT "PORT"

# Sortir la valeur de PORT après vérification pour débogage
log "Port final après vérification: $PORT"

# Mettre à jour la configuration avec le port choisi
update_port_config $PORT

# Tuer le processus de l'ancienne instance si il existe
if lsof -i:$PORT -t >/dev/null 2>&1; then
    PID=$(lsof -i:$PORT -t)
    if is_our_application $PID; then
        log "Arrêt de l'instance précédente de Score Board sur le port $PORT..."
        kill $PID 2>/dev/null
        # Attendre que le port soit libéré
        sleep 3
    fi
fi

# Changer le titre de la fenêtre du terminal
echo -ne "\033]0;Score Board - Service Actif (Port $PORT)\007"

# Construire les applications
build_angular
build_backend

# Démarrer le backend
log "Démarrage du backend avec UI intégrée..."
start_backend $PORT

# Récupérer le PID depuis le fichier temporaire
pid_file="/tmp/scoreboard_pid_$$"
if [ -f "$pid_file" ]; then
    BACKEND_PID=$(cat "$pid_file")
    rm -f "$pid_file"
    debug "PID du backend récupéré: $BACKEND_PID"
else
    error "Impossible de récupérer le PID du backend. Le démarrage a probablement échoué."
fi

# Ajout de messages de débogage 
debug "Préparation de l'affichage des informations de service..."
debug "BACKEND_PID=$BACKEND_PID, PORT=$PORT, LOG_FILE=$LOG_FILE"

# Afficher les informations de service
show_service_info $PORT "$LOG_FILE" $BACKEND_PID

# Fonction pour nettoyer les processus à la sortie
cleanup() {
    stop_services $BACKEND_PID
    exit 0
}

# Intercepter Ctrl+C pour nettoyer proprement
trap cleanup SIGINT SIGTERM

# Attendre que l'utilisateur appuie sur une touche
wait 