interface ToastProps {
  show: boolean
  message: string
  type: "success" | "error"
}

export function Toast({ show, message, type }: ToastProps) {
  return (
    <div className={`toast-notification ${type} ${show ? "show" : ""}`}>
      <i className={`fa-solid ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"} me-2`}></i>
      <span>{message}</span>
    </div>
  )
}
