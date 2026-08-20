import { useCallback, useEffect, useState } from 'react'

const DEFAULT_PAGE_SIZE = 8
const DEFAULT_DELAY = 350

export function usePaginatedResource({
  fetchPage,
  resetKey = '',
  pageSize = DEFAULT_PAGE_SIZE,
  delay = DEFAULT_DELAY,
  errorFallback = 'Không thể tải dữ liệu.',
}) {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await fetchPage({ page, pageSize })
      setItems(data.results || [])
      setPagination({
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
      })
    } catch (error) {
      setErrorMessage(error.message || errorFallback)
    } finally {
      setIsLoading(false)
    }
  }, [errorFallback, fetchPage, page, pageSize])

  useEffect(() => {
    const timer = window.setTimeout(() => setPage(1), 0)
    return () => window.clearTimeout(timer)
  }, [resetKey])

  useEffect(() => {
    const timer = window.setTimeout(loadItems, delay)
    return () => window.clearTimeout(timer)
  }, [delay, loadItems])

  return {
    items,
    setItems,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    setErrorMessage,
    loadItems,
  }
}
