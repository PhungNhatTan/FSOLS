import { useEffect, useMemo, useState } from "react"
import courseApi from "../../api/course"
import type { Course } from "../../types/course"

type CertificateConfig = {
    id: string
    courseId: number
    certificateName: string
    description: string
    enabled: boolean
    createdAt: string
    updatedAt: string
}

const STORAGE_KEY = "fsols_certificates_v1"

function safeParse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback
    try {
        return JSON.parse(raw) as T
    } catch {
        return fallback
    }
}

function uuid(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID()
    }
    return `cert_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function loadCerts(): CertificateConfig[] {
    return safeParse<CertificateConfig[]>(localStorage.getItem(STORAGE_KEY), [])
}

function saveCerts(certs: CertificateConfig[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(certs))
}

function toVerifyCode(id: string): string {
    // Short-ish code derived from id (FE-only)
    const compact = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
    return compact.slice(0, 10) || "FSOLS000000"
}

function formatDate(d: Date): string {
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })
}

function CertificatePreviewModal(props: {
    open: boolean
    onClose: () => void
    studentName: string
    setStudentName: (v: string) => void
    courseName: string
    certificateName: string
    verifyCode: string
    issuedAt: string
}) {
    const { open, onClose, studentName, setStudentName, courseName, certificateName, verifyCode, issuedAt } = props
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* modal */}
            <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <div className="font-semibold">Certificate Preview</div>
                        
                    </div>

                    <button className="px-3 py-2 rounded border hover:bg-slate-50" onClick={onClose}>
                        Close
                    </button>
                </div>

                {/* controls */}
                <div className="p-4 border-b bg-gray-50 flex flex-wrap items-end gap-3">
                    <div className="min-w-[260px] flex-1">
                        <label className="text-sm font-medium">Student name</label>
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

                {/* certificate canvas */}
                <div className="p-4 bg-white">
                    <div className="relative mx-auto w-full max-w-4xl border rounded-lg overflow-hidden">
                        {/* background pattern (no image) */}
                        <div
                            className="absolute inset-0 opacity-[0.10]"
                            style={{
                                backgroundImage:
                                    "radial-gradient(circle at 20% 30%, #94a3b8 0, transparent 35%), radial-gradient(circle at 80% 70%, #94a3b8 0, transparent 35%), linear-gradient(135deg, transparent 0, transparent 45%, #94a3b8 50%, transparent 55%, transparent 100%)",
                                backgroundSize: "auto, auto, 36px 36px",
                            }}
                        />

                        {/* content */}
                        <div className="relative grid grid-cols-12">
                            {/* left content */}
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

                            {/* right ribbon */}
                            <div className="col-span-4 relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-200 to-slate-50 border-l" />
                                <div className="relative h-full flex flex-col items-center justify-center p-8">
                                    <div className="text-xs tracking-[0.35em] text-gray-600 text-center">
                                        COURSE
                                        <br />
                                        CERTIFICATE
                                    </div>

                                    {/* seal */}
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

                    {/* note */}
                    <div className="max-w-4xl mx-auto mt-3 text-xs text-gray-500">
                        Tip: If some course/exam data is missing, it’s because this preview is FE-only and uses saved config + course name.
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CertificatesPage() {
    const [courses, setCourses] = useState<Course[]>([])
    const [certs, setCerts] = useState<CertificateConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [editingId, setEditingId] = useState<string | null>(null)

    // form state
    const [courseId, setCourseId] = useState<number | "">("")
    const [certificateName, setCertificateName] = useState("")
    const [description, setDescription] = useState("")
    const [enabled, setEnabled] = useState(true)

    // preview state
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewStudentName, setPreviewStudentName] = useState("")
    const [previewCertId, setPreviewCertId] = useState<string | null>(null)

    useEffect(() => {
        const init = async () => {
            setLoading(true)
            setError("")
            try {
                const data = await courseApi.getByCreator()
                setCourses(data || [])
                const stored = loadCerts()
                setCerts(stored)
            } catch (e) {
                console.error(e)
                setError("Failed to load courses.")
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const courseNameById = useMemo(() => {
        const map = new Map<number, string>()
        courses.forEach((c) => map.set(c.Id, c.Name))
        return map
    }, [courses])

    const selectedCourseName = useMemo(() => {
        if (courseId === "") return ""
        return courseNameById.get(courseId) ?? `Course #${courseId}`
    }, [courseId, courseNameById])

    const existingForSelectedCourse = useMemo(() => {
        if (courseId === "") return null
        return certs.find((c) => c.courseId === courseId) ?? null
    }, [courseId, certs])

    const resetForm = () => {
        setEditingId(null)
        setCourseId("")
        setCertificateName("")
        setDescription("")
        setEnabled(true)
        setError("")
    }

    const startEdit = (id: string) => {
        const item = certs.find((c) => c.id === id)
        if (!item) return
        setEditingId(item.id)
        setCourseId(item.courseId)
        setCertificateName(item.certificateName)
        setDescription(item.description)
        setEnabled(item.enabled)
        setError("")
    }

    const remove = (id: string) => {
        const ok = window.confirm("Delete this certificate config?")
        if (!ok) return
        const next = certs.filter((c) => c.id !== id)
        setCerts(next)
        saveCerts(next)
        if (editingId === id) resetForm()
    }

    const upsert = () => {
        if (courseId === "") {
            setError("Please select a course.")
            return
        }
        if (!certificateName.trim()) {
            setError("Certificate name is required.")
            return
        }

        const now = new Date().toISOString()

        // FE rule: 1 certificate per course
        const conflict = certs.find((c) => c.courseId === courseId && c.id !== editingId)
        if (conflict) {
            setError("This course already has a certificate config. Please edit the existing one.")
            return
        }

        if (!editingId) {
            const newItem: CertificateConfig = {
                id: uuid(),
                courseId,
                certificateName: certificateName.trim(),
                description: description.trim(),
                enabled,
                createdAt: now,
                updatedAt: now,
            }
            const next = [newItem, ...certs]
            setCerts(next)
            saveCerts(next)
            resetForm()
            return
        }

        const next = certs.map((c) =>
            c.id === editingId
                ? {
                    ...c,
                    courseId,
                    certificateName: certificateName.trim(),
                    description: description.trim(),
                    enabled,
                    updatedAt: now,
                }
                : c,
        )
        setCerts(next)
        saveCerts(next)
        resetForm()
    }

    useEffect(() => {
        if (courseId === "" || certificateName.trim().length > 0) return
        const name = selectedCourseName
        if (name) setCertificateName(`${name} Certificate`)
    }, [courseId, selectedCourseName, certificateName])

    const openPreviewForRow = (row: CertificateConfig) => {
        setPreviewCertId(row.id)
        setPreviewOpen(true)
    }

    const openPreviewDraft = () => {

        const fakeId = editingId ?? `draft_${Date.now()}`
        setPreviewCertId(fakeId)
        setPreviewOpen(true)
    }

    const previewData = useMemo(() => {
        if (!previewCertId) return null

        const saved = certs.find((c) => c.id === previewCertId) ?? null

        const courseName =
            saved?.courseId != null
                ? courseNameById.get(saved.courseId) ?? `Course #${saved.courseId}`
                : selectedCourseName || "Course"

        const certName = (saved?.certificateName ?? certificateName.trim()) || "Certificate"


        const verifyCode = toVerifyCode(saved?.id ?? previewCertId)

        const issuedAt = formatDate(new Date())

        return { courseName, certName, verifyCode, issuedAt }
    }, [previewCertId, certs, courseNameById, selectedCourseName, certificateName])

    return (
        <div className="p-4 space-y-4">
            {/* Preview modal */}
            {previewData && (
                <CertificatePreviewModal
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    studentName={previewStudentName}
                    setStudentName={setPreviewStudentName}
                    courseName={previewData.courseName}
                    certificateName={previewData.certName}
                    verifyCode={previewData.verifyCode}
                    issuedAt={previewData.issuedAt}
                />
            )}

            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold">Manage Certificates</h1>
                    
                </div>

                <div className="flex gap-2">
                    <button className="px-3 py-2 rounded border hover:bg-slate-50" onClick={resetForm}>
                        New
                    </button>

                    <button
                        className="px-3 py-2 rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                        onClick={openPreviewDraft}
                        disabled={courseId === "" || !certificateName.trim()}
                        title="Preview current form (draft)"
                    >
                        Preview
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
            )}

            {/* Create / Edit form */}
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
                <div className="flex flex-wrap gap-3">
                    <div className="min-w-[260px] flex-1">
                        <label className="text-sm font-medium">Course</label>
                        <select
                            className="mt-1 w-full border rounded px-3 py-2"
                            value={courseId}
                            onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}
                            disabled={loading}
                        >
                            <option value="">Select a course...</option>
                            {courses.map((c) => (
                                <option key={c.Id} value={c.Id}>
                                    {c.Name}
                                </option>
                            ))}
                        </select>

                        {existingForSelectedCourse && !editingId && (
                            <p className="text-xs text-amber-600 mt-1">
                                This course already has a certificate config. Click “Edit” in the table.
                            </p>
                        )}
                    </div>

                    <div className="min-w-[260px] flex-1">
                        <label className="text-sm font-medium">Certificate name</label>
                        <input
                            className="mt-1 w-full border rounded px-3 py-2"
                            value={certificateName}
                            onChange={(e) => setCertificateName(e.target.value)}
                            placeholder="e.g. Node.js Certificate"
                        />
                    </div>

                    <div className="min-w-[200px]">
                        <label className="text-sm font-medium">Status</label>
                        <div className="mt-2 flex items-center gap-2">
                            <input
                                id="enabled"
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                            />
                            <label htmlFor="enabled" className="text-sm">
                                Enabled
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                        onClick={upsert}
                        disabled={loading || courseId === "" || (!!existingForSelectedCourse && !editingId)}
                    >
                        {editingId ? "Save changes" : "Create certificate"}
                    </button>
                    <button className="px-4 py-2 rounded border hover:bg-slate-50" onClick={resetForm}>
                        Cancel
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-semibold mb-3">Certificate configs</h2>

                {loading ? (
                    <p className="text-gray-600">Loading...</p>
                ) : certs.length === 0 ? (
                    <p className="text-gray-600">No certificates yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-left border-b">
                                    <th className="py-2 pr-3">Course</th>
                                    <th className="py-2 pr-3">Certificate name</th>
                                    <th className="py-2 pr-3">Status</th>
                                    <th className="py-2 pr-3">Updated</th>
                                    <th className="py-2 pr-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {certs.map((c) => (
                                    <tr key={c.id} className="border-b">
                                        <td className="py-2 pr-3">{courseNameById.get(c.courseId) ?? `Course #${c.courseId}`}</td>
                                        <td className="py-2 pr-3">{c.certificateName}</td>
                                        <td className="py-2 pr-3">
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${c.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                                    }`}
                                            >
                                                {c.enabled ? "Enabled" : "Disabled"}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-3 text-sm text-gray-600">{new Date(c.updatedAt).toLocaleString()}</td>
                                        <td className="py-2 pr-3">
                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    className="px-3 py-1 rounded bg-slate-900 text-white hover:bg-slate-800"
                                                    onClick={() => openPreviewForRow(c)}
                                                >
                                                    Preview
                                                </button>
                                                <button
                                                    className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                                                    onClick={() => startEdit(c.id)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                                                    onClick={() => remove(c.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-3 text-xs text-gray-500">
                            Preview uses student name you type in the modal. Verification is FE-only (local code).
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
