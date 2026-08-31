import { z } from 'zod';

export const userSchema = z.object({
  branchId: z.string().optional().or(z.literal('')),
  role: z.string().min(1, 'Vai trò là bắt buộc'),
  fullName: z.string().min(2, 'Tên nhân viên phải có ít nhất 2 ký tự').max(100),
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự').max(50),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ').max(15),
  password: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Locked']).optional(),
}).refine(data => {
  // If it's a new user (no status), password is required
  if (!data.status && !data.password) {
    return false;
  }
  return true;
}, {
  message: "Mật khẩu là bắt buộc khi tạo mới",
  path: ["password"]
});

export type UserFormValues = z.infer<typeof userSchema>;
