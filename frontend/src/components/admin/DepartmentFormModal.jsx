import { useEffect, useState } from 'react'

import {
  CatalogModal,
  FormError,
  FormField,
  ModalFooter,
  StatusField,
} from './CatalogTableParts'
import { getFieldError } from './formErrorUtils'

export function DepartmentFormModal({ error, isSaving, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    active: true,
  })

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSaving, onClose])

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || null,
      active: form.active,
    })
  }

  return (
    <CatalogModal
      title="Thêm khoa mới"
      description="Nhập thông tin của khoa."
      labelledBy="department-modal-title"
      onClose={onClose}
    >
      <form className="user-form" onSubmit={handleSubmit}>
        {error && <FormError error={error} fallback="Không thể lưu khoa." />}

        <div className="user-form__grid">
          <FormField label="Tên khoa" error={getFieldError(error, 'name')}>
            <input name="name" value={form.name} required autoFocus onChange={updateField} />
          </FormField>

          <StatusField
            checked={form.active}
            name="active"
            title="Khoa hoạt động"
            hint="Cho phép chọn khoa này trong các nghiệp vụ"
            onChange={updateField}
          />

          <FormField label="Mô tả" error={getFieldError(error, 'description')} wide>
            <textarea
              name="description"
              value={form.description}
              rows={4}
              placeholder="Ví dụ: Tiếp nhận và điều trị các ca cấp cứu trong bệnh viện"
              onChange={updateField}
            />
          </FormField>
        </div>

        <ModalFooter isSaving={isSaving} saveLabel="Tạo khoa" onClose={onClose} />
      </form>
    </CatalogModal>
  )
}
