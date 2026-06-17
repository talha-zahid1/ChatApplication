export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  profile_pic: string | null;
  bio: string | null;
}

export interface InboxItem {
  message: string;
  room_id: number;
  sender_id: number | null;
  rec_id: number[];
  is_group: boolean;
  group_name: string | null;  // ✅ added
  
}

export interface ChatMessage {
  message_id: number;
  message: string;
  is_read: boolean;
  sender_id: number;
  sender_username: string;
  timestamp: string;
  room_id: number;
}

export interface PaginatedMessages {
  next: string | null;
  previous: string | null;
  results: ChatMessage[];
}

export interface RoomMember {
  id: number;
  username: string;
  email: string;
}

export interface RoomMembersResponse {
  status: boolean;
  members: RoomMember[];
  is_group: boolean;        // ✅ add karo
  group_name: string | null;
}
