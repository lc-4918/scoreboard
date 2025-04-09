#!/bin/bash

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variable globale pour contrôler le niveau de verbosité
# 0 = minimale (erreurs seulement), 1 = normale (par défaut), 2 = verbeuse
VERBOSITY_LEVEL=1
# Fichier de log (sera défini plus tard)
LOG_FILE=""

# Fonction pour afficher les messages
log() {
    local message="$1"
    local level=${2:-1}  # Niveau par défaut: 1 (normal)
    
    # Toujours écrire dans le fichier de log s'il est défini
    if [ ! -z "$LOG_FILE" ]; then
        # Vérifier que le dossier existe
        local log_dir=$(dirname "$LOG_FILE")
        if [ ! -d "$log_dir" ]; then
            mkdir -p "$log_dir" 2>/dev/null
        fi
        
        # Essayer d'écrire dans le fichier de log, ignorer les erreurs (pour éviter d'interrompre le script)
        echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $message" >> "$LOG_FILE" 2>/dev/null || true
    fi
    
    # Afficher dans le terminal seulement si le niveau de verbosité est suffisant
    if [ $level -le $VERBOSITY_LEVEL ]; then
        echo -e "${GREEN}[INFO]${NC} $message"
    fi
}

# Messages d'erreur - toujours affichés
error() {
    local message="$1"
    
    # Toujours écrire dans le fichier de log s'il est défini
    if [ ! -z "$LOG_FILE" ]; then
        # Vérifier que le dossier existe
        local log_dir=$(dirname "$LOG_FILE")
        if [ ! -d "$log_dir" ]; then
            mkdir -p "$log_dir" 2>/dev/null
        fi
        
        # Essayer d'écrire dans le fichier de log, ignorer les erreurs
        echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $message" >> "$LOG_FILE" 2>/dev/null || true
    fi
    
    # Toujours afficher les erreurs dans le terminal
    echo -e "${RED}[ERROR]${NC} $message"
    read -n 1 -s -r -p "Appuyez sur une touche pour fermer..."
    # Restaurer le titre de la fenêtre du terminal
    echo -ne "\033]0;Terminal\007"
    exit 1
}

# Avertissements - toujours affichés
warning() {
    local message="$1"
    
    # Toujours écrire dans le fichier de log s'il est défini
    if [ ! -z "$LOG_FILE" ]; then
        # Vérifier que le dossier existe
        local log_dir=$(dirname "$LOG_FILE")
        if [ ! -d "$log_dir" ]; then
            mkdir -p "$log_dir" 2>/dev/null
        fi
        
        # Essayer d'écrire dans le fichier de log, ignorer les erreurs
        echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $message" >> "$LOG_FILE" 2>/dev/null || true
    fi
    
    # Toujours afficher les avertissements dans le terminal
    echo -e "${YELLOW}[WARNING]${NC} $message"
}

# Messages de débogage - affichés seulement en mode verbeux
debug() {
    local message="$1"
    
    # Toujours écrire dans le fichier de log s'il est défini
    if [ ! -z "$LOG_FILE" ]; then
        # Vérifier que le dossier existe
        local log_dir=$(dirname "$LOG_FILE")
        if [ ! -d "$log_dir" ]; then
            mkdir -p "$log_dir" 2>/dev/null
        fi
        
        # Essayer d'écrire dans le fichier de log, ignorer les erreurs
        echo "$(date '+%Y-%m-%d %H:%M:%S') [DEBUG] $message" >> "$LOG_FILE" 2>/dev/null || true
    fi
    
    # Afficher seulement en mode verbeux
    if [ $VERBOSITY_LEVEL -ge 2 ]; then
        echo -e "${BLUE}[DEBUG]${NC} $message"
    fi
}

# Fonction pour afficher la bannière
show_banner() {
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
}

# Fonction d'aide
show_help() {
    local default_port=$1
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -p, --port PORT    Définir le port à utiliser (par défaut: $default_port)"
    echo "  -h, --help         Afficher cette aide"
    exit 0
}

# Fonction pour vérifier les dépendances requises
check_dependencies() {
    log "Vérification des permissions d'exécution..."
    chmod +x start-service.sh stop-service.sh
    chmod +x ./backend/gradlew

    # Vérification de Node.js et npm
    if ! command -v node &> /dev/null; then
        error "Node.js n'est pas installé. Veuillez installer Node.js 18 ou supérieur."
    fi

    if ! command -v npm &> /dev/null; then
        error "npm n'est pas installé. Veuillez installer npm."
    fi

    # Vérification de Java
    if ! command -v java &> /dev/null; then
        error "Java n'est pas installé. Veuillez installer Java 17 ou supérieur."
    fi

    # Vérification de la version de Java
    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | awk -F. '{print $1}')
    if [ "$JAVA_VERSION" -lt 17 ]; then
        error "Java 17 ou supérieur est requis. Version actuelle : $JAVA_VERSION"
    fi
} 