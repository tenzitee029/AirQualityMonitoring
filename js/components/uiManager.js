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

    updateModeUI(mode) {
        const modeLabel = document.getElementById('txt-mode-label');
        const toggleMode = document.getElementById('toggle-mode');
        
        if (mode === "FORCE_ON") {
            modeLabel.innerText = "Chế độ hiện tại: LUÔN BẬT QUẠT (FORCED ON)";
            modeLabel.style.color = "var(--safe-color)";
            if (toggleMode) toggleMode.checked = true;
        } else {
            modeLabel.innerText = "Chế độ hiện tại: TỰ ĐỘNG (AUTO)";
            modeLabel.style.color = "var(--primary-blue)";
            if (toggleMode) toggleMode.checked = false;
        }
    }
};