export class ChartManager {
    constructor(canvasId) {
        this.ctx = document.getElementById(canvasId).getContext('2d');
        this.maxPoints = 12;
        this.chart = this.initChart();
    }

    initChart() {
        return new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    { label: 'Nhiệt độ (°C)', data: [], borderColor: '#ef4444', backgroundColor: 'transparent', tension: 0.2 },
                    { label: 'Độ ẩm (%)', data: [], borderColor: '#3b82f6', backgroundColor: 'transparent', tension: 0.2 },
                    { label: 'Khí Gas (ppm)', data: [], borderColor: '#eab308', backgroundColor: 'transparent', tension: 0.2 },
                    { label: 'Bụi mịn (µg/m³)', data: [], borderColor: '#a855f7', backgroundColor: 'transparent', tension: 0.2 },
                    { label: 'Chỉ số IAQ', data: [], borderColor: '#2ecc71', backgroundColor: 'transparent', tension: 0.2, borderWidth: 3 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Để biểu đồ fill vừa .chart-box
                plugins: { legend: { labels: { color: '#94a3b8' } } },
                scales: {
                    x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' }, min: 0 }
                }
            }
        });
    }

    pushRealtimeData(data) {
        const now = new Date();
        const timeLabel = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
        
        if (this.chart.data.labels.length >= this.maxPoints) {
            this.chart.data.labels.shift();
            this.chart.data.datasets.forEach(d => d.data.shift());
        }
        
        this.chart.data.labels.push(timeLabel);
        this.chart.data.datasets[0].data.push(data.temp);
        this.chart.data.datasets[1].data.push(data.humidity);
        this.chart.data.datasets[2].data.push(data.gas);
        this.chart.data.datasets[3].data.push(data.dust);
        this.chart.data.datasets[4].data.push(data.iaq);
        this.chart.update();
    }

    getChartInstance() {
        return this.chart;
    }
}
