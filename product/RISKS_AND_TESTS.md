# Reveilly — Risques et tests

> Version 1 · 2026-10-23

## 1. Risques

| ID | Risque | Type | Probabilité | Impact | Prévention | Repli |
|---|---|---|---|---|---|---|
| R1 | Surcouche constructeur (Xiaomi, Samsung, Huawei…) qui tue l'application ou retarde l'alarme | Plateforme | Moyenne | Fort | `setAlarmClock` (exempté de Doze), ligne « batterie » dans Réglages | Guide https://dontkillmyapp.com [À vérifier] |
| R2 | Permission plein écran retirée (Android 14+) ou notifications refusées | Plateforme | Moyenne | Moyen | Bandeau rouge sur E1, bouton « Corriger » | Le son joue quand même ; toucher la notification ouvre le défi |
| R3 | L'utilisateur force l'arrêt de l'app pour couper le son | Usage | Moyenne | Moyen | Aucun moyen légitime de l'empêcher | Accepté : le but est de réveiller, pas d'enfermer |
| R4 | Questions trop dures au réveil, utilisateur bloqué | Usage | Moyenne | Fort | « Je ne sais pas » montre la réponse et passe ; une mauvaise réponse ne pénalise pas ; arrêt automatique réglable | Réduire le nombre de questions |
| R5 | Publication Play refusée (USE_EXACT_ALARM, plein écran) | Légal | Faible | Moyen | La fonction principale est un réveil, cas prévu par Google | APK hors store (H5) |
| R6 | Écart entre le calcul de date JS et natif | Technique | Faible | Fort | Mêmes cas testés des deux côtés (`tests/time.test.js`, `AlarmSchedulerTest.java`) | — |
| R7 | Fichier son personnalisé supprimé ou déplacé | Technique | Faible | Moyen | Permission d'URI persistante | Repli automatique : sonnerie système puis mélodie intégrée |

## 2. Hypothèses non vérifiées

| ID | Hypothèse | Comment la vérifier | Quand | Ce qu'on fait si elle est fausse |
|---|---|---|---|---|
| H1 | Cible scolaire francophone | 5 testeurs, 2 semaines | Après l'APK | Modules non scolaires (F11) |
| H2 | Android suffit | Demander la plateforme des testeurs | Avant de recruter | Lancer F7 (AlarmKit) |
| H3 | N bonnes réponses | Observer abandons et temps de coupure | Pendant le test | Option « N réponses » |
| H4 | Barre = volume, icône = vibration | Relecture de la maquette par l'utilisateur | Maintenant | Ajuster E2 |
| H5 | APK installé à la main | Décision D3 | Avant publication | Fiche Play + déclarations |

## 3. Stratégie de test

| Niveau | Outil | Ce qui est couvert | Quand l'exécuter |
|---|---|---|---|
| Unitaire JS | Vitest | Dates, magasin, modules, correction, session, volume | À chaque modification |
| Unitaire natif | JUnit (`android/app/src/test`) | `nextTrigger`, rampe de volume | À chaque modification du natif |
| Bout en bout Web | Playwright (Chromium) | Création, validation, test de réveil, défi résolu | Avant livraison |
| Manuel | Téléphone Android réel | Sonnerie, écran verrouillé, redémarrage, permissions | Avant chaque livraison |

**Commande unique** : `npm test` (et `npm run test:android` pour le natif).

## 4. Couverture des critères d'acceptation

| Critère | Vérification | Test ou scénario | Tâche |
|---|---|---|---|
| AC-F1-1 | Automatique | `store.test.js` « liste triée » | T1 |
| AC-F1-2 | Automatique + manuelle | `store.test.js` « toggle » ; M1 (annulation native) | T1, T6 |
| AC-F1-3 | Automatique | `store.test.js` « dupliquer » | T1 |
| AC-F1-4 | Automatique | `store.test.js` « supprimer puis annuler » | T1 |
| AC-F2-1 | Automatique | `time.test.js`, `AlarmSchedulerTest` | T1 |
| AC-F2-2 | Automatique | `time.test.js`, `AlarmSchedulerTest` | T1 |
| AC-F2-3 | Manuelle | M1 | T3 |
| AC-F3-1 | Automatique | `modules.test.js` « Puissances » | T2 |
| AC-F3-2 | Automatique | `modules.test.js` « Opposition » | T2 |
| AC-F3-3 | Automatique | `challenge.test.js` | T4 |
| AC-F3-4 | Automatique + E2E | `store.test.js`, Playwright | T3 |
| AC-F4-1 | Manuelle | M1 | T6 |
| AC-F4-2 | Manuelle | M2 | T6 |
| AC-F4-3 | Manuelle | M3 | T6 |
| AC-F4-4 | Manuelle | M2 | T6 |
| AC-F5-1 | Automatique | `modules.test.js` « 7 × 8 » | T2 |
| AC-F5-2 | Automatique | `modules.test.js` « metaphor » | T2 |
| AC-F5-3 | Automatique + E2E | `challenge.test.js`, Playwright | T4 |
| AC-F5-4 | Automatique | `challenge.test.js` | T4 |
| AC-F5-5 | E2E Web + manuelle | Playwright (pause à la touche, reprise 10 s après la dernière activité) ; M2 | T4 |
| AC-F6-1 | Automatique + manuelle | `challenge.test.js` « volume progressif », `AlarmSchedulerTest` ; M1 à l'oreille | T5 |
| AC-F6-2 | E2E Web + manuelle | Playwright ; M4 | T5, T8 |
| AC-F6-3 | Manuelle | M5 | T6 |

## 5. Scénarios de test manuels

### M1 — Sonnerie application fermée

- **Préparation** : APK installé, permissions accordées.
- **Étapes** : créer une alarme dans 2 minutes ; fermer l'application (balayer depuis les récents) ; attendre.
- **Résultat attendu** : sonnerie à l'heure (± 5 s), volume qui monte, défi affiché ; après les bonnes réponses, silence ; si l'alarme est unique, elle apparaît désactivée.
- **Critères couverts** : AC-F4-1, AC-F2-3, AC-F1-2, AC-F6-1

### M2 — Écran verrouillé et tentative de fuite

- **Étapes** : alarme dans 2 minutes, verrouiller l'écran ; à la sonnerie, toucher l'écran, attendre 20 s sans rien faire, puis appuyer sur Retour puis Accueil.
- **Résultat attendu** : l'écran s'allume sur le défi sans déverrouiller ; le son se tait à la touche et revient après 20 s ; Retour/Accueil ne coupent pas le son (il revient aussitôt) ; la notification rouvre le défi.
- **Critères couverts** : AC-F4-2, AC-F4-4, AC-F5-5

### M3 — Redémarrage

- **Étapes** : alarme dans 5 minutes ; redémarrer le téléphone sans ouvrir l'application.
- **Résultat attendu** : la sonnerie a lieu à l'heure.
- **Critères couverts** : AC-F4-3

### M4 — Test du réveil

- **Étapes** : Réglages → « Tester un réveil dans 10 s » → verrouiller.
- **Résultat attendu** : sonnerie après 10 s, une seule question.
- **Critères couverts** : AC-F6-2

### M5 — Permissions

- **Étapes** : dans les réglages Android, retirer « Alarmes et rappels » puis les notifications ; rouvrir Reveilly.
- **Résultat attendu** : bandeau rouge sur la liste ; lignes rouges dans Réglages ; « Corriger » ouvre la bonne page système.
- **Critères couverts** : AC-F6-3

## 6. Validation du MVP

Le MVP est validé quand :

- [x] `npm test` passe (34 tests) et `AlarmSchedulerTest` passe (5 tests, exécuté hors Gradle) ;
- [x] le parcours Web complet passe sous Playwright ;
- [ ] l'APK se construit (`./gradlew assembleDebug`) : **non fait ici**, le SDK Android n'est pas téléchargeable dans l'environnement de développement ; le code natif a été compilé avec `javac` contre la plateforme Android 16 (API 36) ;
- [ ] M1 à M5 exécutés sur un téléphone réel ;
- [ ] 14 matins de test personnel (indicateurs du brief).

## 7. Après le lancement

Noter chaque matin : heure de sonnerie réelle, temps pour couper, erreurs, réveillé ou non. Signaux d'alerte : retard de sonnerie (R1), abandon par « Je ne sais pas » répété (R4).
