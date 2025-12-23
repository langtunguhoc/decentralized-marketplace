# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

# 🛡️ Decentralized Secure Storage (Lit Protocol + IPFS)

Ứng dụng chia sẻ file bảo mật: Dùng **Lit Protocol** để mã hóa file, **IPFS** để lưu trữ, và **NFT** trên mạng **Polygon Amoy** để kiểm soát quyền truy cập.

---

## 🛠️ 1. Yêu cầu cài đặt (Prerequisites)

Trước khi chạy, máy cần có:
* [Node.js](https://nodejs.org/) (v18 trở lên).
* [Git](https://git-scm.com/).
* [MetaMask](https://metamask.io/) Extension trên trình duyệt.

---

## 📂 2. Cài đặt thư viện

Mở terminal tại thư mục dự án và chạy lần lượt các lệnh sau:

```bash
# 1. Cài đặt cho Blockchain (Root)
npm install

# 2. Cài đặt cho Backend (Server Proxy IPFS)
cd server
npm install

# 3. Cài đặt cho Frontend (Client React App)
cd ../client
npm install
```

---

## 🔑 3. Cấu hình biến môi trường (.env)

### **A. Tại thư mục gốc (`/`)**
Tạo file `.env` để cấu hình deploy lên mạng Amoy:

```env
POLYGON_RPC_URL="https://rpc-amoy.polygon.technology/"
PRIVATE_KEY="dan_private_key_vi_metamask_cua_ban_vao_day"
```

### **B. Tại thư mục Server (`/server/`)**
Tạo file `.env` để cấu hình IPFS (Pinata).
*(Lấy Key tại: [https://app.pinata.cloud/developers/api-keys](https://app.pinata.cloud/developers/api-keys))*

```env
PORT=3001
PINATA_JWT=dan_pinata_jwt_token_cua_ban_vao_day
PINATA_GATEWAY=gateway.pinata.cloud
```

---

## 🚀 4. Hướng dẫn chạy (Run App)

### **Bước 1: Deploy Smart Contract**
Chạy lệnh này từ thư mục gốc (Root):

```bash
npx hardhat run scripts/deploy.js --network amoy
```

> ⚠️ **QUAN TRỌNG:** Sau khi deploy thành công, bạn **BẮT BUỘC** phải copy file ABI và Address mới vào thư mục Frontend.
>
> **Lệnh Copy (Windows):**
> ```cmd
> copy artifacts\contracts\AccessPass.sol\AccessPass.json client\src\abi\
> copy artifacts\contracts\Marketplace.sol\Marketplace.json client\src\abi\
> copy contract-address.json client\src\abi\
> ```
>
> **Lệnh Copy (Mac/Linux):**
> ```bash
> cp artifacts/contracts/AccessPass.sol/AccessPass.json client/src/abi/
> cp artifacts/contracts/Marketplace.sol/Marketplace.json client/src/abi/
> cp contract-address.json client/src/abi/
> ```

### **Bước 2: Khởi chạy Backend**
Mở một terminal mới:

```bash
cd server
node index.js
```
> ✅ Server sẽ báo: `Server running on http://localhost:3001`

### **Bước 3: Khởi chạy Frontend**
Mở một terminal mới khác:

```bash
cd client
npm run dev
```
> 🌐 Truy cập tại: `http://localhost:5173`

---

## 🦊 5. Setup MetaMask (Polygon Amoy)

1.  **Thêm mạng Amoy:**
    * Mở MetaMask -> Add Network -> Manually.
    * **Network Name:** `Polygon Amoy Testnet`
    * **RPC URL:** `https://rpc-amoy.polygon.technology`
    * **Chain ID:** `80002`
    * **Currency Symbol:** `POL`
    * **Block Explorer:** `https://amoy.polygonscan.com`

2.  **Lấy tiền Test (Faucet):**
    * Vào [Polygon Faucet](https://faucet.polygon.technology/) hoặc [Chainlink Faucet](https://faucets.chain.link/polygon-amoy).
    * Dán địa chỉ ví để nhận **POL** miễn phí.

---

## ✅ 6. Kịch bản Test (Walkthrough)

1.  **Người bán (Seller):**
    * Kết nối ví (Mạng Amoy).
    * Tab **Upload**: Chọn ảnh Preview, File Bí mật, Điền giá -> Bấm **List Product**.
    * MetaMask: Ký (Sign) để mã hóa -> Confirm để trả phí gas.

2.  **Người mua (Buyer):**
    * Chuyển sang ví khác. Refresh trang (F5).
    * Bấm **Buy Now** -> Trả tiền mua.

3.  **Xem file (Decrypt):**
    * Nút đổi thành **🔓 Decrypt & View**.
    * Bấm vào -> Ký (Sign) xác nhận quyền sở hữu -> File hiện ra.

---

## 🧹 Mẹo: Xóa dữ liệu cũ

* **Cách 1 (Nhanh):** Sửa file `client/src/ProductList.jsx`.
    Tìm vòng lặp `for`, thêm dòng: `if (i < 10) continue;` (Thay số 10 bằng ID mới nhất).

* **Cách 2 (Sạch):** Deploy lại Contract (Bước 1) và copy lại file JSON địa chỉ.