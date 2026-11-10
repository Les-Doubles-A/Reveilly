# Reveilly — Plan d'implémentation

> Version 1 · 2026-10-23 · Pour confier une tâche à Claude Code : « Implémente T3 de product/IMPLEMENTATION_PLAN.md »

## 1. Décisions à prendre avant de coder

| ID | Décision | Options | Recommandation | Bloque |
|---|---|---|---|---|
| D1 | Plateforme du MVP | Android seul / Android + iOS | Android seul, iOS en V2 avec AlarmKit (H2) | T6 |
| D2 | Règle d'arrêt | N bonnes réponses / N réponses | N bonnes réponses (H3) | T4 |
| D3 | Publication Play Store | APK manuel / Play Store | APK manuel pour le test de 2 semaines (H5) | Aucune tâche du MVP |

## 2. Étapes

1. **Fondations** — projet Vite + Capacitor, Vitest, modèle d'alarme et calcul des dates (T1).
2. **Contenu** — extraction des deux modules et filtres (T2).
3. **Parcours principal** — liste, édition, défi, couche Web (T3, T4, T5).
4. **Natif** — plugin Android et réglages (T6, T7).
5. **Validation du MVP** — scénarios manuels sur appareil (T8).

## 3. Tranche 1 — premier résultat testable

- **Ce que l'utilisateur pourra faire à la fin** : dans un navigateur, créer une alarme, la voir sonner page ouverte, et la couper en répondant aux questions filtrées.
- **Tâches incluses** : T1 à T5.
- **Comment le tester** : `npm test`, puis `npm run dev` ou l'aperçu publié, réglage « Tester un réveil dans 10 s ».

## 4. Tâches

### T1 — Fondations, dates et magasin

- **Objectif** : projet qui se construit et se teste ; alarmes persistées.
- **Dépend de** : aucune
- **Fichiers ou composants** : `package.json`, `vite.config.js`, `src/core/time.js`, `src/core/store.js`, `tests/time.test.js`, `tests/store.test.js`
- **À faire** :
  1. Vite, Vitest, Capacitor ; police Cabin embarquée.
  2. `nextOccurrence(alarm, now)` et `normalizeAlarm`.
  3. Magasin : ajouter, modifier, dupliquer, supprimer/annuler, trier.
- **Tests** : dates (semaine, alarme unique, passage de minuit), opérations du magasin.
- **Terminé quand** : `npm test` passe.
- **Couvre** : F1, F2, AC-F1-1, AC-F1-3, AC-F1-4, AC-F2-1, AC-F2-2
- **Statut** : fait — `npm test` : tests/time.test.js et tests/store.test.js passent

### T2 — Modules de questions et filtres

- **Objectif** : générateurs Math et Figures de style derrière une interface commune.
- **Dépend de** : T1
- **Fichiers ou composants** : `src/modules/math.js`, `src/modules/figures.js`, `src/modules/index.js`, `tests/modules.test.js`
- **À faire** :
  1. Reprendre les générateurs (10 thèmes) et les 70 figures (7 thèmes) sans changer le contenu.
  2. `generate({themes, mode})`, `check()` avec la tolérance d'origine (fractions, fautes).
- **Tests** : filtrage par thème, réponses justes et fausses, fautes tolérées, toutes les questions générées ont une réponse cohérente.
- **Terminé quand** : `npm test` passe.
- **Couvre** : F3, F5, AC-F3-1, AC-F3-2, AC-F5-1, AC-F5-2
- **Statut** : fait — tests/modules.test.js passe (68 figures, 9 thèmes Math)

### T3 — Liste et édition (UI de la maquette)

- **Objectif** : écrans E1 et E2 conformes à UI.pdf.
- **Dépend de** : T1, T2
- **Fichiers ou composants** : `src/ui/list.js`, `src/ui/edit.js`, `src/ui/wheel.js`, `src/styles.css`
- **À faire** : cartes, interrupteurs, menu ⋮, roues, jours, panneaux de modules, carte son, validation.
- **Tests** : validation du défi (`validateAlarm`) en unitaire ; rendu vérifié à la main (captures).
- **Terminé quand** : P1 étapes 1 à 5 réalisables dans le navigateur.
- **Couvre** : F1, F2, F3, AC-F1-2, AC-F2-3, AC-F3-4
- **Statut** : fait — captures Playwright (Chromium, 390×844) et parcours E2E ; rendu sur téléphone à confirmer

### T4 — Session de défi et écran de sonnerie

- **Objectif** : E4 ; arrêt après N bonnes réponses.
- **Dépend de** : T2, D2
- **Fichiers ou composants** : `src/core/challenge.js`, `src/ui/ring.js`, `tests/challenge.test.js`
- **Tests** : comptage (mauvaise réponse ne compte pas), mélange des modules, fin du défi.
- **Terminé quand** : `npm test` passe et le défi coupe la sonnerie Web.
- **Couvre** : F5, AC-F3-3, AC-F5-3, AC-F5-4, AC-F5-5
- **Statut** : fait — tests/challenge.test.js + E2E « Bien réveillé ! »

### T5 — Couche plateforme Web et réglages

- **Objectif** : aperçu fonctionnel dans un navigateur ; écran E3.
- **Dépend de** : T3, T4
- **Fichiers ou composants** : `src/platform/web.js`, `src/core/audio.js`, `src/ui/settings.js`, `tests/audio.test.js`
- **Tests** : courbe de volume progressif.
- **Terminé quand** : « Tester un réveil dans 10 s » sonne et ouvre E4 dans le navigateur.
- **Couvre** : F6, AC-F6-1, AC-F6-2
- **Statut** : fait — test de réveil vérifié dans Chromium headless (le son n'est pas audible en headless : à écouter dans un vrai navigateur)

### T6 — Plugin Android natif

- **Objectif** : F4.
- **Dépend de** : D1, T5
- **Fichiers ou composants** : `android/app/src/main/java/app/reveilly/*.java`, `AndroidManifest.xml`, `src/platform/native.js`
- **À faire** : AlarmScheduler (setAlarmClock, calcul de la prochaine occurrence), AlarmReceiver, AlarmService (MediaPlayer USAGE_ALARM en boucle, rampe de volume, vibration, notification plein écran, durée max), BootReceiver (BOOT_COMPLETED, TIME_SET, TIMEZONE_CHANGED), MainActivity (showWhenLocked/turnScreenOn), sélection de fichier son persistante, état des permissions.
- **Tests** : compilation `./gradlew assembleDebug` ; scénarios M1 à M4.
- **Terminé quand** : l'APK se construit et M1 à M4 passent sur un appareil.
- **Couvre** : F4, F6, AC-F1-2, AC-F4-1, AC-F4-2, AC-F4-3, AC-F4-4, AC-F6-3
- **Statut** : code écrit et compilé avec `javac` contre Android 16 (API 36) ; `AlarmSchedulerTest` passe (5 tests) ; **APK non construit** ici (dl.google.com bloqué, donc ni Gradle Android ni SDK) ; essais sur appareil à faire

### T7 — Icônes et écran de démarrage

- **Objectif** : logo Reveilly comme icône d'application.
- **Dépend de** : T6
- **Fichiers ou composants** : `android/app/src/main/res/mipmap-*`, `public/`
- **Terminé quand** : l'icône apparaît dans le lanceur.
- **Couvre** : F1
- **Statut** : fait — icônes et écran de démarrage générés depuis Reveilly.svg ; affichage à vérifier sur appareil

### T8 — Validation sur appareil

- **Objectif** : exécuter M1 à M5 sur un téléphone Android réel.
- **Dépend de** : T6
- **Couvre** : AC-F4-1, AC-F4-2, AC-F4-3, AC-F4-4, AC-F6-2, AC-F6-3
- **Terminé quand** : tous les scénarios manuels passent.
- **Statut** : à faire (utilisateur)

## 5. Peut attendre

| Élément | Pourquoi attendre | Déclencheur |
|---|---|---|
| iOS / AlarmKit (F7) | Couche native différente | Testeurs iPhone |
| Snooze (F8) | Absent de la maquette | Demande |
| Statistiques (F9) | Valider d'abord l'usage | 2 semaines d'usage |
