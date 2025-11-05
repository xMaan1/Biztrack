'use client';

import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  Notification,
  getNotificationTypeColor,
  getNotificationTypeIcon,
  getCategoryDisplayName,
  getCategoryIcon
} from '../../models/notifications';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { 
  Check, 
  X, 
  Clock, 
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  Bell
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  compact?: boolean;
  onAction?: () => void;
}

const iconMap = {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Settings,
  Bell
};

export default function NotificationItem({ 
  notification, 
  compact = false, 
  onAction 
}: NotificationItemProps) {
  const { markAsRead, markAsUnread, deleteNotification } = useNotifications();

  const handleMarkAsRead = async () => {
    try {
      if (notification.is_read) {
        await markAsUnread(notification.id);
      } else {
        await markAsRead(notification.id);
      }
    } catch (error) {
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNotification(notification.id);
    } catch (error) {
    }
  };

  const handleActionClick = () => {
    if (notification.action_url) {
      window.open(notification.action_url, '_blank');
    }
    onAction?.();
  };

  const typeColor = getNotificationTypeColor(notification.type);
  const typeIconName = getNotificationTypeIcon(notification.type);
  const categoryIconName = getCategoryIcon(notification.category);
  const TypeIcon = iconMap[typeIconName as keyof typeof iconMap] || Bell;
  const CategoryIcon = iconMap[categoryIconName as keyof typeof iconMap] || Bell;

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  if (compact) {
    return (
      <div className={`p-3 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''}`}>
        <div className="flex items-start space-x-3">
          <div className={`p-1.5 rounded-full ${typeColor}`}>
            <TypeIcon className="h-3 w-3" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">
                {notification.title}
              </p>
              <div className="flex items-center space-x-1 ml-2">
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAsRead}
                  className="h-6 w-6 p-0"
                >
                  {notification.is_read ? (
                    <Check className="h-3 w-3 text-gray-400" />
                  ) : (
                    <Check className="h-3 w-3 text-blue-500" />
                  )}
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  <CategoryIcon className="h-2 w-2 mr-1" />
                  {getCategoryDisplayName(notification.category)}
                </Badge>
                <span className="text-xs text-gray-400">{timeAgo}</span>
              </div>
              
              {notification.action_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleActionClick}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={`${!notification.is_read ? 'border-blue-200 bg-blue-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-full ${typeColor}`}>
            <TypeIcon className="h-4 w-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-700 mb-3">
                  {notification.message}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <CategoryIcon className="h-3 w-3" />
                    <span>{getCategoryDisplayName(notification.category)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{timeAgo}</span>
                  </div>
                  {notification.read_at && (
                    <div className="flex items-center space-x-1">
                      <Check className="h-3 w-3" />
                      <span>Read {formatDistanceToNow(new Date(notification.read_at), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1 ml-4">
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAsRead}
                  className="h-8 w-8 p-0"
                >
                  {notification.is_read ? (
                    <Check className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {notification.action_url && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleActionClick}
                  className="text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
