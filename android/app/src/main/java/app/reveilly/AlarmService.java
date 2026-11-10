package app.reveilly;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import android.os.VibrationAttributes;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

import org.json.JSONObject;

/** Service au premier plan : son en boucle (flux alarme), vibration, notification plein écran.
 *  Il ne s'arrête que sur ordre du JS (défi réussi) ou après la durée maximale réglée. */
public class AlarmService extends Service {
    static final String ACTION_START = "app.reveilly.START", ACTION_STOP = "app.reveilly.STOP", ACTION_PAUSE = "app.reveilly.PAUSE";
    static final String EXTRA_SECONDS = "reveilly_seconds";
    private static final String CHANNEL = "reveilly_alarm";
    private static final int NOTIF_ID = 4242;
    private static final String TAG = "Reveilly";

    /** Alarme en cours, lue par le plugin (null = rien ne sonne). */
    static volatile String ringingId = null;
    /** Service en cours d'exécution : le plugin l'appelle directement (pas d'intent, donc rien à perdre en route). */
    private static volatile AlarmService instance;
    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    private final Handler handler = new Handler(Looper.getMainLooper());
    private MediaPlayer player;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private int savedVolume = -1;
    private long startedAt;
    private float target = 0.8f;
    private int rampSeconds = 30;
    private boolean vibrateOn, paused;

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
    }

    /** Appelé par le plugin à chaque activité de l'utilisateur. Renvoie false si rien ne sonne. */
    static boolean requestPause(double seconds) {
        AlarmService s = instance;
        if (s == null || ringingId == null) return false;
        MAIN.post(() -> s.pauseFor(seconds));
        return true;
    }

    static boolean requestStop() {
        AlarmService s = instance;
        if (s == null) return false;
        MAIN.post(s::stopAll);
        return true;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_STOP.equals(action)) {
            stopAll();
            return START_NOT_STICKY;
        }
        if (ACTION_PAUSE.equals(action)) {
            pauseFor(intent.getDoubleExtra(EXTRA_SECONDS, 20));
            return START_STICKY;
        }
        String id = intent != null ? intent.getStringExtra(AlarmScheduler.EXTRA_ID) : null;
        if (id == null) id = ringingId;
        if (id == null) { stopSelf(); return START_NOT_STICKY; }
        JSONObject a = AlarmStore.find(this, id);
        if (a == null) a = new JSONObject();
        JSONObject s = AlarmStore.settings(this);

        startInForeground(id, a);
        if (ringingId != null) releaseMedia(); // une nouvelle alarme remplace la précédente
        ringingId = id;
        startedAt = SystemClock.elapsedRealtime();
        // Volume de l'alarme × volume général (Réglages).
        double master = Math.max(0, Math.min(1, s.optDouble("masterVolume", 1)));
        target = (float) Math.max(0.02, Math.min(1, a.optDouble("volume", 0.8) * master));
        rampSeconds = s.optInt("rampSeconds", 30);

        acquireWakeLock(s.optInt("maxRingMinutes", 15));
        playSound(a.optString("sound", "default"));
        vibrateOn = a.optBoolean("vibrate", true);
        paused = false;
        if (vibrateOn) vibrate();
        int max = s.optInt("maxRingMinutes", 15);
        handler.removeCallbacksAndMessages(null);
        if (max > 0) handler.postDelayed(this::stopAll, max * 60_000L);
        handler.post(ramp);

        ReveillyAlarmPlugin.notifyRinging(id);
        return START_STICKY;
    }

    private void startInForeground(String id, JSONObject a) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Réveils", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("Sonnerie des réveils Reveilly");
            ch.setSound(null, null); // le son est joué par le service, en boucle
            ch.enableVibration(false);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            ch.setBypassDnd(true);
            nm.createNotificationChannel(ch);
        }
        Intent open = new Intent(this, MainActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP)
                .putExtra(AlarmScheduler.EXTRA_ID, id);
        PendingIntent pi = PendingIntent.getActivity(this, 2, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String label = a.optString("label", "Réveil");
        String time = String.format(java.util.Locale.FRANCE, "%d:%02d", a.optInt("hour"), a.optInt("minute"));
        Notification n = new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(R.drawable.ic_stat_alarm)
                .setContentTitle(("test".equals(id) ? "Test du réveil" : label) + " · " + time)
                .setContentText("Réponds aux questions pour arrêter l’alarme")
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(pi)
                .setFullScreenIntent(pi, true)
                .build();
        n.flags |= Notification.FLAG_INSISTENT | Notification.FLAG_NO_CLEAR;
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0;
        ServiceCompat.startForeground(this, NOTIF_ID, n, type);
    }

    private Uri soundUri(String sound) {
        if ("melodie".equals(sound) || "bips".equals(sound)) {
            return Uri.parse("android.resource://" + getPackageName() + "/raw/" + sound);
        }
        if (sound != null && sound.startsWith("content://")) return Uri.parse(sound);
        Uri u = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM);
        if (u == null) u = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        return u;
    }

    private void playSound(String sound) {
        AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        try {
            // On monte le flux « alarme » au maximum le temps de la sonnerie ; le réglage de l'alarme dose le volume réel.
            savedVolume = am.getStreamVolume(AudioManager.STREAM_ALARM);
            am.setStreamVolume(AudioManager.STREAM_ALARM, am.getStreamMaxVolume(AudioManager.STREAM_ALARM), 0);
        } catch (SecurityException e) {
            savedVolume = -1; // mode Ne pas déranger sans accès : on garde le volume du système
        }
        Uri[] tries = { soundUri(sound), soundUri("default"), soundUri("melodie") };
        for (Uri u : tries) {
            if (u == null) continue;
            try {
                MediaPlayer mp = new MediaPlayer();
                mp.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
                mp.setDataSource(this, u);
                mp.setLooping(true);
                mp.prepare();
                mp.setVolume(0.1f, 0.1f);
                mp.start();
                player = mp;
                return;
            } catch (Exception e) {
                Log.w(TAG, "Son illisible, essai suivant : " + u, e);
            }
        }
    }

    /** Même courbe que src/core/audio.js : 10 % → volume choisi en rampSeconds. */
    static float rampVolume(float target, float elapsed, int rampSeconds) {
        if (rampSeconds <= 0 || elapsed >= rampSeconds) return target;
        float start = Math.min(0.1f, target);
        return start + (target - start) * Math.max(0, elapsed) / rampSeconds;
    }

    private final Runnable ramp = new Runnable() {
        @Override public void run() {
            if (player == null) return;
            float el = (SystemClock.elapsedRealtime() - startedAt) / 1000f;
            float v = rampVolume(target, el, rampSeconds);
            try { player.setVolume(v, v); } catch (IllegalStateException ignored) {}
            if (el < rampSeconds) handler.postDelayed(this, 250);
        }
    };

    /** L'utilisateur répond : silence, puis reprise automatique après `seconds` sans nouvel appel.
     *  Le JS renvoie l'ordre à chaque activité ; s'il se tait (app quittée, plantée), le son revient seul. */
    private void pauseFor(double seconds) {
        if (ringingId == null) return;
        handler.removeCallbacks(resume);
        if (!paused) {
            if (player != null) try { player.pause(); } catch (IllegalStateException ignored) {}
            if (vibrator != null) vibrator.cancel();
            paused = true;
        }
        handler.postDelayed(resume, Math.max(0, (long) (seconds * 1000)));
    }

    private final Runnable resume = new Runnable() {
        @Override public void run() {
            if (!paused || ringingId == null) return;
            paused = false;
            float v = rampVolume(target, (SystemClock.elapsedRealtime() - startedAt) / 1000f, rampSeconds);
            if (player != null) try { player.setVolume(v, v); player.start(); } catch (IllegalStateException ignored) {}
            if (vibrateOn) vibrate();
        }
    };

    private void vibrate() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            vibrator = ((VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE)).getDefaultVibrator();
        } else {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        }
        if (vibrator == null || !vibrator.hasVibrator()) return;
        long[] pattern = { 0, 700, 500 };
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0), VibrationAttributes.createForUsage(VibrationAttributes.USAGE_ALARM));
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0),
                    new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build());
        } else {
            vibrator.vibrate(pattern, 0);
        }
    }

    private void acquireWakeLock(int maxMinutes) {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (wakeLock == null) wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "reveilly:ring");
        if (!wakeLock.isHeld()) wakeLock.acquire((maxMinutes > 0 ? maxMinutes : 60) * 60_000L);
    }

    private void releaseMedia() {
        handler.removeCallbacks(ramp);
        handler.removeCallbacks(resume);
        paused = false;
        if (player != null) { try { player.stop(); } catch (Exception ignored) {} player.release(); player = null; }
        if (vibrator != null) { vibrator.cancel(); vibrator = null; }
        if (savedVolume >= 0) {
            try {
                ((AudioManager) getSystemService(Context.AUDIO_SERVICE)).setStreamVolume(AudioManager.STREAM_ALARM, savedVolume, 0);
            } catch (SecurityException ignored) {}
            savedVolume = -1;
        }
    }

    private void stopAll() {
        handler.removeCallbacksAndMessages(null);
        releaseMedia();
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        ringingId = null;
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        if (instance == this) instance = null;
        handler.removeCallbacksAndMessages(null);
        releaseMedia();
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        super.onDestroy();
    }
}
