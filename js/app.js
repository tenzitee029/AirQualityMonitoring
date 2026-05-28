import { firebaseService } from './services/firebaseService.js';
import { uiManager } from './components/uiManager.js';
import { ChartManager } from './components/chartManager.js';

let systemMode = "AUTO";
let fanActive = false;
let isDeviceConnected = false;
const historyLog = [];
const chartManager = new ChartManager('airQualityChart');

// --- 1. LOGIC QUÉT DỮ LIỆU THỜI GIAN THỰC ---
async function tick() {
    try {
        const data = await firebaseService.getSystemData();
        if (!data) return;

        // Mô phỏng thiết bị đã kết nối thành công khi lấy được data
        if (!isDeviceConnected) {
            isDeviceConnected = true;
            updateDeviceStatus(true, "ESP32_Node1");
        }

        uiManager.updateMonitorCards(data);
        uiManager.updateLevelBadge(data.level);
        fanActive = data.fanActive;
        
        chartManager.pushRealtimeData(data);
        checkAndLogAlarm(data.level, data);
        
    } catch (err) {
        console.error("Lỗi chu kỳ quét:", err);
        if (isDeviceConnected) {
            isDeviceConnected = false;
            updateDeviceStatus(false);
        }
    }
}

// Chạy vòng lặp 2 giây
setInterval(tick, 2000);
tick();

// --- 2. XỬ LÝ CHUYỂN TAB (SPA) ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        
        e.currentTarget.classList.add('active');
        const targetId = e.currentTarget.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
});

// --- 3. EXPORT CÁC HÀM GẮN CHO HTML ---
window.switchMode = function() {
    const isChecked = document.getElementById('toggle-mode').checked;
    
    if (isChecked) {
        systemMode = "FORCE_ON";
        uiManager.updateModeUI("FORCE_ON");
        firebaseService.sendControlPayload({ mode: "FORCE_ON", fanActive: true });
    } else {
        systemMode = "AUTO";
        uiManager.updateModeUI("AUTO");
        firebaseService.sendControlPayload({ mode: "AUTO" });
    }
};

window.toggleTheme = function() {
    const isLight = document.getElementById('toggle-theme').checked;
    if (isLight) {
        document.body.classList.replace('theme-dark', 'theme-light');
    } else {
        document.body.classList.replace('theme-light', 'theme-dark');
    }
};

window.changeFontSize = function() {
    const size = document.getElementById('font-size-select').value;
    document.body.classList.remove('font-sm', 'font-md', 'font-lg');
    document.body.classList.add(size);
};

window.toggleChartData = function(datasetIndex) {
    const chart = chartManager.getChartInstance();
    if (chart) {
        const isHidden = chart.getDatasetMeta(datasetIndex).hidden;
        chart.getDatasetMeta(datasetIndex).hidden = !isHidden;
        chart.update();
    }
};

window.searchHistory = function() {
    alert("Đang tìm kiếm lịch sử theo ngày giờ... (Cần API hỗ trợ lọc từ Firebase)");
};

// --- 4. CÁC HÀM TIỆN ÍCH KHÁC ---
function checkAndLogAlarm(level, data) {
    // Tránh ghi log trùng lặp liên tục trong cùng 1 phút (Logic cơ bản)
    if (level === "WARN" || level === "DANGER") {
        const time = new Date().toLocaleString('vi-VN');
        // Chỉ thêm nếu log cuối cùng khác phút hiện tại hoặc rỗng
        const lastLog = historyLog[0];
        if (!lastLog || lastLog.time !== time) {
            historyLog.unshift({ time, level, temp: data.temp, dust: data.dust, gas: data.gas });
            if (historyLog.length > 50) historyLog.pop(); // Giới hạn mảng
            renderHistory();
        }
    }
}

function renderHistory() {
    const list = document.getElementById('history-list');
    if (historyLog.length === 0) return;
    
    list.innerHTML = historyLog.map(log => `
        <li class="${log.level === 'WARN' ? 'history-warn' : ''}">
            <strong style="color: var(--text-color);">[${log.time}]</strong> 
            <span>Cảnh báo <b>${log.level}</b>:</span> 
            <span style="color: #64748b;">Nhiệt độ ${log.temp}°C | Bụi ${log.dust}µg/m³ | Gas ${log.gas}ppm</span>
        </li>
    `).join('');
}

function updateDeviceStatus(isConnected, deviceName = "") {
    const statusDiv = document.getElementById('device-status');
    if (isConnected) {
        statusDiv.innerHTML = `<span style="color: var(--safe-color)">🟢 Đã kết nối: ${deviceName}</span>`;
    } else {
        statusDiv.innerHTML = `<span style="color: var(--danger-color)">🔴 Mất kết nối (Offline)</span>`;
    }
}
