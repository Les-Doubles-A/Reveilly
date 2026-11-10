# Reveilly — Fonctionnalités et critères d'acceptation

> Version 1 · 2026-10-23

## 1. Priorités

| ID | Fonctionnalité | Priorité | Justification |
|---|---|---|---|
| F1 | Liste des alarmes (activer, supprimer, dupliquer, prochaine sonnerie) | MVP | Écran 1 de la maquette |
| F2 | Création et édition d'une alarme (nom, heure, jours, son, volume, vibration) | MVP | Écran 2 de la maquette |
| F3 | Défi configurable par alarme : modules, thèmes, mode, nombre de questions | MVP | Cœur de la demande |
| F4 | Sonnerie fiable sur Android (heure exacte, écran verrouillé, redémarrage) | MVP | Sans elle, ce n'est pas un réveil |
| F5 | Écran de défi qui coupe la sonnerie après les bonnes réponses | MVP | Cœur de la demande |
| F6 | Réglages généraux (volume progressif, durée maximale, permissions, test) | MVP | Écran 3 de la maquette ; vérifier les permissions est indispensable à F4 |
| F7 | Version iOS (AlarmKit, iOS 26+) | V2 | Couche native à réécrire, H2 |
| F8 | Répétition (snooze) payée par une question | V2 | Absente de la maquette |
| F9 | Statistiques, séries, meilleurs scores | V2 | Utile après validation de l'usage |
| F10 | Mode entraînement et fiches de révision | V2 | Existe dans les pages d'exemple, hors parcours réveil |
| F11 | Nouveaux modules (conjugaison, dates, anglais…) | V2 | L'architecture des modules le permet |
| — | Comptes, synchronisation, IA générative | Hors périmètre | Aucun besoin, ajoute un serveur et des coûts |

## 2. Parcours utilisateurs

### P1 — Créer une alarme et la couper

1. Sur « Alarme à venir », appuyer sur le bouton vert « + ».
2. Saisir un nom, faire défiler les roues jusqu'à 6 h 45, choisir les jours.
3. Activer « Math », ouvrir son panneau, cocher « Tables de 1 à 20 », régler 2 questions.
4. Activer « Fig de S », cocher « Analogie », choisir « Choix multiple », 1 question.
5. Appuyer sur « Enregistrer » : la carte apparaît, avec « Sonne dans 9 h 12 ».
6. À 6 h 45, le téléphone verrouillé s'allume et sonne ; l'écran de défi s'affiche.
7. Répondre ; chaque bonne réponse fait avancer la jauge ; à 3 bonnes réponses, la sonnerie s'arrête.

**Résultat** : réveillé, alarme reprogrammée pour son prochain jour.

### P2 — Gérer ses alarmes

Désactiver une alarme par son interrupteur, la dupliquer ou la supprimer par le menu « ⋮ », la modifier en touchant la carte.

## 3. Écrans et surfaces

| ID | Écran / surface | Rôle | État vide | Chargement | Erreur | Succès |
|---|---|---|---|---|---|---|
| E1 | Alarme à venir | Liste | Logo + « Aucune alarme. Touchez + » | Sans objet (local) | Avertissement si permission manquante | Cartes triées par heure |
| E2 | Édition | Créer, modifier | Valeurs par défaut (7:00, L→V, Math) | — | « Activez au moins un module » | Retour à E1 + toast |
| E3 | Réglages | Préférences, permissions, test | — | — | Ligne rouge par permission manquante | Lignes vertes |
| E4 | Défi (sonnerie) | Arrêter l'alarme | — | — | « Écris un nombre » / « Écris une réponse » | « Bien réveillé ! » |
| E5 | Notification plein écran | Ouvrir E4 sur écran verrouillé | — | — | — | — |

## 4. Spécifications du MVP

### F1 — Liste des alarmes

- **Objectif** : voir et piloter ses alarmes.
- **Comportement attendu** : cartes triées par heure ; jours actifs en clair, inactifs grisés ; carte active en bleu nuit, inactive en gris ; menu ⋮ avec Supprimer et Dupliquer ; un bandeau indique la prochaine sonnerie.
- **Règles et limites** : supprimer propose « Annuler » pendant 5 s.
- **Erreurs et cas limites** : stockage illisible → liste vide et données conservées sous une autre clé.
- **Critères d'acceptation** :
  - **AC-F1-1** — Étant donné deux alarmes 17:40 et 6:45, Quand j'ouvre l'application, Alors 6:45 est affichée avant 17:40.
  - **AC-F1-2** — Étant donné une alarme active, Quand je bascule son interrupteur, Alors elle est désactivée, sa carte devient grise et sa sonnerie native est annulée.
  - **AC-F1-3** — Étant donné une alarme, Quand je choisis « Dupliquer », Alors une copie identique avec un nouvel identifiant apparaît.
  - **AC-F1-4** — Étant donné une alarme, Quand je choisis « Supprimer », Alors elle disparaît et « Annuler » la rétablit.
- **Vérification** : automatique (tests unitaires du magasin) + manuelle.

### F2 — Édition d'une alarme

- **Objectif** : régler une alarme en moins de 30 secondes.
- **Comportement attendu** : champ nom ; deux roues heures/minutes défilantes (aussi au clavier) ; 7 pastilles de jours ; carte son avec choix d'un fichier, écoute, volume, vibration ; bouton Enregistrer.
- **Règles et limites** : aucun jour coché = alarme unique (prochaine occurrence de l'heure) ; nom facultatif, 40 caractères max.
- **Erreurs et cas limites** : fichier son illisible → retour à la sonnerie par défaut avec message.
- **Critères d'acceptation** :
  - **AC-F2-1** — Étant donné l'heure 17:40 et les jours L à V, Quand on est vendredi 18:00, Alors la prochaine sonnerie calculée est lundi 17:40.
  - **AC-F2-2** — Étant donné aucun jour coché et l'heure 6:45, Quand il est 7:00, Alors la prochaine sonnerie est le lendemain 6:45, et l'alarme se désactive après avoir sonné.
  - **AC-F2-3** — Étant donné une alarme modifiée, Quand j'enregistre, Alors la liste et la planification native sont mises à jour.
- **Vérification** : automatique (`nextOccurrence`) + manuelle.

### F3 — Défi configurable par alarme

- **Objectif** : choisir, pour chaque alarme, exactement ce qui sera demandé.
- **Comportement attendu** : un interrupteur par module ; le chevron ouvre un panneau avec les thèmes (cases), le mode si le module en a (choix multiple / saisie libre) et « Nombre question ».
- **Règles et limites** : Math = 10 thèmes (les niveaux de la page Calcul mental) ; Figures de style = 7 thèmes (analogie, substitution, atténuation, opposition, construction, sonorités, énonciation) et 2 modes ; 1 à 10 questions par module.
- **Erreurs et cas limites** : un module actif sans thème ou aucun module actif bloque l'enregistrement avec un message.
- **Critères d'acceptation** :
  - **AC-F3-1** — Étant donné Math limité au thème « Puissances », Quand on génère 50 questions, Alors toutes viennent des générateurs de ce thème.
  - **AC-F3-2** — Étant donné Figures de style limité à « Opposition », Quand on génère 30 questions, Alors toutes portent sur une figure de cette catégorie.
  - **AC-F3-3** — Étant donné Math à 2 questions et Figures à 1, Quand le défi démarre, Alors il faut 3 bonnes réponses au total.
  - **AC-F3-4** — Étant donné aucun module actif, Quand j'enregistre, Alors l'enregistrement est refusé avec « Activez au moins un module ».
- **Vérification** : automatique.

### F4 — Sonnerie fiable sur Android

- **Objectif** : sonner à l'heure même application fermée, téléphone verrouillé ou redémarré.
- **Comportement attendu** : `AlarmManager.setAlarmClock` ; à l'heure, un service au premier plan joue le son en boucle (flux alarme), vibre, monte le volume progressivement et affiche une notification plein écran qui ouvre E4 par-dessus l'écran verrouillé ; reprogrammation au démarrage du téléphone et après changement d'heure.
- **Règles et limites** : seule la réussite du défi (ou la durée maximale de F6) arrête la sonnerie ; la notification n'a pas de bouton « Arrêter ».
- **Erreurs et cas limites** : permission d'alarme exacte refusée → avertissement sur E1 et lien vers le réglage ; son personnalisé illisible → sonnerie d'alarme du système.
- **Critères d'acceptation** :
  - **AC-F4-1** — Étant donné une alarme dans 2 minutes et l'application fermée, Quand l'heure arrive, Alors le téléphone sonne et affiche E4 à ± 5 s près.
  - **AC-F4-2** — Étant donné le téléphone verrouillé, Quand l'alarme sonne, Alors l'écran s'allume et E4 s'affiche sans déverrouiller.
  - **AC-F4-3** — Étant donné une alarme programmée, Quand le téléphone redémarre, Alors elle sonne quand même à l'heure.
  - **AC-F4-4** — Étant donné une alarme qui sonne, Quand on quitte E4 sans répondre, Alors la sonnerie continue.
- **Vérification** : manuelle sur appareil (scénarios M1 à M3).

### F5 — Écran de défi

- **Objectif** : couper la sonnerie en prouvant qu'on est réveillé.
- **Comportement attendu** : heure, nom de l'alarme, jauge « 1 / 3 », question ; saisie numérique ou texte, ou 4 propositions ; après réponse, correction (méthode pour Math, définition pour les figures) puis question suivante.
- **Règles et limites** : une mauvaise réponse ne compte pas et passe à une nouvelle question du même module **[H3]** ; tolérance aux accents et petites fautes en saisie libre (algorithme des pages d'origine) ; fractions et décimaux acceptés en Math (« 5/6 », « 0,5 », « −3 »).
- **Erreurs et cas limites** : saisie vide ou non numérique → message, pas de pénalité.
- **Critères d'acceptation** :
  - **AC-F5-1** — Étant donné la question « 7 × 8 », Quand je réponds « 56 », Alors la réponse est juste ; « 54 » est fausse et la méthode s'affiche.
  - **AC-F5-2** — Étant donné une figure « Métaphore » en saisie libre, Quand j’écris « metaphor » (accent et lettre oubliés), Alors la réponse est acceptée avec une remarque d’orthographe.
  - **AC-F5-3** — Étant donné un défi de 3 questions, Quand la 3e bonne réponse est donnée, Alors la sonnerie s'arrête et l'alarme est reprogrammée.
  - **AC-F5-4** — Étant donné une mauvaise réponse, Quand je continue, Alors la jauge n'avance pas et une nouvelle question apparaît.
  - **AC-F5-5** — Étant donné « Silence pendant les réponses » réglé sur 20 s (défaut), Quand je touche l'écran pendant la sonnerie, Alors le son et la vibration s'arrêtent, chaque nouvelle touche repousse la reprise, et la sonnerie revient 20 s après la dernière activité ou dès que je quitte l'application. Demandé par l'utilisateur le 2026-10-24.
- **Vérification** : automatique (session, correction) + manuelle.

### F6 — Réglages généraux

- **Objectif** : régler le comportement commun et vérifier que le téléphone laisse sonner.
- **Comportement attendu** : volume progressif (on/off, durée), durée maximale de sonnerie (5 à 30 min, ou jamais), retour haptique, état des permissions avec bouton pour corriger, bouton « Tester un réveil dans 10 s ».
- **Critères d'acceptation** :
  - **AC-F6-1** — Étant donné le volume progressif sur 30 s, Quand l'alarme sonne, Alors le volume passe de 10 % à la valeur choisie en 30 s.
  - **AC-F6-2** — Étant donné « Tester un réveil », Quand j'appuie, Alors une alarme de test sonne 10 s plus tard et ouvre E4 avec 1 question.
  - **AC-F6-3** — Étant donné la permission d'alarme exacte ou de notifications refusée, Quand j'ouvre Réglages, Alors la ligne correspondante est rouge et son bouton ouvre le réglage système.
- **Vérification** : AC-F6-1 automatique (courbe) + manuelle ; AC-F6-2 et AC-F6-3 manuelles.

## 5. Permissions et données sensibles

| Permission ou donnée | Pourquoi elle est nécessaire | Alternative plus faible envisagée | Ce qui se passe si elle est refusée |
|---|---|---|---|
| `USE_EXACT_ALARM` / `SCHEDULE_EXACT_ALARM` | Sonner à la minute près | Alarmes inexactes : retard de plusieurs minutes, inacceptable pour un réveil | Avertissement + lien réglage |
| `POST_NOTIFICATIONS` (Android 13+) | Afficher la notification de sonnerie | Aucune | Le son joue mais l'écran ne s'ouvre pas : avertissement |
| `USE_FULL_SCREEN_INTENT` | Ouvrir le défi sur l'écran verrouillé | Notification simple | Il faut toucher la notification |
| `FOREGROUND_SERVICE` (+ type `mediaPlayback`) | Garder la sonnerie active | Aucune | Sans objet (accordée à l'installation) |
| `RECEIVE_BOOT_COMPLETED` | Reprogrammer après redémarrage | Aucune | Accordée à l'installation |
| `VIBRATE`, `WAKE_LOCK` | Vibration, réveil de l'appareil | — | Accordées à l'installation |
| Fichier son choisi | Sonnerie personnalisée | — | Sonnerie système |

Aucune donnée personnelle ne quitte l'appareil.

## 6. Accessibilité

Interrupteurs avec `role="switch"` et libellé ; roues utilisables aux flèches du clavier et annoncées (« 6 heures 45 ») ; focus visible ; contraste texte ≥ 4,5:1 sur fond noir ; messages d'erreur en `role="alert"` ; animations coupées avec `prefers-reduced-motion` ; zones tactiles ≥ 44 px.

## 7. Version 2

| ID | Fonctionnalité | Condition pour la lancer |
|---|---|---|
| F7 | iOS avec AlarmKit | Testeurs sur iPhone (H2 fausse) |
| F8 | Snooze payé par une question | Demande de l'utilisateur |
| F9 | Statistiques | Usage quotidien confirmé |
| F10 | Entraînement et fiches | Usage de révision confirmé |
| F11 | Nouveaux modules | Après 2 semaines d'usage |

## 8. Hors périmètre

| Fonctionnalité | Raison |
|---|---|
| Comptes et synchronisation | Aucun besoin pour un réveil personnel ; ajouterait un serveur |
| Contenu généré par IA | Les générateurs locaux suffisent, fonctionnent hors ligne |
| Publicité | Non demandée |
