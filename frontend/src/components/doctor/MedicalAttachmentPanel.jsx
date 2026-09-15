import { useEffect, useRef, useState } from 'react'
import { Download, FileUp, Paperclip, Trash2, Upload } from 'lucide-react'

import {
  createMedicalAttachment,
  deleteMedicalAttachment,
  downloadMedicalAttachment,
  getMedicalAttachments,
} from '../../api/medicalAttachments'

const ACCEPTED_FILES = '.pdf,.png,.jpg,.jpeg,.doc,.docx'

export default function MedicalAttachmentPanel({
  encounterId,
  labTestId = null,
  readOnly,
  onNotify,
}) {
  const fileInputRef = useRef(null)
  const notifyRef = useRef(onNotify)
  const [attachments, setAttachments] = useState([])
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    notifyRef.current = onNotify
  }, [onNotify])

  useEffect(() => {
    let isCurrent = true
    getMedicalAttachments({
      encounter: encounterId,
      labTest: labTestId,
      pageSize: 100,
    })
      .then((data) => {
        if (isCurrent) setAttachments(data.results ?? data ?? [])
      })
      .catch(() => notifyRef.current?.('error', 'Không thể tải danh sách tệp đính kèm.'))
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => { isCurrent = false }
  }, [encounterId, labTestId])

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile && !title.trim()) {
      setTitle(selectedFile.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!file || !title.trim()) {
      notifyRef.current?.('error', 'Vui lòng chọn tệp và nhập tiêu đề.')
      return
    }
    setIsSubmitting(true)
    try {
      const created = await createMedicalAttachment({
        encounter: encounterId,
        lab_test: labTestId,
        title: title.trim(),
        description: description.trim(),
        file,
      })
      setAttachments((current) => [created, ...current])
      setFile(null)
      setTitle('')
      setDescription('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      notifyRef.current?.('success', 'Đã tải tệp lên hồ sơ bệnh án.')
    } catch (error) {
      notifyRef.current?.('error', getAttachmentError(error, 'Không thể tải tệp lên.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = async (attachment) => {
    try {
      const blob = await downloadMedicalAttachment(attachment.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.file_name || attachment.title
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      notifyRef.current?.('error', getAttachmentError(error, 'Không thể tải tệp xuống.'))
    }
  }

  const handleDelete = async (attachment) => {
    if (!window.confirm(`Xóa tệp “${attachment.title}”?`)) return
    try {
      await deleteMedicalAttachment(attachment.id)
      setAttachments((current) => current.filter((item) => item.id !== attachment.id))
      notifyRef.current?.('success', 'Đã xóa tệp đính kèm.')
    } catch (error) {
      notifyRef.current?.('error', getAttachmentError(error, 'Không thể xóa tệp.'))
    }
  }

  return (
    <section className="exam-panel attachment-panel">
      <div className="exam-panel__header">
        <div className="exam-panel__title">
          <Paperclip size={18} />
          <h2>{labTestId ? 'Tệp kết quả xét nghiệm' : 'Tệp đính kèm y tế'}</h2>
        </div>
        <span>PDF, ảnh hoặc tài liệu · tối đa 10 MB</span>
      </div>

      {!readOnly && (
        <form className="attachment-form" onSubmit={handleUpload}>
          <label className="attachment-file-picker">
            <FileUp size={20} />
            <span>{file?.name || 'Chọn tệp từ thiết bị'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILES}
              onChange={handleFileChange}
            />
          </label>
          <input
            type="text"
            value={title}
            maxLength={160}
            placeholder="Tiêu đề tệp"
            onChange={(event) => setTitle(event.target.value)}
          />
          <input
            type="text"
            value={description}
            placeholder="Mô tả (không bắt buộc)"
            onChange={(event) => setDescription(event.target.value)}
          />
          <button type="submit" className="exam-save-button" disabled={isSubmitting}>
            <Upload size={16} />
            {isSubmitting ? 'Đang tải...' : 'Tải lên'}
          </button>
        </form>
      )}

      <div className="attachment-list">
        {isLoading && <p className="attachment-empty">Đang tải tệp đính kèm...</p>}
        {!isLoading && !attachments.length && (
          <p className="attachment-empty">
            {labTestId
              ? 'Chưa có tệp kết quả cho xét nghiệm này.'
              : 'Chưa có tệp đính kèm cho lượt khám này.'}
          </p>
        )}
        {attachments.map((attachment) => (
          <article className="attachment-item" key={attachment.id}>
            <Paperclip size={18} />
            <div>
              <strong>{attachment.title}</strong>
              <span>
                {attachment.file_name}
                {attachment.file_size ? ` · ${formatFileSize(attachment.file_size)}` : ''}
              </span>
              {attachment.lab_test_detail && (
                <p>Xét nghiệm: {attachment.lab_test_detail.name}</p>
              )}
              {attachment.description && <p>{attachment.description}</p>}
            </div>
            <button type="button" title="Tải xuống" onClick={() => handleDownload(attachment)}>
              <Download size={16} />
            </button>
            {!readOnly && (labTestId || !attachment.lab_test) && (
              <button
                type="button"
                className="attachment-delete"
                title="Xóa tệp"
                onClick={() => handleDelete(attachment)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getAttachmentError(error, fallback) {
  if (!error?.data || typeof error.data !== 'object') return error?.message || fallback
  const value = Object.values(error.data)[0]
  return Array.isArray(value) ? value[0] : value || fallback
}
