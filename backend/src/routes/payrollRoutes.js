const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.post('/calculate', payrollController.calculatePayroll);
router.get('/', payrollController.getPayrollRecords);

// Salary profile (owned by payroll team)
// Allow payroll users to fetch salary profile (PAYROLL or ALL)
router.get('/profile/:id', verifyToken, checkPermission('PAYROLL'), payrollController.getSalaryProfile);
router.put('/profile/:id', verifyToken, checkPermission('PAYROLL'), payrollController.upsertSalaryProfile);
router.put('/approve-all', verifyToken, checkPermission('PAYROLL'), payrollController.approveAllPayroll);
router.put('/approve/:id', verifyToken, checkPermission('PAYROLL'), payrollController.approvePayroll);
router.put('/pay/:id', verifyToken, checkPermission('PAYROLL'), payrollController.payPayroll);

// Global settings
router.get('/settings/config', verifyToken, checkPermission('PAYROLL'), payrollController.getGlobalConfig);
router.put('/settings/config', verifyToken, checkPermission('PAYROLL'), payrollController.updateGlobalConfig);

module.exports = router;
