"use client"

import type React from "react"

// src/hooks/useFetch.ts
import { useState, useEffect, useCallback } from "react"

export function useFetch<T>(fetchFn: (() => Promise<T>) | null, deps: React.DependencyList = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [reloadFlag, setReloadFlag] = useState<number>(0)

  useEffect(() => {
    if (!fetchFn) return

    let isMounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await fetchFn()
        if (isMounted) {
          setData(result)
          setError("")
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load data.")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void fetchData()

    return () => {
      isMounted = false
    }
  }, [fetchFn, reloadFlag, ...deps])

  const refetch = useCallback(() => {
    setReloadFlag((prev) => prev + 1)
  }, [])

  return { data, error, loading, refetch }
}
