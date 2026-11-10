package app.reveilly;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.OpenableColumns;
import android.provider.Settings;

import androidx.activity.result.ActivityResult;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Pont JS ↔ natif. Voir src/platform/native.js. */
@CapacitorPlugin(
        name = "ReveillyAlarm",
        permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) }
)
public class ReveillyAlarmPlugin extends Plugin {
    private static ReveillyAlarmPlugin instance;
    private MediaPlayer preview;

    @Override
    public void load() {
        instance = this;
    }

    /** Appelé par AlarmService quand une alarme se met à sonner. */
    static void notifyRinging(String id) {
        ReveillyAlarmPlugin p = instance;
        if (p == null) return;
        JSObject r = new JSObject();
        r.put("alarmId", id);
        r.put("test", "test".equals(id));
        p.notifyListeners("ringing", r, true);
    }

    @PluginMethod
    public void sync(PluginCall call) {
        try {
            JSArray alarms = call.getArray("alarms", new JSArray());
            JSObject settings = call.getObject("settings", new JSObject());
            AlarmStore.setAlarms(getContext(), new JSONArray(alarms.toString()));
            AlarmStore.setSettings(getContext(), new JSONObject(settings.toString()));
            AlarmScheduler.scheduleAll(getContext());
            call.resolve();
        } catch (JSONException e) {
            call.reject("Alarmes invalides", e);
        }
    }

    @PluginMethod
    public void getRinging(PluginCall call) {
        JSObject r = new JSObject();
        String id = AlarmService.ringingId;
        if (id != null) {
            r.put("alarmId", id);
            r.put("test", "test".equals(id));
        }
        call.resolve(r);
    }

    @PluginMethod
    public void consumeFired(PluginCall call) {
        JSObject r = new JSObject();
        try { r.put("ids", new JSArray(AlarmStore.consumeFired(getContext()).toString())); }
        catch (JSONException e) { r.put("ids", new JSArray()); }
        call.resolve(r);
    }

    @PluginMethod
    public void stopRinging(PluginCall call) {
        String id = call.getString("id");
        if (id != null) AlarmStore.forgetFired(getContext(), id);
        if (!AlarmService.requestStop()) {
            try { getContext().startService(new Intent(getContext(), AlarmService.class).setAction(AlarmService.ACTION_STOP)); }
            catch (Exception ignored) { /* service déjà arrêté */ }
        }
        Activity a = getActivity();
        if (a instanceof MainActivity) a.runOnUiThread(() -> ((MainActivity) a).showOverLockScreen(false));
        call.resolve();
    }

    @PluginMethod
    public void pauseRinging(PluginCall call) {
        JSObject r = new JSObject();
        r.put("paused", AlarmService.requestPause(call.getDouble("seconds", 20.0)));
        call.resolve(r);
    }

    @PluginMethod
    public void scheduleTest(PluginCall call) {
        try {
            JSObject alarm = call.getObject("alarm", new JSObject());
            AlarmScheduler.scheduleTest(getContext(), new JSONObject(alarm.toString()), call.getInt("seconds", 10));
            call.resolve();
        } catch (JSONException e) {
            call.reject("Alarme de test invalide", e);
        }
    }

    // ---------- Son ----------

    @PluginMethod
    public void pickSound(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT)
                .addCategory(Intent.CATEGORY_OPENABLE)
                .setType("audio/*")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, i, "pickResult");
    }

    @ActivityCallback
    private void pickResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.resolve(new JSObject());
            return;
        }
        Uri uri = data.getData();
        ContentResolver cr = getContext().getContentResolver();
        try { cr.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION); } catch (SecurityException ignored) {}
        String name = "Fichier";
        try (Cursor c = cr.query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (c != null && c.moveToFirst()) name = c.getString(0).replaceAll("\\.[^.]+$", "");
        } catch (Exception ignored) {}
        JSObject r = new JSObject();
        r.put("uri", uri.toString());
        r.put("name", name);
        call.resolve(r);
    }

    @PluginMethod
    public void previewSound(PluginCall call) {
        stopPreviewPlayer();
        String sound = call.getString("sound", "default");
        float vol = call.getFloat("volume", 0.8f);
        Uri u;
        if ("melodie".equals(sound) || "bips".equals(sound)) u = Uri.parse("android.resource://" + getContext().getPackageName() + "/raw/" + sound);
        else if (sound != null && sound.startsWith("content://")) u = Uri.parse(sound);
        else u = RingtoneManager.getActualDefaultRingtoneUri(getContext(), RingtoneManager.TYPE_ALARM);
        if (u == null) u = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        try {
            preview = new MediaPlayer();
            preview.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            preview.setDataSource(getContext(), u);
            preview.setLooping(true);
            preview.prepare();
            preview.setVolume(vol, vol);
            preview.start();
            call.resolve();
        } catch (Exception e) {
            stopPreviewPlayer();
            call.reject("Lecture impossible", e);
        }
    }

    @PluginMethod
    public void stopPreview(PluginCall call) {
        stopPreviewPlayer();
        call.resolve();
    }

    private void stopPreviewPlayer() {
        if (preview != null) {
            try { preview.stop(); } catch (Exception ignored) {}
            preview.release();
            preview = null;
        }
    }

    // ---------- Permissions ----------

    @PluginMethod
    public void getStatus(PluginCall call) {
        Context c = getContext();
        JSObject r = new JSObject();
        r.put("exactAlarm", AlarmScheduler.canExact(c));
        r.put("notifications", NotificationManagerCompat.from(c).areNotificationsEnabled());
        boolean fs = true;
        if (Build.VERSION.SDK_INT >= 34) fs = ((NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE)).canUseFullScreenIntent();
        r.put("fullScreen", fs);
        r.put("batteryUnrestricted", ((PowerManager) c.getSystemService(Context.POWER_SERVICE)).isIgnoringBatteryOptimizations(c.getPackageName()));
        call.resolve(r);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        String what = call.getString("what", "");
        if ("notifications".equals(what) && Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationsResult");
            return;
        }
        openSystemSettings(what);
        call.resolve();
    }

    @PermissionCallback
    private void notificationsResult(PluginCall call) {
        if (getPermissionState("notifications") != PermissionState.GRANTED) openSystemSettings("notifications");
        call.resolve();
    }

    private void openSystemSettings(String what) {
        Context c = getContext();
        Uri pkg = Uri.parse("package:" + c.getPackageName());
        Intent i;
        if ("exact".equals(what) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, pkg);
        } else if ("fullscreen".equals(what) && Build.VERSION.SDK_INT >= 34) {
            i = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, pkg);
        } else if ("battery".equals(what)) {
            i = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, c.getPackageName());
        } else {
            i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg);
        }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { c.startActivity(i); }
        catch (Exception e) { c.startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); }
    }

    @Override
    protected void handleOnDestroy() {
        stopPreviewPlayer();
        if (instance == this) instance = null;
    }
}
