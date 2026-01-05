Tất nhiên rồi. Dưới đây là file `README.md` đã được viết lại hoàn toàn bằng Tiếng Việt, cập nhật chính xác cấu trúc thư mục mới (đổi `client` thành `frontend`) và bổ sung lưu ý quan trọng về Gateway mà chúng ta vừa sửa.

Bạn có thể copy nội dung bên dưới và lưu đè lên file `README.md` hiện tại.

```markdown
# 🛡️ Decentralized Secure Storage (Lit Protocol + IPFS)

Dự án Ứng dụng Marketplace Phi tập trung: Sử dụng **Lit Protocol** để mã hóa dữ liệu, **IPFS** để lưu trữ phi tập trung, và **Smart Contract** trên mạng **Polygon Amoy** để quản lý quyền truy cập (Token Gated).

---

## 🛠️ 1. Yêu cầu cài đặt (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
* [Node.js](https://nodejs.org/) (Phiên bản v18 trở lên).
* [Git](https://git-scm.com/).
* [MetaMask](https://metamask.io/) Extension trên trình duyệt.

---

## 📂 2. Cài đặt thư viện

Mở terminal tại thư mục gốc của dự án và chạy lần lượt các lệnh sau:

```bash
# 1. Cài đặt cho Blockchain (Root)
npm install

# 2. Cài đặt cho Backend (Server Proxy IPFS)
cd server
npm install

# 3. Cài đặt cho Frontend (Giao diện người dùng)
# ⚠️ Lưu ý: Thư mục chứa code giao diện là 'frontend'
cd frontend
npm install

```

---

## 🔑 3. Cấu hình biến môi trường (.env)

Bạn cần tạo 2 file `.env` tại các vị trí sau:

### **A. Tại thư mục gốc (`/`)**

Tạo file `.env` để cấu hình deploy Smart Contract lên mạng Amoy:

```env
POLYGON_RPC_URL="[https://rpc-amoy.polygon.technology/](https://rpc-amoy.polygon.technology/)"
PRIVATE_KEY="dan_private_key_vi_metamask_cua_ban_vao_day"

```

### **B. Tại thư mục Server (`/server/`)**

Tạo file `.env` để cấu hình IPFS (Pinata).
*(Lấy Key tại: [Pinata Keys](https://app.pinata.cloud/developers/api-keys))*

```env
PORT=3001
PINATA_JWT=dan_pinata_jwt_token_cua_ban_vao_day

# ⚠️ QUAN TRỌNG VỀ GATEWAY:
# - Nếu bạn có tài khoản trả phí (Dedicated Gateway): Điền domain của bạn (ví dụ: my-gateway.<mypinata>.cloud)
# - Nếu dùng tài khoản miễn phí: Hãy ĐỂ TRỐNG dòng bên dưới (Code sẽ tự dùng ipfs.io để tránh lỗi chặn bot)
PINATA_GATEWAY=

```

---

## 🚀 4. Hướng dẫn chạy (Run App)

### **Bước 1: Deploy Smart Contract. Chỉ thực hiện nếu muốn sử dụng marketplace hoàn toàn mới (chưa có sản phẩm nào hết)**

Chạy lệnh này từ thư mục gốc (Root):

```bash
npx hardhat run scripts/deploy.js --network amoy

```

> ⚠️ **CỰC KỲ QUAN TRỌNG:**
> Sau khi deploy thành công, bạn **PHẢI COPY** file ABI và địa chỉ Contract mới vào thư mục `frontend`.
> **Lệnh Copy (Windows - Command Prompt):**
> ```cmd
> copy artifacts\contracts\AccessPass.sol\AccessPass.json frontend\src\abi\
> copy artifacts\contracts\Marketplace.sol\Marketplace.json frontend\src\abi\
> 
> ```
> 
> 
> **Lệnh Copy (Mac/Linux):**
> ```bash
> cp artifacts/contracts/AccessPass.sol/AccessPass.json frontend/src/abi/
> cp artifacts/contracts/Marketplace.sol/Marketplace.json frontend/src/abi/
> 
> ```
> **copy địa chỉ trong addresses.json và đưa vào tương ứng trong /frontend/src/config/contracts.ts**
> 

### **Bước 2: Khởi chạy Backend (Proxy Server)**

Mở một terminal mới:

```bash
cd server
node index.js

```

> ✅ Khi chạy thành công server sẽ báo: `✅ IPFS Proxy Server running on http://localhost:3001`

### **Bước 3: Khởi chạy Frontend**

Mở một terminal mới khác:

```bash
cd frontend
npm run dev

```

> 🌐 Truy cập ứng dụng tại: `http://localhost:5173`

---

## 🦊 5. Cấu hình MetaMask (Mạng Polygon Amoy)

Để tương tác với ứng dụng, bạn cần thêm mạng Testnet Amoy vào MetaMask:

1. **Thêm mạng thủ công:**
* Mở MetaMask -> Add Network -> Manually.
* **Network Name:** `Polygon Amoy Testnet`
* **RPC URL:** `https://rpc-amoy.polygon.technology` hoặc đăng ký và sử dụng URL của alchemy polygon để đảm bảo tốc độ `https://polygon-amoy.g.alchemy.com/v2/<api>`
* **Chain ID:** `80002`
* **Currency Symbol:** `POL`
* **Block Explorer:** `https://amoy.polygonscan.com`


2. **Lấy tiền Test (Faucet):**
* Vào [Polygon Faucet](https://faucet.polygon.technology/) hoặc [Chainlink Faucet](https://faucets.chain.link/polygon-amoy).
* Dán địa chỉ ví để nhận **POL** miễn phí làm phí gas.



---

## ✅ 6. Kịch bản Test (Walkthrough)

1. **Người bán (Seller):**
* Kết nối ví (Mạng Amoy).
* Vào **My Store** -> Tạo sản phẩm mới.
* Chọn ảnh Preview (công khai) và File Sản phẩm (sẽ được mã hóa).
* Bấm **List Product** -> Xác nhận trên MetaMask.


2. **Người mua (Buyer):**
* Chuyển sang ví khác trên MetaMask.
* Tại trang chủ **Marketplace**, bấm **Buy** sản phẩm vừa tạo.
* Xác nhận thanh toán phí.


3. **Xem nội dung (Decrypt):**
* Sau khi mua, vào mục **My Purchases** (hoặc My Library).
* Bấm **View Content**.
* Ký xác nhận (Sign) trên MetaMask để Lit Protocol giải mã file.
* Nội dung sẽ hiển thị ngay trên trình duyệt (hoặc tải về nếu không hỗ trợ xem trực tiếp).



---

## 🧹 Mẹo: Xóa dữ liệu cũ

Nếu bạn muốn reset lại toàn bộ sản phẩm để làm mới dữ liệu demo:

1. Xóa file `addresses.json` ở thư mục gốc.
2. Chạy lại lệnh deploy ở **Bước 1**.
3. Copy lại file JSON mới vào `frontend`.
4. Reload lại trang web.

```

```