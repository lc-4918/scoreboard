#!/bin/bash

# Les modules seront chargés par le script principal
# Aucune importation n'est nécessaire ici

# Mettre à jour le fichier de configuration avec le port choisi
update_port_config() {
    local port=$1
    local config_file="backend/src/main/resources/application.conf"
    local proxy_file="frontend/proxy.conf.json"
    
    # Vérifier si le fichier backend existe
    if [ ! -f "$config_file" ]; then
        error "Fichier de configuration backend introuvable: $config_file"
    fi
    
    # Mettre à jour le port dans le fichier de configuration backend
    sed -i "s/port = [0-9]*/port = $port/" "$config_file"
    log "Configuration backend mise à jour pour utiliser le port $port."
    
    # Vérifier si le fichier proxy existe
    if [ ! -f "$proxy_file" ]; then
        error "Fichier de configuration proxy introuvable: $proxy_file"
    fi
    
    # Mettre à jour le port dans le fichier proxy.conf.json
    sed -i "s/\"target\": \"http:\/\/localhost:[0-9]*\"/\"target\": \"http:\/\/localhost:$port\"/" "$proxy_file"
    log "Configuration proxy Angular mise à jour pour utiliser le port $port."
}

# Fonction pour construire l'application Angular
build_angular() {
    log "Installation des dépendances Angular..."
    cd frontend || error "Le répertoire frontend n'existe pas"
    # Rediriger la sortie normale vers /dev/null, mais garder stderr
    npm install > /dev/null
    if [ $? -ne 0 ]; then
        # En cas d'erreur, relancer la commande pour voir les détails
        log "Une erreur s'est produite. Relancement avec affichage détaillé..."
        npm install
        error "L'installation des dépendances Angular a échoué"
    fi

    log "Build de l'application Angular dans le dossier resources/static du backend..."
    # Rediriger la sortie normale et les warnings vers /dev/null
    npm run build 2> >(grep -v "WARNING.*budget" >&2) > /dev/null
    if [ $? -ne 0 ]; then
        # En cas d'erreur, relancer la commande pour voir les détails
        log "Une erreur s'est produite. Relancement avec affichage détaillé..."
        npm run build
        error "Le build Angular a échoué"
    fi
    cd ..
}

# Fonction pour construire l'application backend
build_backend() {
    log "Construction de l'application backend..."
    cd backend || error "Le répertoire backend n'existe pas"

    # Créer un fichier temporaire pour stocker la sortie d'erreur
    ERROR_LOG=$(mktemp)

    # Exécuter la commande et stocker stderr dans un fichier
    ./gradlew build --quiet 2> >(tee "$ERROR_LOG" | grep -v "OpenJDK.*warning" | grep -v "Deprecated Gradle features" | grep -v "You can use '--warning-mode all'" | grep -v "For more on this, please refer to")

    # Vérifier le code de retour
    if [ $? -ne 0 ]; then
        warning "La construction du backend a échoué. Voir les détails ci-dessous:"
        cat "$ERROR_LOG"
        rm -f "$ERROR_LOG"
        error "La construction du backend a échoué. Vérifiez les erreurs ci-dessus."
    fi

    # Supprimer le fichier d'erreur temporaire
    rm -f "$ERROR_LOG"
    cd ..
} 