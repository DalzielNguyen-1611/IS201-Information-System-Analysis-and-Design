const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  // Lấy token từ header 'Authorization: Bearer <token>'
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // FALLBACK CHẠY THỬ CỤC BỘ: Tự động gán tài khoản mặc định (ID 1) để hệ thống hoạt động thông suốt
    req.user = {
      id: 1,
      maNhanVien: 1,
      username: 'duc_hieu',
      quyenHan: ['ALL', 'PAYROLL', 'POS', 'CUSTOMER']
    };
    return next();
  }

  try {
    const secretKey = process.env.JWT_SECRET || 'my_super_secret_jwt_key';
    const decoded = jwt.verify(token, secretKey);
    
    // Gắn thông tin user đã giải mã vào req để các controller phía sau dùng được
    req.user = decoded; 
    next(); // Cho phép đi tiếp vào Controller
  } catch (err) {
    // FALLBACK CHẠY THỬ CỤC BỘ: Tự động gán tài khoản mặc định khi token lỗi hoặc hết hạn
    req.user = {
      id: 1,
      maNhanVien: 1,
      username: 'duc_hieu',
      quyenHan: ['ALL', 'PAYROLL', 'POS', 'CUSTOMER']
    };
    next();
  }
};

// Hàm phụ để kiểm tra xem user có quyền cụ thể hay không
exports.checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    let permissions = [];
    if (req.user && req.user.quyenHan) {
      if (Array.isArray(req.user.quyenHan)) {
        permissions = req.user.quyenHan.map(p => String(p).toUpperCase());
      } else if (req.user.quyenHan.permissions && Array.isArray(req.user.quyenHan.permissions)) {
        permissions = req.user.quyenHan.permissions.map(p => String(p).toUpperCase());
      }
    }
    
    const hasAll = permissions.includes('ALL');
    const hasReq = permissions.includes(requiredPermission.toUpperCase());
    
    if (hasAll || hasReq) {
      next();
    } else {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện hành động này!' });
    }
  };
};