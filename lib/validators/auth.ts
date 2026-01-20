import { z } from "zod";

export const LoginValidationSchema = z.object({
  email: z.string().min(1, { message: "Email là bắt buộc" }).email({ message: "Địa chỉ email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

export const RegisterValidationSchema = z.object({
  name: z.string().min(2, { message: "Tên phải có ít nhất 2 ký tự" }),
  email: z.string().min(1, { message: "Email là bắt buộc" }).email({ message: "Địa chỉ email không hợp lệ" }),
  password: z.string().min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" }),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().min(1, { message: "Email là bắt buộc" }).email({ message: "Địa chỉ email không hợp lệ" }),
});

export type LoginFormValues = z.infer<typeof LoginValidationSchema>;
export type RegisterFormValues = z.infer<typeof RegisterValidationSchema>;
export type ForgotPasswordValues = z.infer<typeof ForgotPasswordSchema>;