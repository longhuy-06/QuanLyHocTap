
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useNavigate } from 'react-router-dom';
import { OAuthButtons } from './OAuthButtons';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { LoginValidationSchema, LoginFormValues } from '../../lib/validators/auth';
import { useAuthStore } from '../../lib/store/authStore';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginValidationSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  // Xóa lỗi cũ khi component mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      navigate('/dashboard');
    } catch (e) {
      // Lỗi đã được set trong store, có thể hiển thị thêm toast notification ở đây nếu cần
      console.error("Login failed", e);
    }
  };

  const handleOAuthSignIn = (provider: 'google' | 'github') => {
    console.log(`Signing in with ${provider}`);
    // OAuth logic here (simulate)
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <Card className="w-full max-w-md bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-white/50 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl text-center">Đăng nhập vào tài khoản</CardTitle>
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

            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => navigate('/forgot-password')}
                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            <Button className="w-full text-base" type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Đang xử lý...
                </span>
              ) : 'Đăng nhập'}
            </Button>
          </form>
        </Form>

        <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-text-muted uppercase">Hoặc tiếp tục với</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
        </div>

        <OAuthButtons isLoading={isLoading} onOAuthSignIn={handleOAuthSignIn} />

      </CardContent>
    </Card>
  );
};
