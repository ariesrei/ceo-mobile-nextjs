export type MessagingUser = {
  id?: number;
  name?: string;
};

export type MessagingParticipant = {
  user_id: number;
  user?: MessagingUser;
};

export type MessagingMessage = {
  id: number | string;
  sender_id: number;
  body: string;
  deleted?: boolean;
  created_at?: string;
};

export type MessagingConversation = {
  id: number;
  title?: string;
  unread_count?: number;
  last_message?: MessagingMessage | null;
  participants?: MessagingParticipant[];
};

export type MessagingListResponse = {
  items: MessagingConversation[];
  user_id: number;
};

export type MessagingThreadResponse = {
  messages: MessagingMessage[];
  user_id: number;
  pagination?: {
    has_more?: boolean;
    next_cursor?: string | null;
  };
};
