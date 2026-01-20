
import React, { useState } from 'react';
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
import { ForgotPasswordSchema, ForgotPasswordValues } from '../../lib/validators/auth';

export const ForgotPasswordForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onBlur',
  });

  const handleSubmit = (values: ForgotPasswordValues) => {
    setIsLoading(true);
    console.log('Reset password for:', values.email);
    
    // Fake API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
  };

  if (isSent) {
    return (
      <Card className="w-full max-w-md bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-white/50 dark:border-gray-700 animate-fade-in-up">
        <CardContent className="pt-10 pb-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-[24px] flex items-center justify-center mb-6 shadow-sm border border-emerald-100 dark:border-emerald-800/30">
            <span className="material-symbols-outlined text-[40px] font-bold">mark_email_read</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Đã gửi yêu cầu!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
            Chúng tôi đã gửi liên kết đặt lại mật khẩu đến <br/>
            <span className="font-black text-gray-900 dark:text-gray-100">{form.getValues('email')}</span>. 
            Vui lòng kiểm tra hộp thư đến.
          </p>
          <Button 
            className="w-full h-14 text-base font-bold shadow-xl shadow-primary/20" 
            onClick={() => navigate('/login')}
          >
            Quay lại đăng nhập
          </Button>
          <button 
            onClick={() => setIsSent(false)} 
            className="mt-6 text-xs font-black uppercase tracking-widest text-primary hover:underline"
          >
            Gửi lại email khác?
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-white/50 dark:border-gray-700 animate-fade-in-up">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-black text-center text-gray-900 dark:text-white">Lấy lại mật khẩu</CardTitle>
        <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-tighter mt-1">
          Nhập email để nhận hướng dẫn khôi phục
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-xs uppercase tracking-widest text-gray-400">Email của bạn</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="vidu@email.com" 
                      type="email" 
                      disabled={isLoading} 
                      className="h-14 bg-gray-50/50 dark:bg-gray-800/50 border-none rounded-2xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full h-14 text-base font-bold shadow-xl shadow-primary/20 mt-2" type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Đang xử lý...
                </span>
              ) : (
                'Gửi mã xác nhận'
              )}
            </Button>

            <div className="flex justify-center pt-2">
              <button 
                type="button"
                onClick={() => navigate('/login')} 
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-all group"
              >
                <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                Trở lại đăng nhập
              </button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
