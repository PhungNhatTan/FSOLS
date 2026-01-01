import React, { useState, useMemo } from "react";
import certificateApi from "../../../api/certificate";

interface Course {
  Id: number;
  Name: string;
  Description: string;
  PublishedAt?: string | null;
  DeletedAt?: string | null;
}

interface Certificate {
  Id: number;
  CertificateType: "Course" | "Specialization";
  CourseId?: number;
  SpecializationId?: number;
  CreatedAt: string;
}

interface Props {
  courses: Course[];
  onEdit?: (course: Course) => void;
  onDeleted?: (id: number) => void;
  onManage?: (courseId: number) => void;
}

// Certificate Preview Modal Component
function CertificatePreviewModal(props: {
  open: boolean;
  onClose: () => void;
  studentName: string;
  setStudentName: (v: string) => void;
  courseName: string;
  verifyCode: string;
  issuedAt: string;
  hasCertificate: boolean;
  onFullScreen?: () => void;
}) {
  const {
    open,
    onClose,
    studentName,
    setStudentName,
    courseName,
    verifyCode,
    issuedAt,
    hasCertificate,
    onFullScreen,
  } = props;

  if (!open) return null;

  const certificateName = `${courseName} Certificate`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div>
            <div className="font-semibold">Certificate Preview</div>
            {!hasCertificate && (
              <div className="text-xs text-amber-600 mt-1">
                No certificate configured for this course in the backend
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {onFullScreen && (
              <button
                className="px-3 py-2 rounded border hover:bg-slate-50 text-sm"
                onClick={onFullScreen}
                title="Open in full screen"
              >
                Full Screen
              </button>
            )}
            <button className="px-3 py-2 rounded border hover:bg-slate-50" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-4 border-b bg-gray-50 flex flex-wrap items-end gap-3">
            <div className="min-w-[260px] flex-1">
              <label className="text-sm font-medium">Student name (preview only)</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Nguyen Van A"
              />
            </div>
            <div className="text-sm text-gray-600">
              <div>
                <span className="font-medium">Course:</span> {courseName}
              </div>
              <div>
                <span className="font-medium">Issued:</span> {issuedAt}
              </div>
            </div>
          </div>

          <div className="p-4 bg-white">
            <div className="relative mx-auto w-full max-w-4xl border rounded-lg overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.10]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 30%, #94a3b8 0, transparent 35%), radial-gradient(circle at 80% 70%, #94a3b8 0, transparent 35%), linear-gradient(135deg, transparent 0, transparent 45%, #94a3b8 50%, transparent 55%, transparent 100%)",
                  backgroundSize: "auto, auto, 36px 36px",
                }}
              />

              <div className="relative grid grid-cols-12">
                <div className="col-span-8 p-10">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xl tracking-wide">
                      <span className="text-blue-600">F</span>
                      <span className="text-red-600">S</span>
                      <span className="text-yellow-600">O</span>
                      <span className="text-green-600">L</span>
                      <span className="text-slate-900">S</span>
                    </div>
                    <div className="text-sm text-gray-600">{issuedAt}</div>
                  </div>

                  <div className="mt-10 text-xs tracking-[0.3em] text-gray-500">COURSE CERTIFICATE</div>

                  <div className="mt-5 text-4xl font-serif tracking-wide">
                    {studentName.trim() ? studentName.trim() : "STUDENT NAME"}
                  </div>

                  <div className="mt-3 text-gray-700">has successfully completed</div>

                  <div className="mt-2 text-xl font-semibold text-gray-900">{courseName}</div>
                  <div className="mt-2 text-gray-700">{certificateName}</div>

                  <div className="mt-8 flex items-center gap-2 text-sm">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white">
                      ✓
                    </span>
                    <span className="text-gray-800 font-medium">Verified by FSOLS</span>
                  </div>

                  <div className="mt-10 grid grid-cols-2 gap-10 text-sm text-gray-700">
                    <div>
                      <div className="h-[1px] bg-gray-300 mb-2" />
                      <div className="font-medium">FSOLS Academy</div>
                      <div className="text-xs text-gray-500">Instructor Signature</div>
                    </div>
                    <div>
                      <div className="h-[1px] bg-gray-300 mb-2" />
                      <div className="font-medium">FSOLS Platform</div>
                      <div className="text-xs text-gray-500">Authorized Signature</div>
                    </div>
                  </div>

                  <div className="mt-8 text-xs text-gray-600">
                    Verify at:{" "}
                    <span className="font-mono text-gray-800">fsols.local/verify/{verifyCode}</span>
                  </div>
                </div>

                <div className="col-span-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-200 to-slate-50 border-l" />
                  <div className="relative h-full flex flex-col items-center justify-center p-8">
                    <div className="text-xs tracking-[0.35em] text-gray-600 text-center">
                      COURSE
                      <br />
                      CERTIFICATE
                    </div>

                    <div className="mt-10 w-40 h-40 rounded-full border-2 border-gray-400 flex items-center justify-center">
                      <div className="w-28 h-28 rounded-full border border-gray-300 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900">FSOLS</div>
                          <div className="text-xs tracking-widest text-gray-600 mt-1">VERIFIED</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 text-xs text-gray-600 text-center">
                      Verification code
                      <div className="mt-1 font-mono text-gray-800">{verifyCode}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto mt-3 text-xs text-gray-500">
              {!hasCertificate ? (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                  ⚠️ This is a preview only. No certificate is configured for this course in the backend.
                  Create one in the certificate management page.
                </div>
              ) : (
                "This is a preview. Actual certificates will be issued to students upon course completion."
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function toVerifyCode(courseId: number, certificateId?: number): string {
  const base = certificateId ? `CERT${certificateId}` : `COURSE${courseId}`;
  return base.toUpperCase().slice(0, 12).padEnd(12, "0");
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

const CourseList: React.FC<Props> = ({ courses, onEdit, onDeleted, onManage }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStudentName, setPreviewStudentName] = useState("");
  const [previewCourseId, setPreviewCourseId] = useState<number | null>(null);
  const [loadingCertificate, setLoadingCertificate] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      console.log("Delete course:", id);
      onDeleted?.(id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete course");
    }
  };

  const handleViewCertificate = async (course: Course) => {
    setPreviewCourseId(course.Id);
    setPreviewStudentName("");
    setLoadingCertificate(true);
    setPreviewOpen(true);

    try {
      const cert = await certificateApi.getCertificateByCourseId(course.Id);
      setCertificate(cert);
    } catch (error) {
      console.error("Failed to load certificate:", error);
      setCertificate(null);
    } finally {
      setLoadingCertificate(false);
    }
  };

  const handleFullScreen = () => {
    if (!previewCourseId) return;
    // In real app: navigate to `/course/${previewCourseId}/certificate`
    window.open(`/course/${previewCourseId}/certificate`, "_blank");
  };

  const previewData = useMemo(() => {
    if (!previewCourseId) return null;

    const course = courses.find((c) => c.Id === previewCourseId);
    if (!course) return null;

    const verifyCode = toVerifyCode(previewCourseId, certificate?.Id);
    const issuedAt = formatDate(new Date());

    return {
      courseName: course.Name,
      verifyCode,
      issuedAt,
      hasCertificate: !!certificate,
    };
  }, [previewCourseId, courses, certificate]);

  return (
    <>
      {previewData && (
        <CertificatePreviewModal
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setCertificate(null);
          }}
          studentName={previewStudentName}
          setStudentName={setPreviewStudentName}
          courseName={previewData.courseName}
          verifyCode={previewData.verifyCode}
          issuedAt={previewData.issuedAt}
          hasCertificate={previewData.hasCertificate}
          onFullScreen={handleFullScreen}
        />
      )}

      <table className="w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-2">ID</th>
            <th className="border px-2 py-2">Name</th>
            <th className="border px-2 py-2">Description</th>
            <th className="border px-2 py-2">Status</th>
            <th className="border px-2 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...courses]
            .sort((a, b) => {
              if (a.DeletedAt && !b.DeletedAt) return 1;
              if (!a.DeletedAt && b.DeletedAt) return -1;
              return 0;
            })
            .map((c) => (
              <tr key={c.Id}>
                <td className="border px-2 py-2">{c.Id}</td>
                <td className="border px-2 py-2">{c.Name}</td>
                <td className="border px-2 py-2">{c.Description}</td>
                <td className="border px-2 py-2 text-center">
                  {c.PublishedAt ? (
                    <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                      Published
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      Draft
                    </span>
                  )}
                </td>
                <td className="border px-2 py-2">
                  <div className="flex justify-between items-center">
                    {!c.DeletedAt && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => onEdit?.(c)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onManage?.(c.Id)}
                          className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 text-sm"
                        >
                          Manage
                        </button>
                        {c.PublishedAt && (
                          <button
                            onClick={() => handleViewCertificate(c)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                            disabled={loadingCertificate && previewCourseId === c.Id}
                          >
                            {loadingCertificate && previewCourseId === c.Id
                              ? "Loading..."
                              : "View Certificate"}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c.Id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    {c.DeletedAt && <span className="text-red-500 ml-auto text-sm">Deleted</span>}
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
};

export default CourseList;
