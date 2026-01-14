"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyProfile,
  uploadMyAvatar,
  updateMyProfile,
  type MyProfile,
  type UpdateProfilePayload,
} from "../../api/profile";
import { resolveUploadUrl } from "../../utils/url";

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [form, setForm] = useState<UpdateProfilePayload>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const p = await getMyProfile();
      setProfile(p);
      setForm({
        DisplayName: p.DisplayName ?? "",
        AvatarUrl: p.AvatarUrl ?? "",
        Bio: p.Bio ?? "",
      });
    } catch (err) {
      setProfile(null);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }

    // Client-side size guard (server also enforces 2MB).
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar image must be 2MB or smaller.");
      e.target.value = "";
      return;
    }

    setAvatarUploading(true);
    try {
      const res = await uploadMyAvatar(file);
      setForm((s) => ({ ...s, AvatarUrl: res.avatarUrl }));
      setSuccess("Avatar uploaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    setForm((s) => ({ ...s, AvatarUrl: null }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload: UpdateProfilePayload = {
        DisplayName: (form.DisplayName ?? "").trim(),
        AvatarUrl: (form.AvatarUrl ?? "").trim() || null,
        Bio: (form.Bio ?? "").trim() || null,
      };

      if (!payload.DisplayName) {
        setError("Display name is required");
        setSaving(false);
        return;
      }

      const res = await updateMyProfile(payload);
      setProfile(res.account);
      setSuccess("Profile updated");
      // Navigate back after a short tick so the UI updates immediately.
      setTimeout(() => navigate("/profile"), 250);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <Link to="/profile" className="px-3 py-2 rounded-lg border hover:bg-slate-50">
          Back
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {loading && <p className="text-gray-600">Loading profile...</p>}

      {!loading && profile && (
        <form onSubmit={handleSave} className="border rounded-2xl p-6 shadow-sm bg-white space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Display name</label>
            <input
              value={form.DisplayName ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, DisplayName: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Your name"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Avatar</label>

            <div className="flex items-center gap-4">
              {form.AvatarUrl ? (
                <img
                  src={resolveUploadUrl(form.AvatarUrl) ?? String(form.AvatarUrl)}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-full object-cover border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-200 border" />
              )}

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  disabled={saving || avatarUploading}
                />
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-2 rounded-lg border hover:bg-slate-50"
                    disabled={saving || avatarUploading}
                  >
                    Remove
                  </button>
                  {avatarUploading && (
                    <span className="text-sm text-gray-600">Uploading...</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Upload JPG/PNG/WebP up to 2MB. The image is saved on the server and the returned URL is stored in AvatarUrl.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={(form.Bio as string) ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, Bio: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg min-h-[120px]"
              placeholder="A short introduction"
              maxLength={1000}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={load}
              className="px-4 py-2 rounded-lg border hover:bg-slate-50"
              disabled={saving}
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
