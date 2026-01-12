interface DragGuideProps {
  show: boolean
}

export function DragGuide({ show }: DragGuideProps) {
  return (
    <div className={`drag-guide ${show ? "show" : ""}`}>
      <i className="fa-solid fa-arrows-up-down me-2"></i>
      Drag categories to reorder them
    </div>
  )
}
