package app.reveilly;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Copie native des alarmes (envoyées par le JS) pour pouvoir se reprogrammer seul. */
final class AlarmStore {
    private static final String PREFS = "reveilly_native";
    private static final String K_ALARMS = "alarms", K_SETTINGS = "settings", K_FIRED = "fired_once",
            K_TEST = "test_alarm", K_SCHEDULED = "scheduled_ids";

    private AlarmStore() {}

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static JSONArray alarms(Context c) { return array(prefs(c).getString(K_ALARMS, "[]")); }
    static void setAlarms(Context c, JSONArray a) { prefs(c).edit().putString(K_ALARMS, a.toString()).apply(); }

    static JSONObject settings(Context c) { return object(prefs(c).getString(K_SETTINGS, "{}")); }
    static void setSettings(Context c, JSONObject s) { prefs(c).edit().putString(K_SETTINGS, s.toString()).apply(); }

    static JSONObject test(Context c) { return object(prefs(c).getString(K_TEST, "{}")); }
    static void setTest(Context c, JSONObject a) { prefs(c).edit().putString(K_TEST, a.toString()).apply(); }

    static JSONArray scheduledIds(Context c) { return array(prefs(c).getString(K_SCHEDULED, "[]")); }
    static void setScheduledIds(Context c, JSONArray a) { prefs(c).edit().putString(K_SCHEDULED, a.toString()).apply(); }

    /** Alarme par identifiant (« test » = alarme de test), ou null. */
    static JSONObject find(Context c, String id) {
        if ("test".equals(id)) return test(c);
        JSONArray all = alarms(c);
        for (int i = 0; i < all.length(); i++) {
            JSONObject a = all.optJSONObject(i);
            if (a != null && id.equals(a.optString("id"))) return a;
        }
        return null;
    }

    /** Une alarme unique a sonné : on la désactive ici et on le signale au JS. */
    static synchronized void markFiredOnce(Context c, String id) {
        JSONArray all = alarms(c);
        for (int i = 0; i < all.length(); i++) {
            JSONObject a = all.optJSONObject(i);
            if (a != null && id.equals(a.optString("id"))) {
                try { a.put("enabled", false); } catch (JSONException ignored) {}
            }
        }
        setAlarms(c, all);
        JSONArray fired = array(prefs(c).getString(K_FIRED, "[]"));
        fired.put(id);
        prefs(c).edit().putString(K_FIRED, fired.toString()).apply();
    }

    static synchronized JSONArray consumeFired(Context c) {
        JSONArray fired = array(prefs(c).getString(K_FIRED, "[]"));
        prefs(c).edit().putString(K_FIRED, "[]").apply();
        return fired;
    }

    static synchronized void forgetFired(Context c, String id) {
        JSONArray fired = array(prefs(c).getString(K_FIRED, "[]")), keep = new JSONArray();
        for (int i = 0; i < fired.length(); i++) if (!id.equals(fired.optString(i))) keep.put(fired.optString(i));
        prefs(c).edit().putString(K_FIRED, keep.toString()).apply();
    }

    private static JSONArray array(String s) {
        try { return new JSONArray(s); } catch (JSONException e) { return new JSONArray(); }
    }

    private static JSONObject object(String s) {
        try { return new JSONObject(s); } catch (JSONException e) { return new JSONObject(); }
    }
}
