#!/bin/bash

# Rendre les scripts du dossier lib exécutables
SCRIPT_DIR="$(dirname "$0")"
chmod +x "$SCRIPT_DIR/lib/"*.sh 2>/dev/null || true

# Charger les modules dans l'ordre de dépendance
source "$SCRIPT_DIR/lib/utils.sh"
source "$SCRIPT_DIR/lib/port_manager.sh"

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

# Obtenir le port configuré dans application.conf
get_configured_port() {
    local config_file="backend/src/main/resources/application.conf"
    
    if [ ! -f "$config_file" ]; then
        # Port par défaut si le fichier n'existe pas
        echo "9090"
        return
    fi
    
    # Extraire le port du fichier de configuration
    local port=$(grep -oP 'port\s*=\s*\K[0-9]+' "$config_file" | head -1)
    
    if [ -z "$port" ]; then
        # Port par défaut si non trouvé
        echo "9090"
    else
        echo "$port"
    fi
}

# Changer le titre de la fenêtre du terminal
echo -ne "\033]0;Score Board - Arrêt du service\007"

# Récupérer le port configuré
PORT=$(get_configured_port)

# Trouver le PID du service backend
SERVICE_PID=$(lsof -i:$PORT -t 2>/dev/null)

if [ -z "$SERVICE_PID" ]; then
    # Silence la sortie si l'option --quiet est fournie
    if [ "$1" != "--quiet" ]; then
        warning "Aucun processus trouvé sur le port $PORT. Le service est peut-être déjà arrêté."
    fi
    # Restaurer le titre de la fenêtre du terminal
    echo -ne "\033]0;Terminal\007"
    exit 0
fi

# Vérifier si c'est notre application
if is_our_application $SERVICE_PID; then
    log "Arrêt du service Score Board (PID: $SERVICE_PID)..."
    kill $SERVICE_PID 2>/dev/null

    # Attendre que le processus se termine
    sleep 2

    # Vérifier si le processus a été arrêté
    if lsof -i:$PORT -t >/dev/null 2>&1; then
        error "Impossible d'arrêter le service. Veuillez le fermer manuellement."
    else
        log "Service arrêté avec succès"
    fi
else
    warning "Le processus sur le port $PORT (PID: $SERVICE_PID) n'est pas Score Board."
    read -p "Voulez-vous quand même l'arrêter? (o/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        log "Tentative d'arrêt du processus (PID: $SERVICE_PID)..."
        kill $SERVICE_PID 2>/dev/null
        sleep 2
        if lsof -i:$PORT -t >/dev/null 2>&1; then
            error "Impossible d'arrêter le processus. Veuillez le fermer manuellement."
        else
            log "Processus arrêté avec succès"
        fi
    else
        log "Opération annulée"
    fi
fi

# Restaurer le titre de la fenêtre du terminal
echo -ne "\033]0;Terminal\007" 