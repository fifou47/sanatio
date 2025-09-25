# Guide de Déploiement et de Lancement

Ce guide explique comment configurer et lancer l'infrastructure de visioconférence LiveKit ainsi que les services backend associés.

## Prérequis

- Docker et Docker Compose doivent être installés sur votre machine.
- Vous devez avoir une copie de ce projet sur votre machine.

## Étape 1 : Configuration de l'Environnement

Avant de lancer les services, vous devez configurer les variables d'environnement qui contiennent les secrets et les configurations spécifiques à votre déploiement.

### A. Configuration du Serveur LiveKit

1.  **Trouvez le fichier `.env.livekit.template`** à la racine du projet.
2.  **Renommez-le en `.env.livekit`**.
3.  **Modifiez ce nouveau fichier `.env.livekit`** pour y mettre vos propres secrets :
    -   `LIVEKIT_API_KEY`: Votre clé API LiveKit. Vous pouvez garder celle par défaut pour le développement, mais il est recommandé de la changer.
    -   `LIVEKIT_API_SECRET`: Votre secret LiveKit.
    -   `REDIS_PASSWORD`: Un mot de passe robuste pour votre base de données Redis.

### B. Configuration du Service de Consultation

1.  **Trouvez le fichier `sanatio-backend/sanatio_consultation/.env.template`**.
2.  **Renommez-le en `sanatio-backend/sanatio_consultation/.env`**.
3.  **Vérifiez et modifiez les valeurs** dans ce nouveau fichier si nécessaire. Les valeurs par défaut sont conçues pour un environnement de développement local, mais assurez-vous qu'elles correspondent à votre configuration.
    -   `LIVEKIT_API_KEY` et `LIVEKIT_API_SECRET` **doivent être identiques** à celles que vous avez définies dans `.env.livekit`.

### C. Configuration de l'Application Mobile

1.  **Trouvez le fichier `sanatio-frontend/sanatio/.env.template`**.
2.  **Renommez-le en `sanatio-frontend/sanatio/.env`**.
3.  **Modifiez la variable `EXPO_PUBLIC_LIVEKIT_URL`** pour qu'elle pointe vers l'adresse de votre serveur LiveKit.
    -   **Important :** Si vous testez sur un appareil mobile physique, n'utilisez pas `localhost`. Utilisez l'adresse IP de votre ordinateur sur le réseau local (ex: `ws://192.168.1.100:7880`).

## Étape 2 : Lancement des Services

Une fois la configuration terminée, vous pouvez lancer tous les services avec Docker Compose.

1.  **Ouvrez un terminal à la racine du projet.**
2.  **Lancez le serveur LiveKit** en arrière-plan :
    ```bash
    docker-compose -f docker-compose.livekit.yml up -d
    ```
3.  **Lancez les services backend de Sanatio** (consultation, docteur, etc.) :
    ```bash
    docker-compose up -d --build
    ```
4.  **Pour lancer l'application mobile**, naviguez dans le répertoire du frontend et suivez les instructions standard d'Expo :
    ```bash
    cd sanatio-frontend/sanatio
    npm install
    npx expo start
    ```

## Vérification

- Pour vérifier que le serveur LiveKit fonctionne, vous pouvez consulter ses logs avec `docker-compose -f docker-compose.livekit.yml logs -f`.
- Pour vérifier les services backend, utilisez `docker-compose logs -f <nom-du-service>`, par exemple `docker-compose logs -f sanatio-consultation`.