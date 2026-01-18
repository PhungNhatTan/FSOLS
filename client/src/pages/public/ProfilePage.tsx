"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyProfile, type MyProfile } from "../../api/profile";
import certificateApi, { type MyCertificateListItem } from "../../api/certificate";
import { resolveUploadUrl } from "../../utils/url";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [certs, setCerts] = useState<MyCertificateListItem[]>([]);
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState("");

  const initials = useMemo(() => {
    const name = (profile?.DisplayName || profile?.Username || "").trim();
    if (!name) return "U";
    const parts = name.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "U";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (a + b).toUpperCase();
  }, [profile]);

  const load = async () => {
    setLoading(true);
    setError("");
    setCertError("");
    try {
      const p = await getMyProfile();
      setProfile(p);

      // Load issued certificates for this account (used by the Profile page)
      setCertLoading(true);
      try {
        const list = await certificateApi.getMyCertificates();
        setCerts(list);
      } catch (e) {
        setCerts([]);
        setCertError(e instanceof Error ? e.message : "Failed to load certificates");
      } finally {
        setCertLoading(false);
      }
    } catch (err) {
      setProfile(null);
      setError(err instanceof Error ? err.message : "Failed to load profile");
      setCerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <div className="flex gap-3">
          <button
            onClick={load}
            className="px-3 py-2 rounded-lg border hover:bg-slate-50"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
          <Link
            to="/profile/edit"
            className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading && <p className="text-gray-600">Loading profile...</p>}

      {!loading && profile && (
        <div className="space-y-6">
          <div className="border rounded-2xl p-6 shadow-sm bg-white">
            <div className="flex gap-5 items-start">
              {profile.AvatarUrl ? (
                <img
                  src={resolveUploadUrl(profile.AvatarUrl) ?? String(profile.AvatarUrl)}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-lg font-semibold text-slate-700 border">
                  {initials}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{profile.DisplayName}</h2>
                    <p className="text-gray-600 text-sm">@{profile.Username}</p>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div className="text-right">
                      <div className="font-medium text-gray-900">Role</div>
                      <div>{profile.Roles?.join(", ") ?? "Student"}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border p-4">
                    <div className="text-xs uppercase text-gray-500 mb-1">Email</div>
                    <div className="text-sm font-medium break-all">
                      {profile.Email ?? "Not set"}
                    </div>
                    {profile.Email && (
                      <div
                        className={`mt-1 text-xs ${profile.EmailVerified ? "text-green-700" : "text-orange-700"
                          }`}
                      >
                        {profile.EmailVerified ? "Verified" : "Not verified"}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="text-xs uppercase text-gray-500 mb-1">Member since</div>
                    <div className="text-sm font-medium">{formatDate(profile.CreatedAt)}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border p-4">
                  <div className="text-xs uppercase text-gray-500 mb-1">Bio</div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">
                    {profile.Bio && profile.Bio.trim() ? profile.Bio : "No bio yet."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Certificates */}
          <div className="border rounded-2xl p-6 shadow-sm bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Certificates</h2>
              <div className="text-sm text-gray-600">{certs.length} total</div>
            </div>

            {certError && (
              <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {certError}
              </div>
            )}

            {certLoading && <p className="mt-3 text-gray-600">Loading certificates...</p>}

            {!certLoading && !certError && certs.length === 0 && (
              <p className="mt-3 text-gray-600">No certificates yet.</p>
            )}

            {!certLoading && certs.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Issued</th>
                      <th className="py-2 pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certs.map((c) => {
                      const type = c.Certificate?.CertificateType ?? "Course";
                      const name =
                        type === "Course"
                          ? c.Certificate?.Course?.Name ?? "Course"
                          : c.Certificate?.Specialization?.SpecializationName ?? "Specialization";

                      return (
                        <tr key={c.Id} className="border-b last:border-b-0">
                          <td className="py-2 pr-4">{type}</td>
                          <td className="py-2 pr-4 font-medium">{name}</td>
                          <td className="py-2 pr-4 text-gray-700">{formatDate(c.CreatedAt)}</td>
                          <td className="py-2 pr-2">
                            <Link
                              to={`/certificate/${profile.Id}/${c.CertificateId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg border hover:bg-slate-50 inline-block"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && !profile && !error && (
        <p className="text-gray-600">No profile data found.</p>
      )}
    </div>
  );
}
