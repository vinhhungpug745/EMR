import { ChevronLeft, ChevronRight } from 'lucide-react'


export function PaginationFooter({
  count,
  entityLabel,
  page,
  pageSize,
  previous,
  next,
  onPageChange,
}) {
  if (count <= 0) return null

  const pageCount = Math.max(1, Math.ceil(count / pageSize))
  const startRow = (page - 1) * pageSize + 1
  const endRow = Math.min(page * pageSize, count)

  return (
    <footer className="users-pagination">
      <span>
        Hiển thị {startRow}-{endRow}
        {' '}trong {count} {entityLabel}
      </span>
      <div>
        <button
          className="icon-button"
          type="button"
          aria-label="Trang trước"
          disabled={!previous}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <strong>{page} / {pageCount}</strong>
        <button
          className="icon-button"
          type="button"
          aria-label="Trang sau"
          disabled={!next}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </footer>
  )
}
