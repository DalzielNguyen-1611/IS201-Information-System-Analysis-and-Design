import { createBrowserRouter, redirect } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { Products } from './components/Products';
import { Customers } from './components/Customers';
import { Booking } from './components/Booking';
import { Inventory } from './components/Inventory';
import { Purchase } from './components/Purchase';
import { HR } from './components/HR';
import { Attendance } from './components/Attendance';
import { Leave } from './components/Leave';
import { Payroll } from './components/Payroll';

export const router = createBrowserRouter([
  { path: '/login', Component: Login },
  { path: '/pos', Component: POS },
  { path: '/sales', loader: () => redirect('/pos') },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, loader: () => redirect('/dashboard') },
      { path: 'dashboard', Component: Dashboard },
      { path: 'products', Component: Products },
      { path: 'customers', Component: Customers },
      { path: 'booking', Component: Booking },
      { path: 'inventory', Component: Inventory },
      { path: 'purchase', Component: Purchase },
      { path: 'hr', Component: HR },
      { path: 'attendance', Component: Attendance },
      { path: 'leave', Component: Leave },
      { path: 'payroll', Component: Payroll },
    ],
  },
]);
