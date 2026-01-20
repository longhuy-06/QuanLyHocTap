import React from 'react';
import { Button } from '../ui/button';
import { GoogleIcon, GitHubIcon } from '../Icons';

interface OAuthButtonsProps {
  isLoading: boolean;
  onOAuthSignIn: (provider: 'google' | 'github') => void;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({ isLoading, onOAuthSignIn }) => {
  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        className="w-full relative"
        onClick={() => onOAuthSignIn('google')}
        disabled={isLoading}
      >
        <GoogleIcon className="mr-2 h-5 w-5" />
        Sign in with Google
      </Button>
      <Button
        variant="outline"
        className="w-full relative"
        onClick={() => onOAuthSignIn('github')}
        disabled={isLoading}
      >
        <GitHubIcon className="mr-2 h-5 w-5" />
        Sign in with GitHub
      </Button>
    </div>
  );
};
