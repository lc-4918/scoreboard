#!/bin/bash

# Les modules seront chargés par le script principal
# Aucune importation n'est nécessaire ici

# Fonction pour vérifier si un processus est notre application Score Board
is_our_application() {
    local pid=$1
    
    # Vérifier si le processus est Java et s'il contient des arguments spécifiques à notre application
    if ps -p $pid -o comm= | grep -q "java"; then
        # Vérifier les arguments du processus pour identifier notre application
        if ps -p $pid -o args= | grep -q "backend/build/libs/scoreboard"; then
            return 0  # C'est notre application
        fi
    fi
    return 1  # Ce n'est pas notre application
}

# Fonction pour arrêter un processus qui utilise un port donné
kill_process_using_port() {
    local port=$1
    local force=$2  # Paramètre optionnel pour forcer l'arrêt
    local PID=$(lsof -i:$port -t 2>/dev/null)
    
    if [ -z "$PID" ]; then
        # Essayer avec netstat si lsof ne donne pas de résultat
        PID=$(netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d/ -f1)
        if [ -z "$PID" ] || [ "$PID" = " " ] || ! [[ "$PID" =~ ^[0-9]+$ ]]; then
            # Si nous ne pouvons pas trouver le PID, essayer de libérer le port en tuant tous les processus java
            warning "Impossible d'identifier le processus. Tentative de libération du port $port..."
            # Vérifions si le port est réellement utilisé
            nc -z localhost $port 2>/dev/null
            if [ $? -ne 0 ]; then
                # Le port n'est pas utilisé
                log "Port $port déjà libéré."
                return 0
            else
                # Si le port est toujours occupé
                return 1
            fi
        fi
    fi
    
    # Si force n'est pas spécifié, vérifier si c'est notre application
    if [ -z "$force" ]; then
        if ! is_our_application $PID; then
            # Ce n'est pas notre application, ne pas arrêter automatiquement
            return 1
        fi
    fi
    
    local PROCESS_NAME=$(ps -p $PID -o comm= 2>/dev/null || echo "Processus inconnu")
    log "Tentative d'arrêt du processus: $PROCESS_NAME (PID: $PID) utilisant le port $port..."
    kill $PID 2>/dev/null
    
    # Attendre que le processus se termine
    for i in {1..5}; do
        sleep 1
        nc -z localhost $port 2>/dev/null
        if [ $? -ne 0 ]; then
            # Port libéré
            log "Port $port libéré avec succès."
            return 0
        fi
    done
    
    # Si le port est toujours utilisé après 5 secondes, essayer kill -9
    warning "Le processus ne répond pas. Tentative d'arrêt forcé..."
    kill -9 $PID 2>/dev/null
    sleep 2
    
    nc -z localhost $port 2>/dev/null
    if [ $? -eq 0 ]; then
        return 1
    else
        log "Port $port libéré avec succès."
        return 0
    fi
}

# Fonction pour demander à l'utilisateur quoi faire avec un port occupé
ask_user_port_choice() {
    local port=$1
    local port_var_name=$2
    local retry_count=$3
    local max_retries=$4
    
    echo "Options:"
    echo "  1) Utiliser un autre port"
    echo "  2) Arrêter le processus existant et utiliser ce port"
    read -p "Votre choix (1/2): " choice
    
    case $choice in
        1)
            read -p "Entrez un nouveau port: " new_port
            # Modifier la variable PORT globale via eval
            eval "$port_var_name=$new_port"
            # Appeler check_port avec le nouveau port et le nom de la variable globale
            # Mais ne pas revérifier le port d'origine
            check_port $new_port $port_var_name "new_port"
            return $?
            ;;
        2)
            if kill_process_using_port $port "force"; then
                log "Processus arrêté avec succès."
                return 0
            else
                error "Impossible d'arrêter le processus sur le port $port. Veuillez l'arrêter manuellement ou spécifier un autre port."
            fi
            ;;
        *)
            warning "Choix invalide. Veuillez réessayer."
            if [ "$retry_count" -lt "$max_retries" ]; then
                ask_user_port_choice $port $port_var_name $((retry_count + 1)) $max_retries
                return $?
            else
                error "Nombre maximum de tentatives atteint. Veuillez libérer le port $port manuellement ou spécifier un autre port avec l'option -p."
            fi
            ;;
    esac
}

# Vérification si le port spécifié est déjà utilisé
check_port() {
    local port=$1
    local port_var_name=$2
    local retry_count=0
    local max_retries=3
    local is_new_port=$3  # Pour savoir si c'est un nouveau port choisi par l'utilisateur
    
    # Afficher les valeurs actuelles pour débogage
    log "check_port: Vérification du port $port"
    
    # Vérification si le port est disponible
    nc -z localhost $port 2>/dev/null
    if [ $? -ne 0 ]; then
        # Port disponible (nc échoue à se connecter)
        log "Port $port disponible. Utilisation du port $port pour cette application."
        # Mettre à jour la config directement si c'est un nouveau port
        if [ "$is_new_port" = "new_port" ]; then
            # Si update_port_config est défini, l'appeler avec le nouveau port
            if type update_port_config >/dev/null 2>&1; then
                update_port_config $port
            fi
        fi
        return 0
    fi
    
    # Le port est occupé
    while true; do
        local PID=$(lsof -i:$port -t 2>/dev/null || netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d/ -f1)
        local PROCESS_NAME="Processus inconnu"
        
        if [ ! -z "$PID" ] && [ "$PID" != " " ]; then
            # Vérifier que le PID est un nombre valide
            if [[ "$PID" =~ ^[0-9]+$ ]]; then
                PROCESS_NAME=$(ps -p $PID -o comm= 2>/dev/null || echo "Processus inconnu")
                
                # Vérifier si c'est notre application Score Board
                if is_our_application $PID; then
                    warning "Le port $port est occupé par une instance précédente de Score Board (PID: $PID)."
                    log "Tentative d'arrêt automatique de l'instance précédente..."
                    
                    if kill_process_using_port $port; then
                        log "Instance précédente arrêtée avec succès."
                        break
                    else
                        warning "Impossible d'arrêter l'instance précédente."
                    fi
                else
                    # Ce n'est pas notre application, demander à l'utilisateur quoi faire
                    warning "Le port $port est occupé par: $PROCESS_NAME (PID: $PID)."
                    ask_user_port_choice $port $port_var_name $retry_count $max_retries
                    return $?
                fi
            else
                # PID invalide, demander à l'utilisateur quoi faire
                warning "Le port $port est occupé mais impossible d'identifier le processus."
                ask_user_port_choice $port $port_var_name $retry_count $max_retries
                return $?
            fi
        else
            # Impossible d'obtenir le PID, demander à l'utilisateur quoi faire
            warning "Le port $port est occupé mais impossible d'identifier le processus."
            ask_user_port_choice $port $port_var_name $retry_count $max_retries
            return $?
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -ge $max_retries ]; then
            error "Nombre maximum de tentatives atteint. Veuillez libérer le port $port manuellement ou spécifier un autre port avec l'option -p."
        fi
        
        sleep 1
    done
}

# Fonction pour la vérification finale du port avant le démarrage du service
final_port_check() {
    local port=$1
    local port_var_name=$2
    
    # Vérification plus fiable si le port est occupé
    if ! (echo >/dev/tcp/localhost/$port) 2>/dev/null; then
        # Port disponible
        return 0
    fi
    
    local PID=$(lsof -i:$port -t 2>/dev/null || netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d/ -f1)
    local PROCESS_NAME="Processus inconnu"
    
    if [ ! -z "$PID" ] && [ "$PID" != " " ] && [[ "$PID" =~ ^[0-9]+$ ]]; then
        PROCESS_NAME=$(ps -p $PID -o comm= 2>/dev/null || echo "Processus inconnu")
    fi
    
    warning "Port $port encore occupé juste avant le démarrage!"
    
    # Vérifier si c'est notre application
    if is_our_application $PID 2>/dev/null; then
        log "Tentative d'arrêt de l'instance précédente de Score Board..."
        if ! kill_process_using_port $port; then
            error "Impossible de démarrer le service car le port $port est toujours occupé par une instance précédente. Veuillez l'arrêter manuellement ou essayer avec un autre port."
        fi
    else
        warning "Le port $port est occupé par: $PROCESS_NAME (PID: $PID)."
        echo "Options:"
        echo "  1) Utiliser un autre port"
        echo "  2) Arrêter le processus existant et utiliser ce port"
        read -p "Votre choix (1/2): " choice
        
        case $choice in
            1)
                read -p "Entrez un nouveau port: " new_port
                # Modifier la variable PORT globale via eval
                eval "$port_var_name=$new_port"
                # Mettre à jour la configuration avec le nouveau port
                update_port_config $new_port
                # Vérifier le nouveau port
                final_port_check $new_port $port_var_name
                return
                ;;
            2)
                if kill_process_using_port $port "force"; then
                    log "Processus arrêté avec succès."
                else
                    error "Impossible d'arrêter le processus sur le port $port. Veuillez l'arrêter manuellement ou spécifier un autre port."
                fi
                ;;
            *)
                error "Choix invalide. Impossible de continuer."
                ;;
        esac
    fi
    
    # Attendre un peu plus longtemps pour être sûr que le port est libéré
    sleep 3
    
    # Vérifier encore une fois
    if ! (echo >/dev/tcp/localhost/$port) 2>/dev/null; then
        # Port disponible
        return 0
    else
        error "Impossible de démarrer le service car le port $port est toujours occupé. Veuillez essayer avec un autre port."
    fi
} 