import { useEffect, useState } from 'react'

import {
  CatalogModal,
  FormError,
  FormField,
  ModalFooter,
  StatusField,
} from './CatalogTableParts'
import { getFieldError } from './formErrorUtils'

export function LabTestFormModal({ error, isSaving, onClose, onSubmit }) {
  const [form, setForm] = useState({
    code: '',
    name: '',
    category: '',
    specimen_type: '',
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
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      code: form.code.trim(),
      name: form.name.trim(),
      category: form.category.trim() || null,
      specimen_type: form.specimen_type.trim() || null,
      description: form.description.trim() || null,
      active: form.active,
    })
  }

  return (
    <CatalogModal
      title="Thêm xét nghiệm mới"
      description="Nhập thông tin xét nghiệm dùng khi bác sĩ chỉ định."
      labelledBy="lab-test-modal-title"
      onClose={onClose}
    >
      <form className="user-form" onSubmit={handleSubmit}>
        {error && <FormError error={error} fallback="Không thể lưu xét nghiệm." />}
        <div className="user-form__grid">
          <FormField label="Mã xét nghiệm" error={getFieldError(error, 'code')}>
            <input name="code" value={form.code} required autoFocus onChange={updateField} />
          </FormField>
          <FormField label="Tên xét nghiệm" error={getFieldError(error, 'name')}>
            <input name="name" value={form.name} required onChange={updateField} />
          </FormField>
          <FormField label="Nhóm xét nghiệm" error={getFieldError(error, 'category')}>
            <input name="category" value={form.category} placeholder="Huyết học" onChange={updateField} />
          </FormField>
          <FormField label="Mẫu bệnh phẩm" error={getFieldError(error, 'specimen_type')}>
            <input name="specimen_type" value={form.specimen_type} placeholder="Máu" onChange={updateField} />
          </FormField>
          <StatusField
            checked={form.active}
            name="active"
            title="Xét nghiệm hoạt động"
            hint="Cho phép chọn xét nghiệm này khi chỉ định"
            onChange={updateField}
          />
          <FormField label="Mô tả" error={getFieldError(error, 'description')} wide>
            <textarea name="description" value={form.description} rows={4} onChange={updateField} />
          </FormField>
        </div>
        <ModalFooter isSaving={isSaving} saveLabel="Tạo xét nghiệm" onClose={onClose} />
      </form>
    </CatalogModal>
  )
}
