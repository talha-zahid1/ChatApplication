import apiClient from './axios';
import axios from 'axios';
import type { InboxItem, PaginatedMessages, RoomMembersResponse } from './types';

export interface PrivateRoomResponse {
  room_id: number;
}

export interface CreateGroupResponse {
  status: boolean;
  group_id: string;
  room_id: number;
}

export interface JoinGroupResponse {
  room_id: number;
}

export interface InboxResponse {
  status: boolean;
  last_message: InboxItem[];
}

export interface SeenResponse {
  status: boolean;
  message: string;
}

export interface GroupActionResponse {
  status: boolean;
  message: string;
}

export interface UploadMediaResponse {
  status: boolean;
  file_url: string;
}

export interface SearchUserResponse {
  status: boolean;
  user_id: number;
  username: string;
  email: string;
}

export interface SearchGroupResult {
  group_id: string;
  name: string;
  members_count: number;
  created_by: string | null;
}

export interface SearchGroupResponse {
  status: boolean;
  groups: SearchGroupResult[];
}

export interface DeleteMessageResponse {
  status: boolean;
  message: string;
}

export interface DeleteMediaResponse {
  status: boolean;
  message: string;
}

export const chatApi = {
  async getPrivateRoom(recId: number): Promise<PrivateRoomResponse> {
    const response = await apiClient.post<PrivateRoomResponse>('/private-room/', { rec_id: recId });
    return response.data;
  },

  async createGroup(members: number[], groupName: string): Promise<CreateGroupResponse> {
    const response = await apiClient.post<CreateGroupResponse>('/create-group/', { members, group_name: groupName });
    return response.data;
  },

  async joinGroup(groupId: string): Promise<JoinGroupResponse> {
    const response = await apiClient.post<JoinGroupResponse>('/group-room/', { group_id: groupId });
    return response.data;
  },

  async searchUser(query: string): Promise<SearchUserResponse> {
    const response = await apiClient.get<SearchUserResponse>(`/get-user/?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  async searchGroup(query: string): Promise<SearchGroupResponse> {
    const response = await apiClient.get<SearchGroupResponse>(`/get-groups/?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  async getInbox(): Promise<InboxItem[]> {
    try {
      const response = await apiClient.get<InboxResponse>('/inbox/');
      if (response.data.status && response.data.last_message) {
        return response.data.last_message;
      }
      return [];
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getMessages(roomId: number, cursor?: string | null): Promise<PaginatedMessages> {
    const url = `/chat/${roomId}/`;
    const params: Record<string, string> = {};
    if (cursor) {
      try {
        const urlObj = new URL(cursor);
        const cursorParam = urlObj.searchParams.get('cursor');
        if (cursorParam) params.cursor = cursorParam;
      } catch {
        params.cursor = cursor;
      }
    }
    const response = await apiClient.get<PaginatedMessages>(url, { params });
    return response.data;
  },

  async markSeen(messageIds: number[]): Promise<SeenResponse> {
    const response = await apiClient.post<SeenResponse>('/messages/seen/', { message_ids: messageIds });
    return response.data;
  },

  async getRoomMembers(roomId: number): Promise<RoomMembersResponse> {
    const response = await apiClient.get<RoomMembersResponse>(`/room-members/${roomId}/`);
    return response.data;
  },

  async addMember(roomId: number, userId: number): Promise<GroupActionResponse> {
    const response = await apiClient.post<GroupActionResponse>(`/add-room/${roomId}/`, { user_id: userId });
    return response.data;
  },

  async removeMember(roomId: number, userId: number): Promise<GroupActionResponse> {
    const response = await apiClient.post<GroupActionResponse>('/remove-member/', {
      user_id: userId,
      room_id: roomId,
    });
    return response.data;
  },

  async leaveGroup(roomId: number): Promise<GroupActionResponse> {
    const response = await apiClient.get<GroupActionResponse>(`/leave-room/${roomId}/`);
    return response.data;
  },

  async deleteGroup(roomId: number): Promise<GroupActionResponse> {
    const response = await apiClient.delete<GroupActionResponse>(`/delete-room/${roomId}/`);
    return response.data;
  },

  async deleteConversation(roomId: number): Promise<{ status: boolean; message: string }> {
    const response = await apiClient.delete<{ status: boolean; message: string }>(`/delete-chat/${roomId}/`);
    return response.data;
  },

  async uploadMedia(file: File): Promise<UploadMediaResponse> {
    const formData = new FormData();
    formData.append('media', file);
    const response = await apiClient.post<UploadMediaResponse>('/upload-media/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // ✅ Message delete
  async deleteMessage(messageId: number): Promise<DeleteMessageResponse> {
    const response = await apiClient.delete<DeleteMessageResponse>(`/del-messages/${messageId}/`);
    return response.data;
  },

  // ✅ Media file delete
  async deleteMedia(fileUrl: string): Promise<DeleteMediaResponse> {
    const response = await apiClient.delete<DeleteMediaResponse>('/del-media/', {
      data: { filepath: fileUrl },
    });
    return response.data;
  },
};