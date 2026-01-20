
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { RegisterValidationSchema, RegisterFormValues } from '../../lib/validators/auth';
import { useAuthStore } from '../../lib/store/authStore';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterValidationSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (values: RegisterFormValues) => {
    try {
      await register(values);
      // Navigate to Subject Selection instead of Dashboard
      navigate('/subjects');
    } catch (e) {
      console.error("Register failed", e);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-white/50 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl text-center">Tạo tài khoản mới</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in-up">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ và tên</FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn A" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" type="email" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full text-base mt-2" type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Đang tạo tài khoản...
                </span>
              ) : 'Đăng ký'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
