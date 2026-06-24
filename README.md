# Air Quality Monitoring Dashboard - Web cho mô hình IoT 🌬️🖥️

Dự án phát triển hệ thống Web Dashboard theo dõi thời gian thực (realtime) các thông số môi trường từ mô hình IoT, được tối ưu hóa cho không gian hẹp như phòng khách, phòng bếp, văn phòng làm việc. Hệ thống giúp người dùng giám sát từ xa, nhận cảnh báo tức thời khi chỉ số vượt ngưỡng an toàn và dự đoán xu hướng chất lượng không khí.

---

## 📌 Tính năng nổi bật

* **Theo dõi từ xa (Realtime Monitoring):** Cập nhật liên tục mỗi 2 giây các thông số quan trọng bao gồm: Nhiệt độ (°C), Độ ẩm (%), Khí Gas (ppm), Bụi mịn (µg/m³), và Chỉ số chất lượng không khí tổng hợp (IAQ).
* **Cảnh báo vượt ngưỡng an toàn:** Tự động phân cấp độ độc hại dựa trên chỉ số IAQ (`SAFE` - Xanh, `WARN` - Vàng, `DANGER` - Đỏ). Hiển thị Badge trạng thái, bắn cảnh báo Toast Notification và tự động kích hoạt thiết bị ngoại vi (Quạt hút gió - `Fan Active`) khi có nguy cơ.
* **Hệ thống xem lại lịch sử (History & Snapshot Replay):** Ghi lại nhật ký các mốc thời gian xảy ra cảnh báo. Hỗ trợ tính năng "Replay" để xem lại snapshot trạng thái dữ liệu biểu đồ tại chính mốc thời gian đó.
* **Tùy biến giao diện:** Hỗ trợ chuyển đổi chế độ Sáng/Tối (Dark/Light Mode) và thay đổi kích thước chữ linh hoạt theo nhu cầu người dùng.

---

## 🏗️ Kiến trúc & Cloud Database Endpoint

Hệ thống được xây dựng theo mô hình Single Page Application (SPA) tinh gọn, kết nối trực tiếp Client-Cloud mà không cần thông qua một server trung gian phức tạp:

* **Frontend:** HTML5, CSS3 (Biến CSS tùy biến giao diện), thuần JavaScript (ES6 Modules - cấu trúc dạng cấu phần: `uiManager`, `chartManager`, `aiService`).
* **Thư viện đồ thị:** `Chart.js` (Vẽ biểu đồ đường đa trục realtime trực quan).
* **Cloud Database Endpoint:** Hệ thống đồng bộ dữ liệu thời gian thực thông qua **Firebase Realtime Database**. 
  * *Cơ sở dữ liệu chính thức của dự án:* `https://air-quality-cacd8-default-rtdb.firebaseio.com/AirQuality`
* **Wokwi mô phỏng:** `https://wokwi.com/projects/466606471206640641`
---