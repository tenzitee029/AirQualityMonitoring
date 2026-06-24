import { firebaseService } from './services/firebaseService.js';
import { uiManager } from './components/uiManager.js';
import { ChartManager } from './components/chartManager.js';

let systemMode = "AUTO";
let fanActive = false;
let isDeviceConnected = false;
let lastAlertSignature =
    localStorage.getItem("lastAlertSignature") || null;

let currentAlertSignature = null;
let latestSensorData = null;   
let lastDeviceUpdateToken = null;
let lastDeviceActivityAt = null;

const DEVICE_OFFLINE_AFTER_MS = 8000;
const historyLog =
    JSON.parse(localStorage.getItem("historyLog")) || [];
const measurementLog =
    JSON.parse(localStorage.getItem("measurementLog")) || [];
let dailyStatistics =
    JSON.parse(localStorage.getItem("dailyStatistics")) ||
    createEmptyDailyStatistics();
let unreadAlertCount = 0;
const chartManager = new ChartManager('airQualityChart');

// --- 1. LOGIC QUÉT DỮ LIỆU THỜI GIAN THỰC ---
async function tick() {
    try {
        const data = await firebaseService.getSystemData();

        if (!data) {
            updateDeviceStatus(false);
            return;
        }
        latestSensorData = data;

        checkDeviceConnection(data);

        uiManager.updateMonitorCards(data);
        uiManager.updateLevelBadge(data.level);

        fanActive = data.fanActive;


        chartManager.pushRealtimeData(data);
        logMeasurement(data);
        updateDailyStatistics(data);
        checkAndLogAlarm(data.level, data); 

    } catch (err) {
        console.error("Lỗi chu kỳ quét:", err);

        isDeviceConnected = false;
        updateDeviceStatus(false);
    }
}

// Chạy vòng lặp 2 giây
setInterval(tick, 2000);
tick();
renderHistory();
renderMeasurementHistory();
renderDailyStatistics();

// --- 2. XỬ LÝ CHUYỂN TAB (SPA) ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        
        e.currentTarget.classList.add('active');
        const targetId = e.currentTarget.getAttribute('data-target');
            if (targetId === "view-history") {

                unreadAlertCount = 0;

                const badge =
                    document.getElementById("alert-badge");

                if (badge) {
                    badge.innerText = "0";
                    badge.style.display = "none";
                }
            }
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
    const select = document.getElementById('font-size-select');

    if (!select) return;

    const size = select.value;

    document.documentElement.classList.remove(
        'font-sm',
        'font-md',
        'font-lg'
    );

    document.documentElement.classList.add(size);

    localStorage.setItem("fontSize", size);
};
const savedFontSize =
    localStorage.getItem("fontSize") || "font-md";

const fontSizeSelect =
    document.getElementById("font-size-select");

if (fontSizeSelect) {
    fontSizeSelect.value = savedFontSize;
    window.changeFontSize();
}

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
window.showHistoryTab = function(type) {
    const showMeasurements = type === "measurements";

    document.getElementById("history-measurements-panel").hidden =
        !showMeasurements;

    document.getElementById("history-alerts-panel").hidden =
        showMeasurements;

    document.getElementById("tab-measurements").classList.toggle(
        "active",
        showMeasurements
    );

    document.getElementById("tab-alerts").classList.toggle(
        "active",
        !showMeasurements
    );
};

// --- 4. CÁC HÀM TIỆN ÍCH KHÁC ---
function checkDeviceConnection(data) {
    const updateToken =
        data.lastUpdate !== undefined
            ? String(data.lastUpdate)
            : createSensorSignature(data);

    // Lần đọc đầu chỉ dùng để làm mốc
    if (lastDeviceUpdateToken === null) {
        lastDeviceUpdateToken = updateToken;
        return;
    }

    // Chỉ kết nối khi ESP32 thực sự gửi dữ liệu mới
    if (updateToken !== lastDeviceUpdateToken) {
        lastDeviceUpdateToken = updateToken;
        lastDeviceActivityAt = Date.now();

        if (!isDeviceConnected) {
            isDeviceConnected = true;
            updateDeviceStatus(true, "ESP32_Node1");
        }

        return;
    }

    // Không có cập nhật trong 8 giây thì xem là mất kết nối
    if (
        lastDeviceActivityAt === null ||
        Date.now() - lastDeviceActivityAt > DEVICE_OFFLINE_AFTER_MS
    ) {
        if (isDeviceConnected || lastDeviceActivityAt === null) {
            isDeviceConnected = false;
            updateDeviceStatus(false);
        }
    }
}

function createSensorSignature(data) {
    return JSON.stringify({
        temp: data.temp,
        humidity: data.humidity,
        gas: data.gas,
        dust: data.dust,
        iaq: data.iaq,
        level: data.level
    });
}
function getTodayKey() {
    const now = new Date();

    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
}

function createEmptyDailyStatistics() {
    return {
        date: getTodayKey(),
        count: 0,

        sum: {
            temp: 0,
            humidity: 0,
            gas: 0,
            dust: 0,
            iaq: 0
        },

        min: {
            temp: null,
            humidity: null,
            gas: null,
            dust: null,
            iaq: null
        },

        max: {
            temp: null,
            humidity: null,
            gas: null,
            dust: null,
            iaq: null
        },

        levels: {
            SAFE: 0,
            WARN: 0,
            DANGER: 0
        }
    };
}

function updateDailyStatistics(data) {
    // Sang ngày mới thì đặt lại thống kê
    if (dailyStatistics.date !== getTodayKey()) {
        dailyStatistics = createEmptyDailyStatistics();
    }

    const values = {
        temp: Number(data.temp),
        humidity: Number(data.humidity),
        gas: Number(data.gas),
        dust: Number(data.dust),
        iaq: Number(data.iaq)
    };

    // Không thống kê nếu dữ liệu cảm biến không hợp lệ
    if (Object.values(values).some(value => !Number.isFinite(value))) {
        return;
    }

    dailyStatistics.count++;

    Object.entries(values).forEach(([key, value]) => {
        dailyStatistics.sum[key] += value;

        if (
            dailyStatistics.min[key] === null ||
            value < dailyStatistics.min[key]
        ) {
            dailyStatistics.min[key] = value;
        }

        if (
            dailyStatistics.max[key] === null ||
            value > dailyStatistics.max[key]
        ) {
            dailyStatistics.max[key] = value;
        }
    });

    if (dailyStatistics.levels[data.level] !== undefined) {
        dailyStatistics.levels[data.level]++;
    }

    localStorage.setItem(
        "dailyStatistics",
        JSON.stringify(dailyStatistics)
    );

    renderDailyStatistics();
}

function renderDailyStatistics() {
    if (dailyStatistics.date !== getTodayKey()) {
        dailyStatistics = createEmptyDailyStatistics();

        localStorage.setItem(
            "dailyStatistics",
            JSON.stringify(dailyStatistics)
        );
    }

    const count = dailyStatistics.count;

    const showMetric = (key, unit, digits = 1) => {
        const valueElement =
            document.getElementById(`stat-${key}`);

        const rangeElement =
            document.getElementById(`stat-${key}-range`);

        if (!valueElement || !rangeElement) return;

        if (count === 0) {
            valueElement.textContent = `-- ${unit}`;
            rangeElement.textContent = "Min -- | Max --";
            return;
        }

        const average = dailyStatistics.sum[key] / count;

        valueElement.textContent =
            `${average.toFixed(digits)} ${unit}`.trim();

        rangeElement.textContent =
            `Min ${dailyStatistics.min[key]} ${unit} | ` +
            `Max ${dailyStatistics.max[key]} ${unit}`;
    };

    showMetric("temp", "°C");
    showMetric("humidity", "%");
    showMetric("gas", "ppm");
    showMetric("dust", "µg/m³");
    showMetric("iaq", "");

    const countElement = document.getElementById("stat-count");
    const levelsElement = document.getElementById("stat-levels");
    const periodElement = document.getElementById("statistics-period");

    if (countElement) {
        countElement.textContent = count;
    }

    if (levelsElement) {
        levelsElement.textContent =
            `SAFE ${dailyStatistics.levels.SAFE} | ` +
            `WARN ${dailyStatistics.levels.WARN} | ` +
            `DANGER ${dailyStatistics.levels.DANGER}`;
    }

    if (periodElement) {
        periodElement.textContent =
            `Từ 00:00 đến ${new Date().toLocaleTimeString("vi-VN")}`;
    }
}
function logMeasurement(data) {
    measurementLog.unshift({
        time: new Date().toLocaleString("vi-VN"),
        level: data.level,
        data: {
            temp: data.temp,
            humidity: data.humidity,
            gas: data.gas,
            dust: data.dust,
            iaq: data.iaq,
            level: data.level
        }
    });

    // Lưu tối đa 500 lần đo
    if (measurementLog.length > 500) {
        measurementLog.pop();
    }

    localStorage.setItem(
        "measurementLog",
        JSON.stringify(measurementLog)
    );

    renderMeasurementHistory();
}

function renderMeasurementHistory() {
    const list = document.getElementById("measurement-history-list");

    if (measurementLog.length === 0) {
        list.innerHTML = "<li>Chưa có dữ liệu đo.</li>";
        return;
    }

    list.innerHTML = measurementLog.map(log => `
        <li style="border-left-color: var(--primary-blue);">
            <strong>[${log.time}]</strong>
            <span>
                Nhiệt độ ${log.data.temp}°C |
                Độ ẩm ${log.data.humidity}% |
                Bụi ${log.data.dust}µg/m³ |
                Gas ${log.data.gas}ppm |
                IAQ ${log.data.iaq} |
                <b>${log.level}</b>
            </span>
        </li>
    `).join("");
}
function checkAndLogAlarm(level, data) {
    const isWarning =
        level === "WARN" || level === "DANGER";

    if (!isWarning) {
        currentAlertSignature = null;
        lastAlertSignature = null;

        localStorage.removeItem("lastAlertSignature");
        return;
    }

    const currentSignature = createSensorSignature(data);
    currentAlertSignature = currentSignature;

    // Cùng bộ số liệu cảnh báo thì không hiện popup/lưu thêm
    if (currentSignature === lastAlertSignature) {
        return;
    }

    lastAlertSignature = currentSignature;
    localStorage.setItem("lastAlertSignature", currentSignature);

    const snapshot = {
        signature: currentSignature,
        time: new Date().toLocaleString("vi-VN"),
        level,
        resolved: false,
        data: {
            temp: data.temp,
            humidity: data.humidity,
            gas: data.gas,
            dust: data.dust,
            iaq: data.iaq
        }
    };

    historyLog.unshift(snapshot);

    if (historyLog.length > 50) {
        historyLog.pop();
    }

    localStorage.setItem("historyLog", JSON.stringify(historyLog));

    showToast(`
        <b>${level}</b><br>
        Nhiệt độ: ${data.temp}°C<br>
        Độ ẩm: ${data.humidity}%<br>
        Gas: ${data.gas}ppm<br>
        Bụi: ${data.dust}µg/m³
    `);

    updateAlertBadge();
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById("history-list");

    if (historyLog.length === 0) {
        list.innerHTML = "<li>Chưa có cảnh báo.</li>";
        return;
    }

    list.innerHTML = historyLog.map((log, index) => `
        <li class="${log.level === "WARN" ? "history-warn" : ""}">
            <strong>[${log.time}]</strong>

            <span>
                Cảnh báo <b>${log.level}</b>:
                Nhiệt độ ${log.data.temp}°C |
                Độ ẩm ${log.data.humidity ?? "--"}% |
                Bụi ${log.data.dust}µg/m³ |
                Gas ${log.data.gas}ppm
            </span>

            ${
                log.resolved
                    ? `<span class="alert-resolved">✓ Đã xác nhận</span>`
                    : `<button class="btn-resolve"
                               onclick="resolveAlert(${index})"
                               title="Xác nhận đã xử lý">✓</button>`
            }
        </li>
    `).join("");
}
window.resolveAlert = function(index) {
    const alertLog = historyLog[index];

    if (!alertLog) return;

    alertLog.resolved = true;

    localStorage.setItem(
        "historyLog",
        JSON.stringify(historyLog)
    );

    const alertSignature =
        alertLog.signature || createSensorSignature({
            temp: alertLog.data.temp,
            humidity: alertLog.data.humidity,
            gas: alertLog.data.gas,
            dust: alertLog.data.dust,
            iaq: alertLog.data.iaq,
            level: alertLog.level
        });

    const liveSignature =
        latestSensorData
            ? createSensorSignature(latestSensorData)
            : currentAlertSignature;

    // Chỉ mở khóa popup nếu dòng bấm ✓ trùng với cảnh báo hiện tại
    if (alertSignature === liveSignature) {
        lastAlertSignature = null;
        localStorage.removeItem("lastAlertSignature");

        const popup = document.querySelector(".alert-toast");

        if (popup) {
            popup.remove();
        }
    }

    renderHistory();
};

function updateDeviceStatus(isConnected, deviceName = "") {
    const statusDiv = document.getElementById('device-status');
    if (isConnected) {
        statusDiv.innerHTML = `<span style="color: var(--safe-color)">🟢 Đã kết nối: ${deviceName}</span>`;
    } else {
        statusDiv.innerHTML = `<span style="color: var(--danger-color)">🔴 Mất kết nối (Offline)</span>`;
    }
}
function showToast(message) {
    // Không cho nhiều popup xuất hiện cùng lúc
    const oldToast = document.querySelector(".alert-toast");

    if (oldToast) {
        oldToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = "alert-toast";

    toast.innerHTML = `
        <button class="toast-close" aria-label="Đóng">&times;</button>
        <strong>⚠ CẢNH BÁO MỚI</strong>
        <div class="toast-message">${message}</div>
    `;

    document.body.appendChild(toast);

    toast.querySelector(".toast-close").addEventListener("click", () => {
        toast.remove();
    });
}

function updateAlertBadge() {

    unreadAlertCount++;

    const badge =
        document.getElementById("alert-badge");

    if (!badge) return;

    badge.innerText = unreadAlertCount;

    badge.style.display =
        unreadAlertCount > 0
        ? "inline-block"
        : "none";
}
