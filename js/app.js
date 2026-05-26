import { firebaseService } from './services/firebaseService.js';
import { uiManager } from './components/uiManager.js';
import { ChartManager } from './components/chartManager.js';

let systemMode = "AUTO";
let fanActive = false;
const chartManager = new ChartManager('airQualityChart');

async function tick() {
    try {
        const data = await firebaseService.getSystemData();
        if (!data) return;

        uiManager.updateMonitorCards(data);
        uiManager.updateLevelBadge(data.level);
        fanActive = data.fanActive;
        
        chartManager.pushRealtimeData(data);
    } catch (err) {
        console.error("Lỗi chu kỳ quét:", err);
    }
}

// Gắn các sự kiện điều khiển vào window để HTML gọi được (Do dùng ES Module)
window.switchMode = function() {
    const isChecked = document.getElementById('toggle-mode').checked;
    systemMode = isChecked ? "MANUAL" : "AUTO";
    uiManager.updateModeUI(isChecked);

    if (systemMode === "AUTO") {
        firebaseService.sendControlPayload({ mode: "AUTO" });
    }
};

window.toggleManualFan = function() {
    if (systemMode !== "MANUAL") return;
    fanActive = !fanActive;
    uiManager.updateManualFanButton(fanActive);
    firebaseService.sendControlPayload({ mode: "MANUAL", fanActive: fanActive });
};

// Khởi chạy vòng quét 2 giây
setInterval(tick, 2000);
tick();