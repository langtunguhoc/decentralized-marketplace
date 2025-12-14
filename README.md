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

## 🛠️ 1. Yêu cầu cài đặt (Prerequisites)

Trước khi chạy, máy cần có:

  * [Node.js](https://nodejs.org/) (v18+).
  * [Git](https://git-scm.com/).
  * [MetaMask](https://metamask.io/) Extension trên trình duyệt.

-----

## 📂 2. Cài đặt thư viện

Mở terminal tại thư mục dự án và chạy lần lượt các lệnh sau để cài thư viện cho cả 3 phần (Root, Server, Client):

```bash
# 1. Cài đặt cho Blockchain (Root)
npm install

# 2. Cài đặt cho Backend (Server)
cd server
npm install

# 3. Cài đặt cho Frontend (Client)
cd ../client
npm install
```

-----

## 🔑 3. Cấu hình biến môi trường (.env)

Bạn cần tạo 2 file `.env` (một ở root folder và một ở server folder).

### **A. Tại thư mục gốc (`/`)**

Tạo file `.env` và dán nội dung sau (Key giả cho Localhost):

```env
# Key Account #0 (Seller)
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
# Key Account #1 (Buyer)
PRIVATE_KEY_BUYER="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
```

### **B. Tại thư mục Server (`/server/`)**

Tạo file `.env` và dán nội dung sau (**Cần tự lấy Key Pinata của bạn**):

```env
# Kết nối Blockchain Local
RPC_URL="http://127.0.0.1:8545/"
PORT=3001

# IPFS Keys (Lấy tại https://app.pinata.cloud/developers/api-keys)
PINATA_JWT=your_pinata_jwt_here
PINATA_GATEWAY=gateway.pinata.cloud
```

-----

## 🚀 4. Hướng dẫn chạy (Run Demo)

Mở **3 Terminal** riêng biệt để chạy song song toàn bộ hệ thống.

### **Terminal 1: Blockchain Local**

Chạy blockchain giả lập trên máy:

```bash
npx hardhat node
```

> **Lưu ý:** Giữ terminal này luôn chạy. Nó sẽ in ra 20 tài khoản ví test kèm Private Key.

### **Terminal 2: Deploy & Backend**

Deploy smart contract và bật server bảo vệ file:

```bash
# 1. Deploy Contract lên mạng Local
npx hardhat run scripts/deploy.js --network localhost

# 2. (BẮT BUỘC) Copy file địa chỉ contract mới sang Frontend
# Chạy lệnh này trên Windows:
copy contract-address.json client\src\abi\

# 3. Khởi động Server
cd server
node index.js
```

> Server sẽ báo: `✅ Gatekeeper Server running on http://localhost:3001`

### **Terminal 3: Frontend**

Chạy giao diện web React:

```bash
cd client
npm run dev
```

> Truy cập tại: `http://localhost:5173`

-----

## 🦊 5. Setup MetaMask để Test

Vì chạy trên mạng Local, ví MetaMask của bạn chưa có tiền và chưa biết mạng này.

1.  **Thêm mạng Localhost:**
      * Mở MetaMask -\> Add Network -\> Manually.
      * **RPC URL:** `http://127.0.0.1:8545`
      * **Chain ID:** `31337`
      * **Symbol:** `ETH`
2.  **Nhập ví Test (Import Account):**
      * Vào **Terminal 1**, copy Private Key của `Account #0` -\> Import vào MetaMask (Đặt tên: **Seller**).
      * Copy Private Key của `Account #1` -\> Import vào MetaMask (Đặt tên: **Buyer**).

-----

## ✅ 6. Kịch bản Test (Walkthrough)

1.  **Seller (Account \#0):**
      * Kết nối ví Seller.
      * Điền giá, chọn ảnh và file PDF. Bấm **"List Product"**.
2.  **Buyer (Account \#1):**
      * Chuyển ví sang Buyer trên MetaMask.
      * **Refresh trang web (F5)**.
      * Kéo xuống dưới, bấm **"Buy Now"** -\> Confirm giao dịch.
3.  **Verify:**
      * Nút mua sẽ đổi thành **"🔓 View Content"**.
      * Bấm vào để xem file PDF (Chỉ Buyer mới xem được, ví khác sẽ bị báo lỗi).

-----

**Lưu ý quan trọng:** Nếu tắt `npx hardhat node`, blockchain sẽ bị reset. Bạn phải chạy lại Deploy (Terminal 2) và copy lại file json địa chỉ thì web mới chạy đúng.