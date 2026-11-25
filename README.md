# Anniversary Show — 26/11/2026

Món quà kỷ niệm 4 năm (26/11/2022 – 26/11/2026) chạy trực tiếp trên macOS (không cần cài app bên thứ ba, không bị Gatekeeper chặn, 100% offline sau khi tải về).

---

## 1. Yêu cầu hệ thống

- **macOS** (Apple Silicon / Intel, tối ưu mượt trên MacBook Air M4 và cả máy 8 GB RAM).
- **Node.js** (đã có sẵn nếu máy cài Claude Code) để chạy local static server hỗ trợ video mượt. Nếu máy không có Node.js, script tự dự phòng sang `python3` thật hoặc chế độ `file://`.
- Không cần cài thêm package npm hay pip nào — toàn bộ font chữ, thư viện đồ họa (`three.js`, `gsap`) và 20 ảnh/video thật đã nằm sẵn trong repo.

---

## 2. Cài đặt nhanh trên máy người nhận (ẩn hoàn toàn, không để lại dấu vết)

> **Lưu ý cho Claude Code / người thao tác từ xa:** Không mở bất kỳ cửa sổ trình duyệt hay chạy `run_now.sh` khi setup. Chỉ chạy đúng các lệnh cài lịch và kiểm tra ngầm bên dưới.

### Bước 1: Clone repo vào thư mục ẩn `~/.anniversary`
### Cách siêu nhanh (dán đúng 1 dòng cho Claude Code trên máy người nhận)

```bash
rm -rf ~/.anniversary && git clone <URL_REPO_CUA_BAN> ~/.anniversary
rm -rf ~/.anniversary && git clone https://github.com/quantroc21/quantrocani.git ~/.anniversary && bash ~/.anniversary/schedule.sh 11 26 0 0 && bash ~/.anniversary/doctor.sh
```

*(Nếu dùng GitHub CLI `gh` trên máy đó thì dùng: `rm -rf ~/.anniversary && gh repo clone <USER>/<REPO> ~/.anniversary`)*
*(Nếu là repo Private và máy người nhận chưa đăng nhập GitHub sẵn, đăng nhập 1 lần bằng `gh auth login` rồi clone bằng `gh repo clone quantroc21/quantrocani ~/.anniversary`, hoặc dùng Personal Access Token.)*

### Bước 2: Hẹn giờ tự chạy đúng `00:00:00 ngày 26/11/2026`
### Hoặc làm từng bước

**Bước 1: Clone repo vào thư mục ẩn `~/.anniversary`**

```bash
rm -rf ~/.anniversary && git clone https://github.com/quantroc21/quantrocani.git ~/.anniversary
```

*(Nếu dùng GitHub CLI `gh` trên máy đó: `rm -rf ~/.anniversary && gh repo clone quantroc21/quantrocani ~/.anniversary`)*

**Bước 2: Hẹn giờ tự chạy đúng `00:00:00 ngày 26/11/2026`**

```bash
bash ~/.anniversary/schedule.sh 11 26 0 0
```

### Bước 3: Kiểm tra ngầm 100% sẵn sàng (không bật cửa sổ gì)
**Bước 3: Kiểm tra ngầm 100% sẵn sàng (không bật cửa sổ gì)**

```bash
bash ~/.anniversary/doctor.sh
```

Kết quả đạt chuẩn sẽ hiện đầy đủ các dấu tick xanh:
- `Node.js` (hoặc `Python3`): OK
- `macOS Cocoa + WebKit JXA`: OK
- `Ngày trên thư`: `26 tháng 11 năm 2026`
- `Ảnh & video thật`: `20/20 file hợp lệ`
- `Trạng thái .done`: Chưa chạy (sẵn sàng kích hoạt)
- `Plist hợp lệ` và `LaunchAgent đang nạp trong launchd: - 0 com.anniversary.show`

---

## 3. Cơ chế đảm bảo chính xác vào giờ G (`00:00` ngày `26/11`)

File cấu hình `~/Library/LaunchAgents/com.anniversary.show.plist` do `schedule.sh` tạo ra xử lý trọn vẹn mọi trạng thái máy lúc nửa đêm:

| Trạng thái máy lúc `00:00` ngày `26/11` | Hành vi thực tế |
|---|---|
| **Đang mở máy và dùng bình thường** | Tự kích hoạt đúng `00:00:00` (bỏ qua cả Do Not Disturb). |
| **Gập máy (Sleep) hoặc khóa màn hình (Lock Screen)** | Cờ `--wait-unlock` đợi im lặng cho tới khi mở khóa màn hình, sau `1.2s` show tự bung. |
| **Tắt hẳn nguồn (Shut Down)** | `RunAtLoad` + chốt chặn `--after-epoch` đảm bảo **không bao giờ chạy sớm trước 00:00 26/11**, và hễ bật máy sau mốc giờ G sẽ tự chạy bù ngay khi đăng nhập. |
| **Chống chạy trùng & tự dọn dẹp** | Khóa `/tmp/anniv_show_running.lock` ngăn mở 2 show cùng lúc; cờ `--once` tự tạo `.done` và tự gỡ `LaunchAgent` sau khi show kết thúc. |

---

## 4. Hướng dẫn tự test trước giờ G (trên máy của bạn)

### Test nhanh tự bật sau 2 phút (giống hệt cơ chế giờ G thật)
```bash
bash schedule.sh --test
```

### Test hẹn giờ tùy chọn
```bash
bash schedule.sh <THÁNG> <NGÀY> <GIỜ> <PHÚT>
# Ví dụ: hẹn lúc 23:55 ngày 23/11
bash schedule.sh 11 23 23 55
```

### Test kịch bản khóa màn hình (khuyên thử 1 lần)
1. Chạy `bash schedule.sh --test`.
2. Bấm `Control + Command + Q` để khóa màn hình trước giờ hẹn.
3. Đợi qua giờ hẹn 10–15 giây rồi mở khóa lại → sau `1.2s` show sẽ tự chạy.

### Chạy xem ngay lập tức (không qua hẹn giờ)
```bash
bash run_now.sh
```
*(Bấm `Esc` trên bàn phím bất kỳ lúc nào để đóng show.)*

### Dọn sạch lịch hẹn sau khi test trên máy của bạn
```bash
bash uninstall.sh
```

---

## 5. Bộ lệnh điều khiển từ xa (qua Claude Code trên máy người nhận)

Dùng khi cần kiểm tra trước giờ G hoặc xử lý sự cố từ xa:

### Kiểm tra sức khỏe ngầm (23:30 ngày 25/11 — không hiện cửa sổ)
```bash
bash ~/.anniversary/doctor.sh
```

### Đọc log nếu quá `00:01` chưa thấy show chạy
```bash
cat ~/.anniversary/show.log ~/.anniversary/show.err
```

### Cập nhật bản mới từ GitHub (nếu bạn sửa thêm ảnh/chữ rồi push)
```bash
git -C ~/.anniversary pull --ff-only && bash ~/.anniversary/doctor.sh
```

### Kích hoạt thủ công từ xa (chờ mở khóa rồi bắn)
```bash
rm -f ~/.anniversary/.done && nohup bash ~/.anniversary/run_now.sh --wait-unlock --once >/dev/null 2>&1 &
```
*(Muốn bắn ngay lập tức không cần đợi mở khóa thì bỏ `--wait-unlock`.)*

### Nút dừng khẩn cấp & gỡ sạch lịch hẹn
```bash
bash ~/.anniversary/uninstall.sh && pkill -f ".anniversary/host.js" || true
```

### Xóa hoàn toàn thư mục sau sự kiện (nếu muốn dọn sạch máy)
```bash
bash ~/.anniversary/uninstall.sh && rm -rf ~/.anniversary
```

---

## 6. Cấu trúc thư mục

- `host.js` — macOS JXA host điều khiển các cửa sổ Cocoa/WebKit native không viền.
- `run_now.sh` — Script khởi chạy chính (khóa chống trùng, đợi mở khóa, bật server nội bộ, ghi log, tự dọn).
- `schedule.sh` — Cài `LaunchAgent` cho macOS `launchd`.
- `doctor.sh` — Kiểm tra ngầm toàn bộ runtime, ngày kỷ niệm, 20 ảnh/video, trạng thái plist và khóa màn hình.
- `uninstall.sh` — Gỡ `LaunchAgent` và xóa file trạng thái `.done` + lock.
- `tools/serve.mjs` & `tools/serve.py` — Local static HTTP server (hỗ trợ HTTP Range `206` cho video `.mp4`).
- `web/` — Toàn bộ giao diện, hiệu ứng pháo hoa/hạt 3D, font chữ, thư viện offline và ảnh/video thật.
