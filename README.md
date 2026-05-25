# 🏆 PetERP - Hệ Thống Quản Trị Chuỗi Cửa Hàng & Dịch Vụ Spa Thú Cưng Thông Minh

> **Môn học: Phân Tích Thiết Kế Hệ Thống Thông Tin (IS201)**  
> Dự án kết hợp công nghệ Frontend hiện đại (React, Bootstrap 4, Tailwind CSS), Backend API mạnh mẽ (Node.js & Express) và Hệ quản trị cơ sở dữ liệu doanh nghiệp Oracle Database để quản lý toàn diện chuỗi cửa hàng và dịch vụ spa thú cưng.

---

## 🌟 Tổng Quan Dự Án

**PetERP** là giải pháp quản trị doanh nghiệp toàn diện (ERP) được thiết kế chuyên biệt cho mô hình kinh doanh chuỗi cửa hàng bán lẻ sản phẩm thú cưng kết hợp dịch vụ spa, làm đẹp và chăm sóc y tế thú cưng thông minh. Hệ thống giải quyết triệt để các bài toán nghiệp vụ từ khâu bán hàng nhanh tại quầy (POS), kiểm soát kho hàng, mua sắm nhà cung cấp, chấm công nhân sự thời gian thực, tự động tính lương và khấu trừ các khoản bảo hiểm xã hội, cấu hình biểu thuế thu nhập cá nhân (TNCN) lũy tiến từng phần.

---

## 👥 Thành Viên Thực Hiện

* **Nguyễn Nữ Trà Giang** - *24520418* (Nhóm trưởng)
* **Nguyễn Đoàn Đức Hiếu** - *24520500*
* **Nguyễn Tấn Phát** - *24521307*
* **Trần Nhụy Tam Tử Phục** - *24521400*

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Bước 1: Cấu hình Cơ sở dữ liệu Oracle Database (Trực tiếp qua SQL Developer)
1. **Kết nối vào cơ sở dữ liệu bằng quyền quản trị tối cao:**
   * Mở ứng dụng **Oracle SQL Developer**.
   * Thiết lập một kết nối mới với tài khoản `SYS` (chọn Role là `SYSDBA`), kết nối đến database local của bạn (Host: `localhost`, Port: `1521`, SID: `xe` hoặc Service Name: `orcl`).
2. **Khởi tạo User mới và cấp đặc quyền quản trị:**
   Mở một cửa sổ SQL Worksheet của kết nối SYSDBA vừa tạo và thực thi đoạn lệnh sau để cấp quyền đầy đủ:
   ```sql
   -- Chuyển sang Pluggable Database (nếu sử dụng phiên bản Oracle Multitenant)
   ALTER SESSION SET CONTAINER = ORCLPDB1; 
   
   -- Tạo user và thiết lập mật khẩu truy cập
   CREATE USER PROJECT_IS_210 IDENTIFIED BY 123456;
   
   -- Cấp quyền kết nối, tài nguyên và đặc quyền quản trị (DBA)
   GRANT CONNECT, RESOURCE, DBA TO PROJECT_IS_210;
   
   -- Cấp hạn mức lưu trữ không giới hạn cho user trên Tablespace
   ALTER USER PROJECT_IS_210 QUOTA UNLIMITED ON USERS;
   ```
3. **Thực thi lần lượt các tệp lệnh SQL để tạo cấu trúc dữ liệu:**
   * Tạo một kết nối mới trong **SQL Developer** bằng User vừa tạo (`PROJECT_IS_210` / `123456`).
   * Mở và thực thi lần lượt các file script SQL trong thư mục `/database` trên Worksheet của kết nối mới này:
     * Chạy file `schema/db.sql` để khởi tạo cấu trúc bảng.
     * Chạy file `constraint.sql` để áp dụng các ràng buộc.
     * Chạy file `fuction.sql`, `trigger.sql` và `procedures.sql` để nạp các hàm, trigger nghiệp vụ.

### Bước 2: Cài đặt và Khởi chạy API Backend
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện phụ thuộc của hệ thống:
   ```bash
   npm install
   ```
3. Cài đặt thư viện kết nối cơ sở dữ liệu Oracle (Oracledb) bắt buộc:
   ```bash
   npm install oracledb
   ```
4. Cấu hình tệp môi trường `.env` trong thư mục `backend/`:
   ```env
   PORT=5000
   JWT_SECRET=PetERP_Secret_Key_2026
   DB_HOST=localhost
   DB_PORT=1521
   DB_USERNAME=PROJECT_IS_210
   DB_PASSWORD=123456
   DB_SERVICE_NAME=ORCLPDB1
   ```
5. Khởi chạy Server Backend:
   ```bash
   npm run dev
   ```
   *(Backend API sẽ hoạt động tại địa chỉ: `http://localhost:5000`)*

### Bước 3: Cài đặt và Khởi chạy Giao diện Frontend
1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy Giao diện Frontend:
   ```bash
   npm run dev
   ```
   *(Giao diện Client sẽ hoạt động tại địa chỉ: `http://localhost:5173` hoặc `http://localhost:5174`)*

---

## 🛠️ Công Nghệ Sử Dụng

| Tầng (Layer) | Công Nghệ & Thư Viện | Vai Trò |
| :--- | :--- | :--- |
| **Frontend** | React.js, Vite, Bootstrap 4, Tailwind CSS, Shadcn UI | Xây dựng giao diện trang đơn (SPA) trực quan, Responsive mượt mà trên PC thu ngân, máy tính bảng và thiết bị di động. |
| **Backend** | Node.js, Express.js, JWT, bcrypt, oracledb | Xây dựng RESTful API bảo mật, xử lý xác thực phân quyền, điều phối logic nghiệp vụ trung tâm và tương tác cơ sở dữ liệu. |
| **Database** | Oracle Database 19c/21c | Hệ quản trị cơ sở dữ liệu doanh nghiệp lưu trữ dữ liệu an toàn, thực thi ràng buộc, Trigger, Function và Stored Procedure PL/SQL. |

---

## 💼 Các Phân Hệ Nghiệp Vụ Chính (Modules)

### 1. 🛒 Bán Hàng Tại Quầy (POS & CRM)
* Hỗ trợ thu ngân tìm kiếm nhanh sản phẩm thú cưng, dịch vụ spa, lập hóa đơn thanh toán đa phương thức.
* Tích hợp cơ chế tích lũy điểm thưởng và nâng hạng thành viên tự động.

### 2. ✂️ Quản Lý Dịch Vụ Spa & Đặt Lịch (Spa Booking)
* Đặt lịch hẹn spa, cắt tỉa lông, tắm rửa, lưu trữ thông tin thú cưng (tên, giống, cân nặng).
* Phân công nhân sự kỹ thuật viên thực hiện dịch vụ spa theo ca làm việc.

### 3. 📦 Quản Lý Kho Hàng & Sản Phẩm (Inventory & Products)
* Theo dõi số lượng tồn kho thực tế của các loại thức ăn, phụ kiện, thuốc thú y.
* Cảnh báo sản phẩm sắp hết hàng hoặc hết hạn sử dụng.

### 4. 🕒 Nhân Sự & Trạm Chấm Công (HR & Time Clock)
* **Trạm Chấm Công (Action Clock)**: Giao diện đếm giây thời gian thực trực quan giúp nhân viên check-in/check-out định vị chi nhánh cửa hàng.
* Quản lý đơn xin nghỉ phép, duyệt tăng ca và phân ca làm việc linh hoạt.

### 5. 💵 Bảng Lương & Cấu Hình Thuế (Payroll & Taxes)
* Tự động tính toán bảng lương hàng tháng của nhân viên dựa trên dữ liệu chấm công thực tế.
* Trích đóng bảo hiểm (BHXH, BHYT, BHTN) và tính thuế TNCN theo biểu thuế lũy tiến 5 bậc chuẩn xác.

---
🇻🇳 *Bản quyền thuộc về Nhóm phát triển Dự án Hệ thống quản trị chuỗi PetERP - Đại học Công nghệ Thông tin - ĐHQG TP.HCM.*
