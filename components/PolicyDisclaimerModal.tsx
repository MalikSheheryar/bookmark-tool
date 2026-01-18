import React, { useState, useEffect } from 'react'
import { CheckCircle, X, Loader2 } from 'lucide-react'

interface PolicyDisclaimerModalProps {
  show: boolean
  onClose: () => void
  onAccept: () => Promise<void>
  isProcessing?: boolean
}

export function PolicyDisclaimerModal({
  show,
  onClose,
  onAccept,
  isProcessing = false,
}: PolicyDisclaimerModalProps) {
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (show) {
      setAccepted(false)
      setError(null)
    }
  }, [show])

  const handleAccept = async () => {
    if (!accepted || isProcessing) return

    try {
      setError(null)
      await onAccept()
    } catch (err: any) {
      console.error('Policy acceptance error:', err)
      setError(err.message || 'An error occurred. Please try again.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && accepted && !isProcessing) {
      handleAccept()
    } else if (e.key === 'Escape' && !isProcessing) {
      onClose()
    }
  }

  if (!show) return null

  return (
    <>
      <style jsx>{`
        :root {
          --main-color: #5f462d;
          --secondary-color: #f5f5dc;
          --accent-light: rgba(95, 70, 45, 0.1);
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.2);
          --border-radius: 12px;
        }

        .policy-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .policy-modal {
          background: white;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-lg);
          width: 90%;
          max-width: 750px;
          animation: slideUp 0.3s ease;
          border: 1px solid #e9ecef;
          overflow: hidden;
          display: grid;
          grid-template-rows: auto 1fr auto;
          max-height: 90vh;
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .policy-header {
          background: linear-gradient(
            135deg,
            #654321 0%,
            #8b4513 50%,
            #a0522d 100%
          );
          color: var(--secondary-color);
          padding: 18px 28px;
          text-align: center;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-content {
          flex: 1;
        }

        .policy-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .policy-subtitle {
          font-size: 13px;
          opacity: 0.85;
          margin: 2px 0 0 0;
          font-weight: 400;
        }

        .close-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(245, 245, 220, 0.2);
          border: none;
          color: var(--secondary-color);
          width: 36px;
          height: 36px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }

        .close-btn:hover:not(:disabled) {
          background: rgba(245, 245, 220, 0.3);
          transform: translateY(-50%) scale(1.1);
        }

        .close-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .policy-body {
          padding: 24px 28px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .policy-body::-webkit-scrollbar {
          width: 6px;
        }

        .policy-body::-webkit-scrollbar-track {
          background: #f8f9fa;
        }

        .policy-body::-webkit-scrollbar-thumb {
          background: var(--main-color);
          border-radius: 3px;
        }

        .policy-intro {
          background: var(--accent-light);
          border-left: 4px solid var(--main-color);
          border-radius: 8px;
          padding: 14px 16px;
        }

        .policy-intro p {
          margin: 0;
          font-size: 14px;
          color: var(--main-color);
          line-height: 1.5;
          font-weight: 500;
        }

        .policies-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .policy-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          transition: var(--transition);
        }

        .policy-item:hover {
          background: white;
          border-color: var(--main-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .policy-item-icon {
          width: 22px;
          height: 22px;
          min-width: 22px;
          background: var(--main-color);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          margin-top: 1px;
          flex-shrink: 0;
        }

        .policy-item-text {
          font-size: 13px;
          color: #495057;
          line-height: 1.5;
          margin: 0;
        }

        .policy-item-text strong {
          color: var(--main-color);
          font-weight: 600;
        }

        .acceptance-box {
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          padding: 16px;
          transition: var(--transition);
        }

        .acceptance-box.checked {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
        }

        .checkbox-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          user-select: none;
        }

        .custom-checkbox {
          position: relative;
          width: 24px;
          height: 24px;
          min-width: 24px;
          margin-top: 2px;
        }

        .checkbox-input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .checkbox-visual {
          width: 24px;
          height: 24px;
          border: 2px solid #d1d5db;
          border-radius: 6px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
          cursor: pointer;
        }

        .checkbox-input:checked + .checkbox-visual {
          background: #22c55e;
          border-color: #22c55e;
        }

        .checkbox-icon {
          color: white;
          opacity: 0;
          transition: var(--transition);
        }

        .checkbox-input:checked + .checkbox-visual .checkbox-icon {
          opacity: 1;
        }

        .acceptance-text {
          flex: 1;
          font-size: 13px;
          color: #495057;
          line-height: 1.5;
          font-weight: 500;
          cursor: pointer;
        }

        .acceptance-box.checked .acceptance-text {
          color: #22c55e;
        }

        .disclaimer-text {
          font-size: 12px;
          color: #6c757d;
          font-style: italic;
          line-height: 1.4;
          margin-top: 12px;
          text-align: center;
        }

        .error-message {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fee;
          color: #c33;
          border: 1px solid #fcc;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .policy-footer {
          padding: 16px 28px;
          background: #f8f9fa;
          border-top: 1px solid #e9ecef;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          padding: 10px 28px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: var(--transition);
          border: none;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
        }

        .btn-cancel {
          background: white;
          color: #6c757d;
          border: 2px solid #e9ecef;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #f8f9fa;
          border-color: #ced4da;
        }

        .btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-accept {
          background: var(--main-color);
          color: var(--secondary-color);
          box-shadow: 0 4px 12px rgba(95, 70, 45, 0.3);
          min-width: 180px;
        }

        .btn-accept:hover:not(:disabled) {
          background: #7a621f;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(95, 70, 45, 0.4);
        }

        .btn-accept:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
          opacity: 0.6;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 640px) {
          .policy-modal {
            width: 95%;
            max-height: 85vh;
          }

          .policy-header {
            padding: 16px 20px;
          }

          .policy-title {
            font-size: 22px;
          }

          .close-btn {
            width: 32px;
            height: 32px;
            right: 12px;
          }

          .policy-body {
            padding: 18px 20px;
            gap: 12px;
          }

          .policy-footer {
            padding: 14px 20px;
            flex-direction: column-reverse;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>

      <div
        className="policy-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isProcessing) onClose()
        }}
      >
        <div className="policy-modal" onKeyDown={handleKeyDown}>
          <div className="policy-header">
            <div className="header-content">
              <h2 className="policy-title">Community Guidelines</h2>
            </div>
            <button
              className="close-btn"
              onClick={onClose}
              disabled={isProcessing}
            >
              <X size={20} />
            </button>
          </div>

          <div className="policy-body">
            <div className="policy-intro">
              <p>Please review before publishing</p>
            </div>
            <div className="policy-intro">
              <p>
                Please ensure your categories follow these guidelines to help
                keep the community safe and respectful for everyone.
              </p>
            </div>

            <ul className="policies-list">
              <li className="policy-item">
                <p className="policy-item-text">
                  <strong>No policy violations</strong> - Do not share illegal,
                  deceptive, or harmful content.
                </p>
              </li>
              <li className="policy-item">
                <p className="policy-item-text">
                  <strong>Respect intellectual property</strong> - Only share
                  links to content you have the right to share.
                </p>
              </li>
              <li className="policy-item">
                <p className="policy-item-text">
                  <strong>No inappropriate content</strong> - Keep categories
                  appropriate and safe for all audiences.
                </p>
              </li>
            </ul>

            <div className={`acceptance-box ${accepted ? 'checked' : ''}`}>
              <label className="checkbox-wrapper">
                <div className="custom-checkbox">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    disabled={isProcessing}
                  />
                  <div className="checkbox-visual">
                    <CheckCircle className="checkbox-icon" size={14} />
                  </div>
                </div>
                <span className="acceptance-text">
                  I agree to follow these guidelines and understand violations
                  may result in account action.
                </span>
              </label>

              <p className="disclaimer-text">
                Links shared are user-submitted. We are not responsible for the
                content of external websites.
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="policy-footer">
            <button
              className="btn btn-cancel"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              className="btn btn-accept"
              onClick={handleAccept}
              disabled={!accepted || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="spinner" size={16} />
                  Processing...
                </>
              ) : (
                'I Agree & Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
