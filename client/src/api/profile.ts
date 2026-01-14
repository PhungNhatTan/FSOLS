import client from "../service/client";

export interface MyProfile {
  Id: string;
  Username: string;
  DisplayName: string;
  AvatarUrl?: string | null;
  Bio?: string | null;
  CreatedAt: string;
  Roles: string[];
  Email?: string | null;
  EmailVerified?: boolean | null;
}

export interface UpdateProfilePayload {
  DisplayName?: string;
  AvatarUrl?: string | null;
  Bio?: string | null;
}

export interface UpdateProfileResponse {
  message: string;
  account: MyProfile;
}

export interface UploadAvatarResponse {
  message: string;
  avatarUrl: string;
  account?: MyProfile;
}

export async function getMyProfile(): Promise<MyProfile> {
  const res = await client.get<MyProfile>("/account/me");
  return res.data;
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<UpdateProfileResponse> {
  const res = await client.patch<UpdateProfileResponse>("/account/me", payload);
  return res.data;
}

export async function uploadMyAvatar(file: File): Promise<UploadAvatarResponse> {
  const form = new FormData();
  form.append("avatar", file); // field name MUST be "avatar"
  const res = await client.post<UploadAvatarResponse>("/account/me/avatar", form);
  return res.data;
}

