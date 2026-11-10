package app.reveilly;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONObject;

/** Déclenché par AlarmManager à l'heure de l'alarme. */
public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        String id = intent.getStringExtra(AlarmScheduler.EXTRA_ID);
        if (id == null) return;
        JSONObject a = AlarmStore.find(ctx, id);
        if (a == null) return;
        boolean test = "test".equals(id);
        JSONArray days = a.optJSONArray("days");
        if (!test && (days == null || days.length() == 0)) AlarmStore.markFiredOnce(ctx, id);

        Intent svc = new Intent(ctx, AlarmService.class).setAction(AlarmService.ACTION_START).putExtra(AlarmScheduler.EXTRA_ID, id);
        ContextCompat.startForegroundService(ctx, svc);

        // Les alarmes répétées se reprogramment seules, même si l'application n'est jamais rouverte.
        AlarmScheduler.scheduleAll(ctx);
    }
}
