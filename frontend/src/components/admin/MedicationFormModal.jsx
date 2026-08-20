import { useEffect, useState } from 'react'

import {
  CatalogModal,
  FormError,
  FormField,
  ModalFooter,
  StatusField,
} from './CatalogTableParts'
import { getFieldError } from './formErrorUtils'

export function MedicationFormModal({ error, isSaving, routeOptions, onClose, onSubmit }) {
  const [form, setForm] = useState({
    code: '',
    name: '',
    active_ingredient: '',
    strength: '',
    dosage_form: '',
    unit: '',
    route: 'oral',
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
      active_ingredient: form.active_ingredient.trim(),
      strength: form.strength.trim(),
      dosage_form: form.dosage_form.trim(),
      unit: form.unit.trim(),
      route: form.route,
      active: form.active,
    })
  }

  return (
    <CatalogModal
      title="Thêm thuốc mới"
      description="Nhập thông tin thuốc dùng khi kê đơn."
      labelledBy="medication-modal-title"
      onClose={onClose}
    >
      <form className="user-form" onSubmit={handleSubmit}>
        {error && <FormError error={error} fallback="Không thể lưu thuốc." />}
        <div className="user-form__grid">
          <FormField label="Mã thuốc" error={getFieldError(error, 'code')}>
            <input name="code" value={form.code} required autoFocus onChange={updateField} />
          </FormField>
          <FormField label="Tên thuốc" error={getFieldError(error, 'name')}>
            <input name="name" value={form.name} required onChange={updateField} />
          </FormField>
          <FormField label="Hoạt chất" error={getFieldError(error, 'active_ingredient')}>
            <input name="active_ingredient" value={form.active_ingredient} required onChange={updateField} />
          </FormField>
          <FormField label="Hàm lượng" error={getFieldError(error, 'strength')}>
            <input name="strength" value={form.strength} required placeholder="500mg" onChange={updateField} />
          </FormField>
          <FormField label="Dạng bào chế" error={getFieldError(error, 'dosage_form')}>
            <input name="dosage_form" value={form.dosage_form} required placeholder="Viên nén" onChange={updateField} />
          </FormField>
          <FormField label="Đơn vị" error={getFieldError(error, 'unit')}>
            <input name="unit" value={form.unit} required placeholder="viên" onChange={updateField} />
          </FormField>
          <FormField label="Đường dùng" error={getFieldError(error, 'route')}>
            <select name="route" value={form.route} onChange={updateField}>
              {routeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormField>
          <StatusField
            checked={form.active}
            name="active"
            title="Thuốc hoạt động"
            hint="Cho phép chọn thuốc này khi kê đơn"
            onChange={updateField}
          />
        </div>
        <ModalFooter isSaving={isSaving} saveLabel="Tạo thuốc" onClose={onClose} />
      </form>
    </CatalogModal>
  )
}
