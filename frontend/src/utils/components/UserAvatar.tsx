'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials } from '../string';

interface UserAvatarProps {
  user: {
    name: string;
    email?: string;
    avatar?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export function UserAvatar({ 
  user, 
  size = 'md',
  className = '' 
}: UserAvatarProps) {
  const sizeClass = sizeClasses[size];
  const textSizeClass = textSizeClasses[size];

  return (
    <Avatar className={`${sizeClass} ${className}`}>
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback className={`${textSizeClass} bg-gradient-to-r from-blue-500 to-purple-600 text-white`}>
        {getInitials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}
