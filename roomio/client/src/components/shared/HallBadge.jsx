export default function HallBadge({ hall, small = false }) {
  if (!hall) return null
  return (
    <span className={`inline-flex items-center bg-ucc-green-light text-ucc-green font-bold rounded-full ${small ? 'text-xs px-2 py-0.5' : 'text-xs px-3 py-1'}`}>
      🏠 {hall}
    </span>
  )
}
