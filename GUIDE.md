# StudWallet : le mode d'emploi en 1 page

**Règle n°1 : on travaille sur la branche `develop`. On ne touche jamais à `main`.**

## Comment ça marche

Le code est stocké sur **GitHub** (dépôt privé `Leolien/studwallet`). **Netlify** est branché dessus : dès qu'un fichier change sur GitHub, le site est mis à jour tout seul, en une minute environ. Netlify est géré par Léo, vous n'avez pas à vous y connecter.

Il y a deux branches, donc deux adresses :

- `develop`, notre zone de travail : https://develop--studwallet-g05.netlify.app
- `main`, la version propre qu'on rendra le 19 : https://studwallet-g05.netlify.app

On évite `main` pour deux raisons : on veut toujours garder une version qui marche, et chaque mise à jour de `main` consomme des crédits Netlify (le plan gratuit n'en donne que 300 par mois). Les mises à jour de `develop` ne coûtent rien.

## Modifier un fichier

1. Ouvrez github.com/Leolien/studwallet avec **votre propre compte**.
2. Vérifiez que le bouton en haut à gauche de la liste des fichiers affiche **`develop`**. Sinon, cliquez dessus et choisissez `develop`. À refaire à chaque fois.
3. Cliquez sur le fichier, puis sur le crayon (« Edit this file »).
4. Faites votre modification, puis cliquez sur **Commit changes...**.
5. Écrivez un message clair (par exemple « Ajout des couleurs dans style.css », pas « modif »), vérifiez que **Commit directly to the develop branch** est coché, puis validez.
6. Attendez une minute et ouvrez l'adresse `develop` pour voir le résultat (Ctrl+Maj+R si rien ne change).

## À respecter

- **Ne cliquez jamais sur « Compare & pull request » ni « Merge »** : la fusion vers `main`, c'est Léo, après accord du groupe.
- **Un seul fichier à la fois par personne.** Prévenez les autres sur Discord avant de commencer et quand vous avez fini, sinon vous écrasez le travail de l'autre.
- **Rouvrez le fichier juste avant de le modifier**, pour partir de la dernière version.
- Ne changez pas les `id` dans `index.html` sans prévenir (le JavaScript s'en sert).
- Aucun mot de passe ni clé dans les fichiers : le code du site est lisible par tous.

## Bon à savoir

- Les transactions saisies restent dans le navigateur de chacun : on ne les voit pas chez les autres, c'est normal.
- Pour voir qui a changé quoi : sur la page du dépôt, cliquez sur **Commits** (l'icône d'horloge). Rien n'est jamais perdu, on peut toujours revenir en arrière.
- Un doute ? Arrêtez-vous et demandez sur Discord avant de valider.
