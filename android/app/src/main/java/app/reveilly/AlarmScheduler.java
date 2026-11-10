package app.reveilly;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

/** Planification avec AlarmManager.setAlarmClock (réservé aux réveils, exempté de Doze). */
final class AlarmScheduler {
    static final String EXTRA_ID = "reveilly_alarm_id";
    private static final String TAG = "Reveilly";

    private AlarmScheduler() {}

    /** Jours : 0 = lundi … 6 = dimanche, comme côté JS (src/core/time.js). */
    static int dayIndex(Calendar c) {
        return (c.get(Calendar.DAY_OF_WEEK) + 5) % 7;
    }

    /** Prochaine sonnerie strictement après `nowMs`, ou -1. */
    static long nextTrigger(JSONObject a, long nowMs) {
        if (a == null || !a.optBoolean("enabled", true)) return -1;
        JSONArray days = a.optJSONArray("days");
        int hour = a.optInt("hour", 7), minute = a.optInt("minute", 0);
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(nowMs);
        c.set(Calendar.HOUR_OF_DAY, hour);
        c.set(Calendar.MINUTE, minute);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        for (int k = 0; k <= 7; k++) {
            if (k > 0) {
                c.add(Calendar.DAY_OF_MONTH, 1);
                c.set(Calendar.HOUR_OF_DAY, hour);
                c.set(Calendar.MINUTE, minute);
            }
            if (c.getTimeInMillis() <= nowMs) continue;
            if (days == null || days.length() == 0 || contains(days, dayIndex(c))) return c.getTimeInMillis();
        }
        return -1;
    }

    private static boolean contains(JSONArray a, int v) {
        for (int i = 0; i < a.length(); i++) if (a.optInt(i, -1) == v) return true;
        return false;
    }

    static PendingIntent operation(Context ctx, String id) {
        Intent i = new Intent(ctx, AlarmReceiver.class).setAction("app.reveilly.ALARM").putExtra(EXTRA_ID, id);
        return PendingIntent.getBroadcast(ctx, id.hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent showIntent(Context ctx) {
        Intent i = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(ctx, 1, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static boolean canExact(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();
    }

    static void set(Context ctx, String id, long at) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        PendingIntent op = operation(ctx, id);
        if (canExact(ctx)) {
            am.setAlarmClock(new AlarmManager.AlarmClockInfo(at, showIntent(ctx)), op);
        } else {
            // Repli sans permission d'alarme exacte : peut sonner avec quelques minutes de retard.
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, op);
            Log.w(TAG, "Permission d'alarme exacte absente : alarme inexacte pour " + id);
        }
    }

    /** Annule tout ce qui était programmé puis reprogramme chaque alarme active. */
    static synchronized void scheduleAll(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        JSONArray old = AlarmStore.scheduledIds(ctx);
        for (int i = 0; i < old.length(); i++) am.cancel(operation(ctx, old.optString(i)));

        JSONArray all = AlarmStore.alarms(ctx), ids = new JSONArray();
        // Marge d'une minute : une alarme qui vient de sonner ne se reprogramme pas pour la même minute.
        long now = System.currentTimeMillis() + 60_000;
        for (int i = 0; i < all.length(); i++) {
            JSONObject a = all.optJSONObject(i);
            long at = nextTrigger(a, now);
            if (at > 0) {
                set(ctx, a.optString("id"), at);
                ids.put(a.optString("id"));
            }
        }
        AlarmStore.setScheduledIds(ctx, ids);
    }

    static void scheduleTest(Context ctx, JSONObject alarm, int seconds) {
        AlarmStore.setTest(ctx, alarm);
        set(ctx, "test", System.currentTimeMillis() + seconds * 1000L);
    }
}
