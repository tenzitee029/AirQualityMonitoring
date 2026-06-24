import { firebaseURL } from '../config/firebaseConfig.js';

export const firebaseService = {
    // Lấy dữ liệu thời gian thực
    async getSystemData() {
        const separator = firebaseURL.includes("?") ? "&" : "?";
        const url = `${firebaseURL}${separator}t=${Date.now()}`;

        const response = await fetch(url, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Không thể fetch dữ liệu Firebase");
        }

        return await response.json();
    },

    // Gửi lệnh PATCH để cấu hình hoặc ép trạng thái thủ công
    async sendControlPayload(payload) {
        try {
            await fetch(firebaseURL, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.error("Lỗi đồng bộ lệnh lên Cloud:", err);
        }
    }
};