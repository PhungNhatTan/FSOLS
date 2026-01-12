import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import client from "../../service/client"

type CertificateData = {
  Id: number
  Account: {
    Id: string
    DisplayName: string
  }
  Certificate: {
    Id: number
    CertificateType: "Course" | "Specialization"
    Course?: {
      Id: number
      Name: string
    }
    Specialization?: {
      Id: number
      SpecializationName: string
    }
  }
}

function toVerifyCode(id: number): string {
  // Generate verification code from certificate ID
  const code = id.toString().padStart(10, "0")
  return `FSOLS${code}`
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })
}

export default function CertificatePage() {
  const { accountId, certificateId } = useParams<{ accountId: string; certificateId: string }>()
  const [certificate, setCertificate] = useState<CertificateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!accountId || !certificateId) return

    const fetchCertificate = async () => {
      try {
        setLoading(true)
        setError("")
        const response = await client.get<CertificateData>(
          `/certificate/${accountId}/${certificateId}`
        )
        setCertificate(response.data)
      } catch (err: unknown) {
        console.error(err)
        setError(err ? (err as Error).message : "Failed to load certificate")
      } finally {
        setLoading(false)
      }
    }

    fetchCertificate()
  }, [accountId, certificateId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">Loading certificate...</div>
        </div>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold mb-2">Certificate Not Found</h1>
            <p className="text-gray-600 mb-4">
              {error || "The certificate you're looking for doesn't exist or has been removed."}
            </p>
            <Link
              to="/courses"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const studentName = certificate.Account.DisplayName
  const certificateType = certificate.Certificate.CertificateType
  const courseName =
    certificateType === "Course"
      ? certificate.Certificate.Course?.Name || "Course"
      : certificate.Certificate.Specialization?.SpecializationName || "Specialization"
  const verifyCode = toVerifyCode(certificate.Certificate.Id)
  const issuedAt = formatDate(new Date())

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Course Certificate</h1>
            <p className="text-gray-600">Congratulations on completing the course!</p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <span>🖨️</span>
            Print Certificate
          </button>
        </div>

        {/* Certificate */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden print:shadow-none">
          <div className="relative">
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-[0.10]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, #94a3b8 0, transparent 35%), radial-gradient(circle at 80% 70%, #94a3b8 0, transparent 35%), linear-gradient(135deg, transparent 0, transparent 45%, #94a3b8 50%, transparent 55%, transparent 100%)",
                backgroundSize: "auto, auto, 36px 36px",
              }}
            />

            {/* Content */}
            <div className="relative grid grid-cols-12">
              {/* Left content */}
              <div className="col-span-8 p-10 lg:p-14">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-2xl tracking-wide">
                    <span className="text-blue-600">F</span>
                    <span className="text-red-600">S</span>
                    <span className="text-yellow-600">O</span>
                    <span className="text-green-600">L</span>
                    <span className="text-slate-900">S</span>
                  </div>
                  <div className="text-sm text-gray-600">{issuedAt}</div>
                </div>

                <div className="mt-12 text-xs tracking-[0.3em] text-gray-500 uppercase">
                  {certificateType} Certificate
                </div>

                <div className="mt-6 text-4xl lg:text-5xl font-serif tracking-wide text-gray-900">
                  {studentName}
                </div>

                <div className="mt-4 text-gray-700 text-lg">has successfully completed</div>

                <div className="mt-3 text-2xl font-semibold text-gray-900">{courseName}</div>
                <div className="mt-2 text-gray-700">
                  {certificateType === "Course" ? "Course Certificate" : "Specialization Certificate"}
                </div>

                <div className="mt-10 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-sm">
                    ✓
                  </span>
                  <span className="text-gray-800 font-medium">Verified by FSOLS</span>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-10 text-sm text-gray-700">
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

                <div className="mt-10 text-xs text-gray-600">
                  Verify at:{" "}
                  {/* <span className="font-mono text-gray-800">
                    {window.location.origin}/certificate/{accountId}/{certificateId}
                  </span> */}
                </div>
              </div>

              {/* Right ribbon */}
              <div className="col-span-4 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-200 to-slate-50 border-l" />
                <div className="relative h-full flex flex-col items-center justify-center p-8">
                  <div className="text-xs tracking-[0.35em] text-gray-600 text-center">
                    {certificateType.toUpperCase()}
                    <br />
                    CERTIFICATE
                  </div>

                  {/* Seal */}
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
                    <div className="mt-1 font-mono text-gray-800 text-sm">{verifyCode}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="mt-6 bg-white rounded-lg shadow p-6 print:hidden">
          <h2 className="font-semibold mb-3">Certificate Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Student Name</div>
              <div className="font-medium">{studentName}</div>
            </div>
            <div>
              <div className="text-gray-600">{certificateType} Name</div>
              <div className="font-medium">{courseName}</div>
            </div>
            <div>
              <div className="text-gray-600">Certificate Type</div>
              <div className="font-medium">{certificateType}</div>
            </div>
            <div>
              <div className="text-gray-600">Verification Code</div>
              <div className="font-mono font-medium">{verifyCode}</div>
            </div>
            <div>
              <div className="text-gray-600">Issue Date</div>
              <div className="font-medium">{issuedAt}</div>
            </div>
            <div>
              <div className="text-gray-600">Certificate ID</div>
              <div className="font-medium">#{certificate.Certificate.Id}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3 print:hidden">
          <Link
            to="/courses"
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            ← Back to Courses
          </Link>
          {certificateType === "Course" && certificate.Certificate.Course && (
            <Link
              to={`/course/${certificate.Certificate.Course.Id}`}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View Course
            </Link>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}