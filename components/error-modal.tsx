'use client'

interface ErrorModalProps {
  show: boolean
  onClose: () => void
}

export function ErrorModal({ show, onClose }: ErrorModalProps) {
  if (!show) return null

  return (
    <div
      className={`modal-overlay ${show ? 'show' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">
            <span className="me-2">😊</span>
            Oops—almost there!
          </h3>

          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <p>
            <strong>Please check the following requirements:</strong>
          </p>
          <ul>
            <li>
              <strong>Bookmark Name:</strong>
              <ul>
                <li>Must be at least 3 characters long</li>
                <li>Only letters, numbers, and spaces allowed</li>
                <li>Cannot start or end with spaces</li>
              </ul>
            </li>
            <li>
              <strong>Website URL:</strong>
              <ul>
                <li>Must be a valid URL format</li>
                <li>Will automatically add https:// if missing</li>
              </ul>
            </li>
            <li>
              <strong>Category:</strong>
              <ul>
                <li>Please select an existing category or create a new one</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
