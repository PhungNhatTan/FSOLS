'use client'

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import enrollmentApi, { EnrollmentStatusResponse } from '../../../api/enrollment'
import { useAuth } from '../../../hooks/useAuth'

interface EnrollButtonProps {
  courseId: number
  onEnrollmentChange?: (isEnrolled: boolean) => void
}

function formatDurationHMS(totalSeconds: number) {
  const s = Math.max(0, Math.trunc(totalSeconds))
  const hh = Math.floor(s / 3600)
  const mm = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`
}

function secondsUntil(date: Date) {
  const ms = date.getTime() - Date.now()
  if (ms <= 0) return 0
  return Math.ceil(ms / 1000)
}

export default function EnrollButton({ courseId, onEnrollmentChange }: EnrollButtonProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [error, setError] = useState('')

  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const [canEnrollAt, setCanEnrollAt] = useState<Date | null>(null)
  const [cooldownLeft, setCooldownLeft] = useState<number | null>(null)

  const applyStatus = (status: EnrollmentStatusResponse) => {
    setIsEnrolled(Boolean(status.isEnrolled))

    const exp = status.expiresAt ? new Date(status.expiresAt) : null
    const cea = status.canEnrollAt ? new Date(status.canEnrollAt) : null

    setExpiresAt(exp)
    setTimeLeft(exp && status.isEnrolled ? secondsUntil(exp) : null)

    setCanEnrollAt(cea)
    setCooldownLeft(cea && !status.isEnrolled ? secondsUntil(cea) : null)
  }

  const checkEnrollmentStatus = async () => {
    try {
      setIsCheckingStatus(true)
      const response = await enrollmentApi.getStatus(courseId)
      applyStatus(response)
    } catch (err) {
      console.error('Failed to check enrollment status:', err)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  useEffect(() => {
    if (user) {
      checkEnrollmentStatus()
    } else {
      setIsCheckingStatus(false)
      setIsEnrolled(false)
      setExpiresAt(null)
      setTimeLeft(null)
      setCanEnrollAt(null)
      setCooldownLeft(null)
    }
   
  }, [user, courseId])

  // Local countdown for nicer UX.
  useEffect(() => {
    if (!user) return

    const t = setInterval(() => {
      if (expiresAt && isEnrolled) {
        const left = secondsUntil(expiresAt)
        setTimeLeft(left)
        if (left <= 0) {
          // Re-sync (server will have kicked / computed cooldown).
          checkEnrollmentStatus()
        }
      }
      if (canEnrollAt && !isEnrolled) {
        const left = secondsUntil(canEnrollAt)
        setCooldownLeft(left)
        if (left <= 0) {
          setCanEnrollAt(null)
          setCooldownLeft(null)
        }
      }
    }, 1000)

    return () => clearInterval(t)
    
  }, [user, expiresAt, canEnrollAt, isEnrolled])

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/courses/${courseId}` } })
      return
    }

    try {
      setIsLoading(true)
      setError('')
      await enrollmentApi.enroll(courseId)
      onEnrollmentChange?.(true)
      await checkEnrollmentStatus()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || (err instanceof Error ? err.message : 'Failed to enroll'))
      await checkEnrollmentStatus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnenroll = async () => {
    try {
      setIsLoading(true)
      setError('')
      await enrollmentApi.unenroll(courseId)
      onEnrollmentChange?.(false)
      await checkEnrollmentStatus()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || (err instanceof Error ? err.message : 'Failed to unenroll'))
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingStatus) {
    return (
      <button
        disabled
        className='w-full px-6 py-3 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed'
      >
        Loading...
      </button>
    )
  }

  const isCooldownActive = !isEnrolled && Boolean(cooldownLeft && cooldownLeft > 0)

  return (
    <div className='space-y-2'>
      {error && (
        <div className='p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded'>
          {error}
        </div>
      )}

      {isEnrolled ? (
        <div className='space-y-2'>
          <div className='flex items-center justify-between gap-2 p-3 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex items-center gap-2'>
              <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
              <span className='text-green-700 font-medium'>Enrolled</span>
            </div>
            {timeLeft !== null && timeLeft > 0 && (
              <span className='text-xs font-medium text-green-700'>Time left: {formatDurationHMS(timeLeft)}</span>
            )}
          </div>

          <button
            onClick={handleUnenroll}
            disabled={isLoading}
            className='w-full px-6 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? 'Processing...' : 'Unenroll from Course'}
          </button>
        </div>
      ) : (
        <div className='space-y-2'>
          <button
            onClick={handleEnroll}
            disabled={isLoading || isCooldownActive}
            className='w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading
              ? 'Enrolling...'
              : user
                ? isCooldownActive
                  ? `Enroll locked (${formatDurationHMS(cooldownLeft || 0)})`
                  : 'Enroll in Course'
                : 'Sign in to Enroll'}
          </button>

          {isCooldownActive && (
            <div className='p-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded'>
              You can enroll again in {formatDurationHMS(cooldownLeft || 0)}.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
