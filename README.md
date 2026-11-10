# Reveilly

Dépôt GitHub : **https://github.com/Les-Doubles-A/Reveilly**

Réveil Android qui ne s'arrête qu'après avoir répondu juste à des questions : calcul mental et figures de style, avec, pour chaque alarme, le choix des thèmes, du mode (choix multiple ou saisie libre) et du nombre de questions.

## Lancer

```bash
npm install
npm test            # 34 tests (dates, alarmes, modules, défi)
npm run dev         # aperçu dans le navigateur (l'alarme ne sonne que page ouverte)
```

## Construire l'APK Android

Prérequis : **Android Studio** installé et ouvert une fois (il installe le SDK Android), et **Java 17 à 24, idéalement le JDK 21**. Java 25 ne marche pas encore avec Gradle 8.14 (« Unsupported class file major version 69 »). Sous Windows : `winget install EclipseAdoptium.Temurin.21.JDK`. Marche sous Windows, macOS et Linux.

```bash
npm install
npm run apk         # build Web + synchro + Gradle → android/app/build/outputs/apk/debug/app-debug.apk
```

Le script trouve tout seul le SDK (`%LOCALAPPDATA%\Android\Sdk` sous Windows). Si `JAVA_HOME` est absent ou pointe vers un Java trop récent, il cherche un JDK compatible (Android Studio, Adoptium, Oracle, Microsoft, Zulu, Corretto…) et l'utilise pour ce build seulement. N'utilisez pas `npm audit fix --force` : il change la version de Capacitor ; les alertes « moderate » concernent seulement les outils de développement. Le premier build télécharge Gradle et les dépendances (quelques minutes).

Autre voie : `npm run android` ouvre le projet dans Android Studio, puis **Build › Build App Bundle(s) / APK(s) › Build APK(s)**. Si Android Studio affiche la même erreur de version, choisissez un JDK 21 dans **Settings › Build, Execution, Deployment › Build Tools › Gradle › Gradle JDK**.

Pour installer l'APK : copiez `app-debug.apk` sur le téléphone et ouvrez-le (autorisez « sources inconnues »), ou branchez le téléphone en USB avec le débogage activé et lancez `adb install android/app/build/outputs/apk/debug/app-debug.apk`.

Au premier lancement : créer une alarme (Android demande les notifications), puis ouvrir **Réglages** et corriger toute ligne rouge. Sur Xiaomi, Samsung ou Huawei, retirer aussi la restriction de batterie.

Tests natifs : `npm run test:android`.

## Organisation

| Dossier | Contenu |
|---|---|
| `src/modules/` | Modules de questions (`math.js`, `figures.js`) repris des pages d'origine ; un module = un fichier + une ligne dans `index.js` |
| `src/core/` | Dates, stockage, session de défi, volume progressif (testés) |
| `src/ui/` | Écrans : liste, édition, réglages, sonnerie |
| `src/platform/` | `native.js` (plugin Android) ou `web.js` (aperçu navigateur) |
| `android/app/src/main/java/app/reveilly/` | Plugin `ReveillyAlarm` : `AlarmManager.setAlarmClock`, service de sonnerie au premier plan, affichage sur écran verrouillé, reprogrammation au démarrage |
| `product/` | Cadrage : brief, fonctionnalités et critères, architecture, plan, risques et tests |

## Ajouter un module de questions

```js
// src/modules/conjugaison.js
export default {
  id: 'conj', name: 'Conjugaison', short: 'Conj',
  themes: [{ id: 'present', label: 'Présent' }],
  defaults: { themes: ['present'], count: 1 },
  generate({ themes, mode }, rng) {
    return { module: 'conj', key: '…', prompt: '<p>…</p>', input: 'text' /* ou 'keypad', 'choice' + choices */,
      check: answer => ({ status: 'ok' | 'ko' | 'retry', title, feedback, answer }),
      reveal: () => ({ status: 'ko', title, feedback, answer }) };
  }
};
```

Puis l'ajouter à `MODULES` dans `src/modules/index.js` : il apparaît automatiquement dans l'écran d'édition.

<!-- installeur-release -->
## Installation

Téléchargez **`Reveilly-1.0.0.apk`** depuis la [dernière release](https://github.com/Les-Doubles-A/Reveilly/releases/latest), puis lancez-le.

Copiez l'APK sur le téléphone Android et ouvrez-le (autorisez l'installation depuis des sources inconnues), ou installez-le en USB : `adb install Reveilly-1.0.0.apk`.

### Recréer l'installeur

`npm run apk` produit l'APK (`android\app\build\outputs\apk\debug\app-debug.apk`).
