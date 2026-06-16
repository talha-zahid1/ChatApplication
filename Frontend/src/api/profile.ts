import apiClient from './axios';

export interface ProfilePicResponse {
  status: boolean;
  url?: string;
  profile_url?: string;
}

export interface BioResponse {
  status: boolean;
  bio?: string;
  message?: string;
}

export interface StatusMessageResponse {
  status: boolean;
  message: string;
}

export const profileApi = {
  async uploadProfilePic(file: File): Promise<ProfilePicResponse> {
    const formData = new FormData();
    formData.append('profile_pic', file);
    const response = await apiClient.post<ProfilePicResponse>('/upload-profile_pic/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateProfilePic(file: File): Promise<ProfilePicResponse> {
    const formData = new FormData();
    formData.append('profile_pic', file);
    const response = await apiClient.put<ProfilePicResponse>('/update-profile_pic/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getProfilePic(): Promise<ProfilePicResponse> {
    const response = await apiClient.get<ProfilePicResponse>('/get-profile_pic/');
    return response.data;
  },

  async deleteProfilePic(): Promise<StatusMessageResponse> {
    const response = await apiClient.delete<StatusMessageResponse>('/delete-profile_pic/');
    return response.data;
  },

  async uploadBio(bio: string): Promise<StatusMessageResponse> {
    // upload-bio/ is PUT, not POST according to the prompt
    const response = await apiClient.put<StatusMessageResponse>('/upload-bio/', { bio });
    return response.data;
  },

  async getBio(): Promise<BioResponse> {
    const response = await apiClient.get<BioResponse>('/get-bio/');
    return response.data;
  },

  async deleteBio(): Promise<StatusMessageResponse> {
    const response = await apiClient.delete<StatusMessageResponse>('/delete-bio/');
    return response.data;
  },
};
