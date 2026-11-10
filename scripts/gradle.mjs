/* Lance Gradle dans android/ sur Windows, macOS et Linux : `node scripts/gradle.mjs assembleDebug`.
   Trouve aussi le SDK Android et le Java d'Android Studio s'ils ne sont pas configurés. */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const win = process.platform === 'win32', mac = process.platform === 'darwin';
const android = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'android');
const env = { ...process.env };

const local = join(android, 'local.properties');
if (!existsSync(local) && !env.ANDROID_HOME && !env.ANDROID_SDK_ROOT) {
  const sdk = [
    win && env.LOCALAPPDATA && join(env.LOCALAPPDATA, 'Android', 'Sdk'),
    mac && join(homedir(), 'Library', 'Android', 'sdk'),
    join(homedir(), 'Android', 'Sdk')
  ].find(p => p && existsSync(p));
  if (!sdk) {
    console.error('SDK Android introuvable. Installez Android Studio (il installe le SDK), ouvrez-le une fois, puis relancez.');
    process.exit(1);
  }
  writeFileSync(local, `sdk.dir=${sdk.replace(/\\/g, '\\\\').replace(/:/g, '\\:')}\n`);
  console.log(`SDK Android : ${sdk}`);
}

/* Gradle 8.14 + Android Gradle Plugin 8.13 tournent sur Java 17 à 24 (Java 25 : « Unsupported class
   file major version 69 »). On garde JAVA_HOME s'il convient, sinon on cherche un JDK compatible, 21 de préférence. */
const OK = v => v >= 17 && v <= 24;
function javaMajor(home) {
  const bin = home ? join(home, 'bin', win ? 'java.exe' : 'java') : 'java';
  if (home && !existsSync(bin)) return 0;
  const r = spawnSync(bin, ['-version'], { encoding: 'utf8', env: { ...env, JAVA_TOOL_OPTIONS: '' } });
  const m = /version "(\d+)(?:\.(\d+))?/.exec(`${r.stderr || ''}${r.stdout || ''}`);
  return m ? (m[1] === '1' ? +m[2] : +m[1]) : 0;
}
const subdirs = dir => { try { return readdirSync(dir).map(d => join(dir, d)); } catch { return []; } };
function javaCandidates() {
  const pf = [env.ProgramFiles || 'C:\\Program Files', env['ProgramFiles(x86)']].filter(Boolean);
  return [
    win && 'C:\\Program Files\\Android\\Android Studio\\jbr',
    mac && '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
    '/opt/android-studio/jbr',
    ...(win ? pf.flatMap(p => ['Eclipse Adoptium', 'Java', 'Microsoft', 'Zulu', 'Amazon Corretto', 'BellSoft'].flatMap(v => subdirs(join(p, v)))) : []),
    ...(mac ? subdirs('/Library/Java/JavaVirtualMachines').map(d => join(d, 'Contents', 'Home')) : []),
    ...(!win && !mac ? subdirs('/usr/lib/jvm') : []),
    ...subdirs(join(homedir(), '.jdks'))
  ].filter(Boolean);
}
const current = javaMajor(env.JAVA_HOME);
if (!OK(current)) {
  const found = javaCandidates().map(h => [h, javaMajor(h)]).filter(([, v]) => OK(v)).sort((a, b) => (b[1] === 21) - (a[1] === 21) || b[1] - a[1])[0];
  if (found) {
    env.JAVA_HOME = found[0];
    console.log(`Java ${found[1]} : ${found[0]}`);
  } else if (!(env.JAVA_HOME ? false : OK(javaMajor()))) {
    console.error(`Aucun Java compatible trouvé (il faut Java 17 à 24, idéalement 21${current ? ` ; trouvé : Java ${current}` : ''}).
Installez le JDK 21 puis relancez :
  Windows : winget install EclipseAdoptium.Temurin.21.JDK
  macOS   : brew install --cask temurin@21
  Linux   : sudo apt install openjdk-21-jdk
ou téléchargez-le sur https://adoptium.net/temurin/releases/?version=21`);
    process.exit(1);
  }
}

const [cmd, args] = win ? ['gradlew.bat', process.argv.slice(2)] : ['sh', ['gradlew', ...process.argv.slice(2)]];
const r = spawnSync(cmd, args, { cwd: android, env, stdio: 'inherit', shell: win });
if (r.status === 0 && process.argv.includes('assembleDebug')) {
  console.log(`\nAPK : ${join(android, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')}`);
}
process.exit(r.status ?? 1);
