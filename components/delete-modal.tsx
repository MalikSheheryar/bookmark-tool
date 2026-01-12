"use client"

interface DeleteModalProps {
  show: boolean
  onClose: () => void
  onConfirm: () => void
  type: "category" | "bookmark" | null
  target: any
  bookmarkCount?: number
}

export function DeleteModal({ show, onClose, onConfirm, type, target, bookmarkCount = 0 }: DeleteModalProps) {
  if (!show) return null

  const getMessage = () => {
    if (type === "category") {
      return `Are you sure you want to delete the category "${target}" and all its ${bookmarkCount} bookmarks? This action cannot be undone.`
    } else if (type === "bookmark") {
      return `Are you sure you want to delete the bookmark "${target?.name || "this bookmark"}"? This action cannot be undone.`
    }
    return ""
  }

  return (
    <div
      className={`modal-overlay ${show ? "show" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">
            <i className="fa-solid fa-triangle-exclamation me-2"></i>
            Confirm Delete
          </h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <p>{getMessage()}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            <i className="fa-solid fa-times me-2"></i>Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            <i className="fa-solid fa-trash me-2"></i>Delete
          </button>
        </div>
      </div>
    </div>
  )
}
