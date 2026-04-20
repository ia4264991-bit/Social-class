import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import Avatar from '../shared/Avatar'

const CAT_ICON = { textbooks:'📖', electronics:'💻', furniture:'🪑', clothing:'👕', other:'🛍️' }

export default function ItemCard({ item, onMessage }) {
  return (
    <div className="card overflow-hidden hover:border-dark-border2 transition-colors group flex flex-col">
      <div className="h-36 bg-dark-card2 flex items-center justify-center text-5xl flex-shrink-0">
        {item.image_url
          ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          : CAT_ICON[item.category] || '🛍️'}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="text-sm font-bold text-white truncate">{item.title}</div>
        <div className="text-base font-black text-brand-green mt-0.5">GH₵ {item.price?.toLocaleString()}</div>
        {item.description && <div className="text-xs text-dark-muted mt-1 line-clamp-2">{item.description}</div>}
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-dark-border">
          <Link to={`/profile/${item.seller?.id}`} className="press"><Avatar profile={item.seller} size={26} showOnline /></Link>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-dark-muted truncate">{item.seller?.full_name}</div>
            <div className="text-xs text-dark-subtle">{formatDistanceToNow(new Date(item.created_at), { addSuffix:true })}</div>
          </div>
        </div>
        <button onClick={() => onMessage?.(item.seller)}
          className="mt-2 w-full bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-xl py-2 text-xs font-bold hover:bg-brand-green/20 transition-colors press">
          💬 Message Seller
        </button>
      </div>
    </div>
  )
}
