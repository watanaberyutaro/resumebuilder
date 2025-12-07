import { createClient } from '@/lib/supabase/server';
import type { NotificationType } from '@/types/database';

// =====================================================
// Notification Service
// Handles app notifications, email, and LINE integration
// =====================================================

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  channels?: {
    app?: boolean;
    email?: boolean;
    line?: boolean;
  };
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  channelResults?: {
    app?: boolean;
    email?: boolean;
    line?: boolean;
  };
  error?: string;
}

// LINE Messaging API types
interface LineMessage {
  type: 'text';
  text: string;
}

export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const supabase = await createClient();
  const channels = payload.channels || { app: true };
  const channelResults: { app?: boolean; email?: boolean; line?: boolean } = {};

  try {
    // 1. Always create app notification
    const { data: notification, error: dbError } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.userId,
        notification_type: payload.type,
        title: payload.title,
        message: payload.message,
        related_entity_type: payload.relatedEntityType,
        related_entity_id: payload.relatedEntityId,
        sent_via_app: true,
        sent_via_email: channels.email || false,
        sent_via_line: channels.line || false,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Failed to create notification: ${dbError.message}`);
    }

    channelResults.app = true;

    // 2. Send email if requested
    if (channels.email) {
      try {
        await sendEmailNotification(payload);
        channelResults.email = true;
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        channelResults.email = false;
      }
    }

    // 3. Send LINE notification if requested
    if (channels.line) {
      try {
        // Get user's LINE user ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('line_user_id, line_notify_enabled')
          .eq('id', payload.userId)
          .single();

        if (profile?.line_user_id && profile?.line_notify_enabled) {
          await sendLineNotification(profile.line_user_id, payload);
          channelResults.line = true;
        } else {
          channelResults.line = false;
        }
      } catch (lineError) {
        console.error('LINE notification failed:', lineError);
        channelResults.line = false;
      }
    }

    return {
      success: true,
      notificationId: notification?.id,
      channelResults,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      channelResults,
    };
  }
}

// Email notification (placeholder - integrate with SendGrid or similar)
async function sendEmailNotification(payload: NotificationPayload): Promise<void> {
  // Placeholder implementation
  // In production, integrate with SendGrid, AWS SES, or similar
  console.log('Email notification would be sent:', {
    to: payload.userId,
    subject: payload.title,
    body: payload.message,
  });

  // Example SendGrid integration:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: userEmail,
  //   from: 'noreply@ai-resume-builder.com',
  //   subject: payload.title,
  //   text: payload.message,
  // });
}

// LINE notification via Messaging API
async function sendLineNotification(
  lineUserId: string,
  payload: NotificationPayload
): Promise<void> {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured');
  }

  const message: LineMessage = {
    type: 'text',
    text: `${payload.title}\n\n${payload.message}`,
  };

  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [message],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LINE API error: ${response.status} - ${errorText}`);
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  return !error;
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }

  return count || 0;
}

// Scout-specific notification helper
export async function sendScoutNotification(
  recipientUserId: string,
  companyName: string,
  offerId: string
): Promise<NotificationResult> {
  return sendNotification({
    userId: recipientUserId,
    type: 'scout',
    title: '新しいスカウトが届きました',
    message: `${companyName}からスカウトメッセージが届きました。詳細を確認してください。`,
    relatedEntityType: 'offer',
    relatedEntityId: offerId,
    channels: {
      app: true,
      email: true,
      line: true,
    },
  });
}
