import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

if (typeof window !== 'undefined') {
  window.alert = (message) => {
    const msg = String(message);
    if (
      msg.toLowerCase().includes('lỗi') || 
      msg.toLowerCase().includes('failed') || 
      msg.toLowerCase().includes('error') ||
      msg.toLowerCase().includes('bị từ chối') ||
      msg.toLowerCase().includes('không tìm thấy')
    ) {
      toast.error(msg, { duration: 5000 });
    } else if (msg.toLowerCase().includes('thành công') || msg.toLowerCase().includes('success') || msg.toLowerCase().includes('đã lưu')) {
      toast.success(msg, { duration: 4000 });
    } else {
      toast.info(msg, { duration: 4000 });
    }
  };
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
