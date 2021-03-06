# eco2file

*Chargement des signalements de l'Espace Collaboratif IGN sur une carte et enregistrement au format CSV / GeoJSON.*

## Overview

Ce projet utilise l'[API de l'Espace collaboratif de l'IGN](https://espacecollaboratif.ign.fr/api/doc/georem) pour charger des signalements depuis ce site.    
Il permet ensuite de sauvegarder les signalements au format CSV ou GeoJSON pour un traitement spécifique.

Vous devez au préalable avoir un compte sur [l'Espace collaboratif de l'IGN](https://espacecollaboratif.ign.fr) et définir un [profil de chargement sur votre page](https://espacecollaboratif.ign.fr/profile/).

Vous pouvez [tester le servce en ligne](https://viglino.github.io/eco2file/dist/).

## Getting Started

### Installer la dernère version de NodeJS

Le projet utilise NodeJS : rendez-vous sur le site de NodeJS (https://nodejs.org/fr/) et installer la dernière version.

### Créer le projet

Récupérez le projet, rendez-vous dans le répertoire du projet nouvellement créé et **ouvrez une console**.

Lancez l'installations du projet via la console :
````
npm install
````

### Démarrer un serveur de test
Utilisez la commande :

````
npm start
````
Le **serveur web** est démarré sur le port 1234. 
Le projet est construit dans le répertoire `.dist`.    

Vous pouvez **tester le resultat** sur l'url http://localhost:1234 dans un navigateur.
La page sera rechargée pour refléter les modification futures.

Si vous constatez des problèmes lors de la construction, supprimer les répertoire `./.cache` et `./.dist` manuellement et recommencez l'opération.


### Créer une version de production
Utilisez la ligne de commande :
````
npm run build
````
1. La **version de production** est disponible dans le répertoire `build` du projet.
2. Copier le répertoire sur le serveur de production.


## Licence

Le projet est publié sur [licence MIT](LICENSE).
