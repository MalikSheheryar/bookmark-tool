'use client'

import { useState } from 'react'

interface ShareModalProps {
  show: boolean
  onClose: () => void
  categoryName: string
  shareUrl: string
}

export function ShareModal({
  show,
  onClose,
  categoryName,
  shareUrl,
}: ShareModalProps) {
  const [copyStatus, setCopyStatus] = useState('')

  const copyToClipboard = async (text: string, isHtml = false) => {
    try {
      if (isHtml && navigator.clipboard.write) {
        const htmlBlob = new Blob([text], { type: 'text/html' })
        const textBlob = new Blob([text.replace(/<[^>]*>/g, '')], {
          type: 'text/plain',
        })
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
          }),
        ])
      } else {
        await navigator.clipboard.writeText(text)
      }
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus(''), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = isHtml ? text.replace(/<[^>]*>/g, '') : text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus(''), 2000)
    }
  }

  const copyEmojiLink = () => {
    const emojiHtml = `<a href="${shareUrl}" style="text-decoration: none;">🔗</a>`
    copyToClipboard(emojiHtml, true)
  }

  const copyMarkdownLink = () => {
    const markdownLink = `[🔗](${shareUrl})`
    copyToClipboard(markdownLink)
  }

  const copyBookEmojiLink = () => {
    const bookEmojiHtml = `<a href="${shareUrl}" style="text-decoration: none;">📚</a>`
    copyToClipboard(bookEmojiHtml, true)
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out my ${categoryName} bookmarks`)
    const body = encodeURIComponent(
      `Hi!\n\nI wanted to share my ${categoryName} bookmarks with you. You can view them at:\n\n${shareUrl}\n\nBest regards!`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const openSharedCategory = () => {
    window.open(shareUrl, '_blank')
  }

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
            <i className="fa-solid fa-share me-2"></i>
            Share Category
          </h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <p className="mb-3">
            <strong>{categoryName}</strong> - Share this link with others to let
            them view your bookmarks in read-only mode.
          </p>

          <div className="emoji-share-container">
            <div className="emoji-link-display">
              <div
                className="emoji-wrapper"
                onClick={openSharedCategory}
                title="Click to open shared category"
              >
                <span className="share-emoji">📚</span>
                <div className="emoji-glow"></div>
              </div>
              <div className="share-info">
                <p className="share-title">Shareable Link</p>
                <p className="share-description">
                  Click the book to preview or copy using options below
                </p>
              </div>
            </div>

            <div className="share-buttons">
              <div className="copy-options-grid">
                <button
                  className={`copy-btn emoji-link ${
                    copyStatus === 'copied' ? 'copied' : ''
                  }`}
                  onClick={copyEmojiLink}
                  title="Copy as clickable link emoji (🔗) - works in rich text apps"
                >
                  <span className="emoji-preview">🔗</span>
                  <span className="btn-text">Copy Link Emoji</span>
                </button>

                <button
                  className={`copy-btn emoji-link ${
                    copyStatus === 'copied' ? 'copied' : ''
                  }`}
                  onClick={copyBookEmojiLink}
                  title="Copy as clickable book emoji (📚) - works in rich text apps"
                >
                  <span className="emoji-preview">📚</span>
                  <span className="btn-text">Copy Book Emoji</span>
                </button>

                <button
                  className={`copy-btn secondary ${
                    copyStatus === 'copied' ? 'copied' : ''
                  }`}
                  onClick={copyMarkdownLink}
                  title="Copy as markdown link - works in Discord, Slack, etc."
                >
                  <i className="fa-solid fa-code me-1"></i>
                  Markdown
                </button>

                <button
                  className={`copy-btn primary ${
                    copyStatus === 'copied' ? 'copied' : ''
                  }`}
                  onClick={() => copyToClipboard(shareUrl)}
                  title="Copy the complete shareable URL"
                >
                  <i
                    className={`fa-solid ${
                      copyStatus === 'copied' ? 'fa-check' : 'fa-copy'
                    } me-1`}
                  ></i>
                  {copyStatus === 'copied' ? 'Copied!' : 'Full URL'}
                </button>
              </div>

              <button
                className="copy-btn secondary email-btn"
                onClick={shareViaEmail}
              >
                <i className="fa-solid fa-envelope me-1"></i>
                Email
              </button>
            </div>
          </div>

          <div className="mt-3">
            <small className="text-muted">
              <i className="fa-solid fa-info-circle me-1"></i>
              <strong>Emoji Links:</strong> Copy as clickable emojis that work
              in rich text apps (Gmail, WhatsApp, etc.).
              <strong>Markdown:</strong> Works in Discord, Slack, GitHub.{' '}
              <strong>Full URL:</strong> Works everywhere.
            </small>
          </div>
        </div>
      </div>

      <style jsx>{`
        .copy-options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }

        .copy-btn.emoji-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .copy-btn.emoji-link:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .copy-btn.emoji-link.copied {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .emoji-preview {
          font-size: 16px;
          line-height: 1;
        }

        .btn-text {
          font-size: 0.8rem;
          white-space: nowrap;
        }

        .email-btn {
          width: 100%;
          margin-top: 8px;
        }

        @media (max-width: 480px) {
          .copy-options-grid {
            grid-template-columns: 1fr;
          }

          .btn-text {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  )
}
