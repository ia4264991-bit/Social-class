export const HALLS = [
  'Casfort Hall',
  'Kwame Nkrumah Hall',
  'Oguaa Hall',
  'Adehye Hall',
  'Atlantic Hall',
  'Valco Hall',
  'SRC Hall',
  'Superannuation Hall',
]

export const CS_LEVELS = ['Level 100', 'Level 200', 'Level 300', 'Level 400', 'Postgrad']

export const CS_COURSES = [
  'Data Structures & Algorithms',
  'Operating Systems',
  'Computer Networks',
  'Database Systems',
  'Software Engineering',
  'Artificial Intelligence',
  'Machine Learning',
  'Web Development',
  'Mobile App Dev',
  'Computer Architecture',
  'Discrete Mathematics',
  'Compiler Design',
  'Cybersecurity',
  'Cloud Computing',
  'Human-Computer Interaction',
]

export const hallGradientStyle = (hall = '') => {
  const map = {
    'Casfort Hall':          'linear-gradient(135deg,#1e40af,#6d28d9)',
    'Kwame Nkrumah Hall':    'linear-gradient(135deg,#065f46,#0f766e)',
    'Oguaa Hall':            'linear-gradient(135deg,#92400e,#b45309)',
    'Adehye Hall':           'linear-gradient(135deg,#006633,#16a34a)',
    'Atlantic Hall':         'linear-gradient(135deg,#0369a1,#0891b2)',
    'Valco Hall':            'linear-gradient(135deg,#7c2d12,#c2410c)',
    'SRC Hall':              'linear-gradient(135deg,#4c1d95,#7c3aed)',
    'Superannuation Hall':   'linear-gradient(135deg,#134e4a,#CCA000)',
  }
  return map[hall] || 'linear-gradient(135deg,#006633,#CCA000)'
}

export const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
