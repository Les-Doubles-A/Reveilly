package app.reveilly;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ReveillyAlarmPlugin.class);
        super.onCreate(savedInstanceState);
        handleAlarmIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleAlarmIntent(intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Rien ne sonne : l'application ne doit plus être visible par-dessus l'écran verrouillé.
        if (AlarmService.ringingId == null) showOverLockScreen(false);
    }

    private void handleAlarmIntent(Intent intent) {
        String id = intent != null ? intent.getStringExtra(AlarmScheduler.EXTRA_ID) : null;
        if (id == null && AlarmService.ringingId == null) return;
        showOverLockScreen(true);
        if (AlarmService.ringingId != null) ReveillyAlarmPlugin.notifyRinging(AlarmService.ringingId);
    }

    /** Affiche le défi sur l'écran verrouillé et allume l'écran, sans déverrouiller. */
    void showOverLockScreen(boolean on) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(on);
            setTurnScreenOn(on);
        } else {
            int f = WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON;
            if (on) getWindow().addFlags(f); else getWindow().clearFlags(f);
        }
        if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
}
