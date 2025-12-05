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


Để chạy test IPFS (tạm sử dụng dịch vụ của Pinata)

- Đảm bảo cài các package:
```shell
npm install pinata
npm install dotenv
```

- Đổi path tới file cần upload thử trong script /ipfs/setup.js
- Đảm bảo có .env lưu ở ngoài.
- Chạy test

```shell
node ./ipfs/setup.js
```

- Để test thành công không lấy CID được output và đưa vào các nhà cung cấp IPFS:
https://cloudflare-ipfs.com/ipfs/<CID>
https://ipfs.io/ipfs/<CID>
https://dweb.link/ipfs/<CID>
https://w3s.link/ipfs/<CID>