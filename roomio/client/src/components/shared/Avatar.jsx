import { hallGradientStyle, initials } from '../../lib/halls'

export default function Avatar({ profile, size = 40, showOnline = false, className = '' }) {
  const sz = { width: size, height: size, fontSize: Math.max(size * 0.35, 11), borderRadius: '50%', flexShrink: 0 }
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      {profile?.avatar_url
        ? <img src={profile.avatar_url} alt={profile.full_name} style={{ ...sz, objectFit: 'cover' }} />
        : <div style={{ ...sz, background: hallGradientStyle(profile?.hall), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontFamily: 'Nunito,sans-serif' }}>
            {initials(profile?.full_name || '??')}
          </div>
      }
      {showOnline && profile?.is_online && (
        <span style={{ width: Math.max(size*0.28,8), height: Math.max(size*0.28,8) }}
          className="absolute bottom-0 right-0 bg-brand-green border-2 border-dark-bg rounded-full" />
      )}
    </div>
  )
}
