package app.reveilly;

import static org.junit.Assert.assertEquals;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Même cas que tests/time.test.js : le natif et le JS doivent calculer la même date. */
public class AlarmSchedulerTest {
    private static long at(String s) throws Exception { return new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.ROOT).parse(s).getTime(); }
    private static String fmt(long t) { return new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.ROOT).format(new Date(t)); }

    private static JSONObject alarm(int h, int m, int... days) throws Exception {
        JSONObject o = new JSONObject().put("enabled", true).put("hour", h).put("minute", m);
        JSONArray d = new JSONArray();
        for (int x : days) d.put(x);
        return o.put("days", d);
    }

    @Test public void semaineVendrediSoirDonneLundi() throws Exception {
        assertEquals("2026-10-26 17:40", fmt(AlarmScheduler.nextTrigger(alarm(17, 40, 0, 1, 2, 3, 4), at("2026-10-23 18:00"))));
    }

    @Test public void alarmeUniqueLendemain() throws Exception {
        assertEquals("2026-10-24 06:45", fmt(AlarmScheduler.nextTrigger(alarm(6, 45), at("2026-10-23 07:00"))));
    }

    @Test public void strictementApres() throws Exception {
        assertEquals("2026-10-30 17:40", fmt(AlarmScheduler.nextTrigger(alarm(17, 40, 4), at("2026-10-23 17:40"))));
    }

    @Test public void desactiveeRienAProgrammer() throws Exception {
        assertEquals(-1, AlarmScheduler.nextTrigger(alarm(7, 0).put("enabled", false), at("2026-10-23 07:00")));
    }

    @Test public void volumeProgressif() {
        assertEquals(0.45f, AlarmService.rampVolume(0.8f, 15, 30), 1e-4);
        assertEquals(0.8f, AlarmService.rampVolume(0.8f, 40, 30), 1e-6);
    }
}
