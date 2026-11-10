package app.reveilly;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Redémarrage, changement d'heure ou de fuseau, mise à jour, permission accordée : on reprogramme. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        AlarmScheduler.scheduleAll(ctx);
    }
}
