import { useCallback, useState } from 'react'

import { useSnackbar } from './useSnackbar'

export function useStatusToggle({
  updateStatus,
  getId = (item) => item.id,
  getName = (item) => item.name || item.username,
  getCurrentStatus = (item) => item.active,
  onSuccess,
  getConfirmMessage,
  getSuccessMessage,
  errorFallback = 'Không thể cập nhật trạng thái.',
}) {
  const [pendingStatusChange, setPendingStatusChange] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const {
    snackbar,
    showSnackbar,
    clearSnackbar,
  } = useSnackbar()

  const requestStatusChange = useCallback((item) => {
    const nextActive = !getCurrentStatus(item)
    const name = getName(item)

    setPendingStatusChange({ item, nextActive })
    showSnackbar({
      type: 'confirm',
      message: getConfirmMessage
        ? getConfirmMessage(item, nextActive)
        : `Chuyển ${name} sang ${nextActive ? 'đang hoạt động' : 'ngưng hoạt động'}?`,
    })
  }, [getConfirmMessage, getCurrentStatus, getName, showSnackbar])

  const cancelStatusChange = useCallback(() => {
    setPendingStatusChange(null)
    clearSnackbar()
  }, [clearSnackbar])

  const confirmStatusChange = useCallback(async () => {
    if (!pendingStatusChange) return

    const { item, nextActive } = pendingStatusChange
    const itemId = getId(item)

    setUpdatingId(itemId)
    clearSnackbar()

    try {
      const updatedItem = await updateStatus(item, nextActive)
      await onSuccess?.(item, updatedItem, nextActive)
      showSnackbar({
        type: 'success',
        message: getSuccessMessage
          ? getSuccessMessage(item, nextActive)
          : `Đã cập nhật trạng thái ${getName(item)}.`,
      })
    } catch (error) {
      showSnackbar({
        type: 'error',
        message: error.message || errorFallback,
      })
    } finally {
      setUpdatingId(null)
      setPendingStatusChange(null)
    }
  }, [
    clearSnackbar,
    errorFallback,
    getId,
    getName,
    getSuccessMessage,
    onSuccess,
    pendingStatusChange,
    showSnackbar,
    updateStatus,
  ])

  return {
    snackbar,
    showSnackbar,
    clearSnackbar,
    pendingStatusChange,
    updatingId,
    requestStatusChange,
    cancelStatusChange,
    confirmStatusChange,
  }
}
