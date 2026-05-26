export const uiManager = {
    updateMonitorCards(data) {
        document.getElementById('txt-temp').innerText = data.temp !== undefined ? data.temp : '--';
        document.getElementById('txt-humidity').innerText = data.humidity !== undefined ? data.humidity : '--';
        document.getElementById('txt-gas').innerText = data.gas !== undefined ? data.gas : '--';
        document.getElementById('txt-dust').innerText = data.dust !== undefined ? data.dust : '--';
        document.getElementById('txt-iaq').innerText = data.iaq !== undefined ? data.iaq : '--';
        
        const fanStatusText = document.getElementById('txt-fan-status');
        fanStatusText.innerText = data.fanActive ? "ĐANG BẬT" : "TẮT";
        fanStatusText.style.color = data.fanActive ? "var(--safe-color)" : "#64748b";
    },

    updateLevelBadge(level) {
        const badge = document.getElementById('badge-level');
        badge.innerText = level ? level : 'SAFE';
        badge.className = "badge";
        
        if (level === "SAFE") badge.classList.add("bg-safe");
        else if (level === "WARN") badge.classList.add("bg-warn");
        else if (level === "DANGER") badge.classList.add("bg-danger");
    },

    updateModeUI(isManual) {
        const modeLabel = document.getElementById('txt-mode-label');
        const fanBtn = document.getElementById('btn-fan-trigger');
        
        if (isManual) {
            modeLabel.innerText = "Chế độ: THỦ CÔNG (MANUAL)";
            modeLabel.style.color = "var(--warn-color)";
            fanBtn.disabled = false;
        } else {
            modeLabel.innerText = "Chế độ: TỰ ĐỘNG (AUTO)";
            modeLabel.style.color = "var(--primary-blue)";
            fanBtn.disabled = true;
            fanBtn.className = "btn-fan btn-off";
            fanBtn.innerText = "BẬT QUẠT HỆ THỐNG";
        }
    },

    updateManualFanButton(isFanOn) {
        const fanBtn = document.getElementById('btn-fan-trigger');
        if (isFanOn) {
            fanBtn.className = "btn-fan btn-on";
            fanBtn.innerText = "QUẠT ĐANG BẬT - BẤM ĐỂ TẮT";
        } else {
            fanBtn.className = "btn-fan btn-off";
            fanBtn.innerText = "QUẠT ĐANG TẮT - BẤM ĐỂ BẬT";
        }
    }
};