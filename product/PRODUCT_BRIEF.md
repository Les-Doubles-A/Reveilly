# Reveilly — Product Brief

> Version 1 · 2026-10-23 · Statut : MVP construit, à valider sur appareil
> Légende : **[Fait]** vérifié (source ou « exprimé par l'utilisateur ») · **[H#]** hypothèse · **[Reco]** recommandation · **[À vérifier]**

## 1. Concept

Reveilly est un réveil mobile qui ne s'arrête que lorsqu'on a répondu correctement à un petit nombre de questions (calcul mental, figures de style…). Chaque alarme choisit ses modules, ses thèmes, son mode de réponse et son nombre de questions. **[Fait]** exprimé par l'utilisateur, avec deux modules d'exemple (pages HTML « Calcul mental » et « Quiz des figures de style ») et une maquette UI (UI.pdf).

## 2. Problème

On coupe un réveil classique sans être réveillé, puis on se rendort. Obliger le cerveau à travailler une minute réveille vraiment, et le temps passé sert à réviser.

## 3. Utilisateurs

- **Utilisateur principal** : élève ou étudiant francophone qui révise (calcul mental jusqu'au niveau Première, figures de style) **[H1]**.
- **Utilisateurs secondaires** : toute personne qui a du mal à se lever et veut un réveil « exigeant ».
- **Hors cible** : personnes qui ont besoin d'un réveil silencieux ou d'une coupure immédiate (garde médicale, accessibilité motrice forte).

## 4. Alternatives actuelles

| Alternative | Ce qu'elle fait bien | Limite pour notre cible | Statut de l'information |
|---|---|---|---|
| Réveil système | Fiable, gratuit | Se coupe d'un geste | [Fait] |
| Alarmy et apps à « missions » | Missions (calcul, photo, pas…) avant l'arrêt | Questions génériques, pas de contenu de révision scolaire choisi par thème | Vérifié le 2026-10-23 (https://alar.my/en/blog/how-to-choose-alarmy-mission) |

## 5. Proposition de valeur

Le seul réveil où ce qui vous réveille est aussi ce que vous révisez : des questions générées à l'infini, filtrées thème par thème pour chaque alarme, avec la correction expliquée.

## 6. Hypothèses

| ID | Hypothèse | Type | Si elle est fausse | Comment la tester | Coût du test |
|---|---|---|---|---|---|
| H1 | La cible principale est scolaire et francophone | Usage | Ajouter des modules non scolaires (logique, mémoire) | 5 utilisateurs pendant 2 semaines | Faible |
| H2 | Android suffit pour le MVP | Technique | Porter la couche native sur iOS avec AlarmKit (iOS 26+) | Demander la plateforme des 5 testeurs | Faible |
| H3 | Une mauvaise réponse ne compte pas : il faut N bonnes réponses | Usage | Rendre la règle réglable (N questions quelle que soit la réponse) | Observer les abandons | Faible |
| H4 | Dans la maquette, la barre de la carte « son » règle le volume et l'icône téléphone active la vibration | Usage | Ajuster l'interface | Relecture par l'utilisateur | Nul |
| H5 | Distribution d'abord par APK installé à la main, pas de Play Store | Économique | Préparer la fiche Play et la déclaration des permissions d'alarme | Décision de l'utilisateur (D3) | Faible |

## 7. Tester l'intérêt avant d'investir

Usage personnel pendant deux semaines avec l'aperçu Web puis l'APK, en notant chaque matin : réveillé oui/non, temps pour couper, questions trop dures ou trop faciles.

## 8. Objectifs et indicateurs de réussite

| Objectif | Indicateur | Seuil de réussite du MVP | Mesure |
|---|---|---|---|
| Fiabilité | Alarmes qui sonnent à l'heure, écran verrouillé | 14 matins sur 14 | Journal manuel |
| Réveil effectif | Matins sans rendormissement | ≥ 10 sur 14 | Journal manuel |
| Difficulté adaptée | Temps moyen pour couper | Entre 30 s et 3 min | Journal manuel |

## 9. Périmètre du MVP

- **MVP** : F1 liste des alarmes, F2 édition d'une alarme, F3 défi configurable par alarme, F4 sonnerie fiable sur Android, F5 écran de défi, F6 réglages généraux.
- **Version 2** : F7 iOS (AlarmKit), F8 répétition (snooze) payée par une question, F9 statistiques et séries, F10 mode entraînement et fiches, F11 nouveaux modules.
- **Hors périmètre** : comptes, synchronisation, publicité, contenu généré par IA.

## 10. Contraintes

- **[Fait]** L'interface suit UI.pdf (fond noir, cartes arrondies, bleu #00A3FF, bouton vert en dégradé) et le logo Reveilly.svg.
- **[Fait]** Comme dans les pages d'exemple, on peut ne retenir que certains thèmes ou modes.
- **[Fait]** L'utilisateur autorise toutes les modifications jugées utiles.
- Fonctionnement 100 % hors ligne : aucune connexion au réveil.

## 11. Questions ouvertes

- D3 : publication sur le Play Store ou non (impose la déclaration des permissions d'alarme exacte et plein écran).
- Faut-il un « snooze » ? (F8, non prévu dans la maquette.)

## Sources

- https://alar.my/en/blog/how-to-choose-alarmy-mission (consulté le 2026-10-23)
- https://developer.android.com/training/scheduling/alarms (consulté le 2026-10-23)
- https://source.android.com/docs/core/permissions/fsi-limits (consulté le 2026-10-23)
- https://developer.apple.com/documentation/alarmkit (consulté le 2026-10-23)
