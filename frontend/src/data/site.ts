export type ProjectCategory =
  | 'Interior design'
  | 'Residential'
  | 'Commercial'
  | 'Kitchen'
  | 'Bedroom'
  | 'Living room'
  | 'Office'
  | 'Construction'
  | 'Renovation'

export type ProjectStatus = 'CONCEPT' | 'ONGOING' | 'COMPLETED'

export type Project = {
  id: string
  title: string
  type: string
  status: ProjectStatus
  location: string
  image: string
  gallery: string[]
  alt: string
  description: string
  scope: string[]
}

const image = (photo: string, width = 1400) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${width}&q=85`

const projectSets: Record<
  ProjectCategory,
  {
    titles: string[]
    photos: string[]
    alt: string
    description: string
    scope: string[]
  }
> = {
  'Interior design': {
    titles: [
      'Soft Geometry',
      'The Collected Home',
      'Between Light & Form',
      'Material Notes',
    ],
    photos: [
      'photo-1600210492486-724fe5c67fb0',
      'photo-1600607687939-ce8a6c25118c',
      'photo-1600210491892-03d54c0aaf87',
      'photo-1600607687920-4e2a09cf159d',
    ],
    alt: 'Contemporary interior concept with warm natural materials and considered details',
    description:
      'An interior direction exploring proportion, natural texture and the balance between expressive design and everyday comfort.',
    scope: [
      'Spatial planning',
      'Material direction',
      'Furniture and lighting concept',
    ],
  },
  Residential: {
    titles: [
      'The Courtyard House',
      'Gathered Light',
      'A Home in Layers',
      'The Garden Room',
    ],
    photos: [
      'photo-1600585154340-be6161a56a0c',
      'photo-1600607687939-ce8a6c25118c',
      'photo-1600566753190-17f0baa2a6c3',
      'photo-1600047509807-ba8f99d2cdde',
    ],
    alt: 'Residential architecture concept with a warm indoor-outdoor connection',
    description:
      'A residential concept shaped around daily routines, welcoming shared spaces and a calm connection to natural light.',
    scope: [
      'Residential design direction',
      'Space planning',
      'Finishes and fittings concept',
    ],
  },
  Commercial: {
    titles: [
      'Common Ground',
      'The Welcome House',
      'An Open Invitation',
      'The Modern Exchange',
    ],
    photos: [
      'photo-1497366754035-f200968a6e72',
      'photo-1497366811353-6870744d04b2',
      'photo-1497366216548-37526070297c',
      'photo-1524758631624-e2822e304c36',
    ],
    alt: 'Contemporary commercial interior concept designed for people and shared activity',
    description:
      'A commercial-space concept balancing a clear sense of arrival with adaptable places to meet, focus and connect.',
    scope: [
      'Commercial space planning',
      'Visitor experience',
      'Material and lighting direction',
    ],
  },
  Kitchen: {
    titles: [
      'The Gathering Kitchen',
      'Stone & Grain',
      'A Table for Two',
      'Morning Light',
    ],
    photos: [
      'photo-1600489000022-c2086d79f9d4',
      'photo-1600210491892-03d54c0aaf87',
      'photo-1600607687920-4e2a09cf159d',
      'photo-1600566753086-00f18fb6b3ea',
    ],
    alt: 'Kitchen interior concept with warm cabinetry, natural stone and soft daylight',
    description:
      'A kitchen study focused on a practical flow, tactile finishes and the everyday rituals that bring people together.',
    scope: [
      'Kitchen layout concept',
      'Material palette',
      'Lighting and fittings direction',
    ],
  },
  Bedroom: {
    titles: [
      'Still Morning',
      'The Resting Place',
      'Softly Spoken',
      'The Linen Room',
    ],
    photos: [
      'photo-1616486338812-3dadae4b4ace',
      'photo-1600210492486-724fe5c67fb0',
      'photo-1600210491892-03d54c0aaf87',
      'photo-1600607687939-ce8a6c25118c',
    ],
    alt: 'Restful bedroom concept with soft linen, warm wood and natural light',
    description:
      'A bedroom concept centred on rest, gentle light and a restrained palette of tactile, natural materials.',
    scope: [
      'Bedroom space planning',
      'Colour and material direction',
      'Furniture concept',
    ],
  },
  'Living room': {
    titles: [
      'Quiet Form',
      'Low Sun',
      'The Long Weekend',
      'A Seat in the Light',
    ],
    photos: [
      'photo-1600210492486-724fe5c67fb0',
      'photo-1600607687939-ce8a6c25118c',
      'photo-1600210491892-03d54c0aaf87',
      'photo-1600607687920-4e2a09cf159d',
    ],
    alt: 'Living room concept with sculptural furniture, warm textures and layered light',
    description:
      'A living room exploration of flexible gathering, comfortable proportions and the way natural light shapes a room.',
    scope: [
      'Furniture layout',
      'Lighting concept',
      'Textile and colour direction',
    ],
  },
  Office: {
    titles: [
      'Work in Balance',
      'Focus & Flow',
      'The Studio Floor',
      'Work, Reconsidered',
    ],
    photos: [
      'photo-1497366754035-f200968a6e72',
      'photo-1497366811353-6870744d04b2',
      'photo-1497366216548-37526070297c',
      'photo-1524758631624-e2822e304c36',
    ],
    alt: 'Workplace concept combining focused desks, shared areas and natural materials',
    description:
      'A workplace study that balances focused work with shared moments, clear circulation and a welcoming atmosphere.',
    scope: [
      'Workplace planning',
      'Shared and focus zones',
      'Furniture and lighting concept',
    ],
  },
  Construction: {
    titles: [
      'Urban Frame',
      'The Garden House',
      'A Courtyard in the City',
      'Grounded',
    ],
    photos: [
      'photo-1600585154340-be6161a56a0c',
      'photo-1600047509807-ba8f99d2cdde',
      'photo-1600566752355-35792bedcfea',
      'photo-1541888946425-d81bb19240f5',
    ],
    alt: 'Architectural construction concept showing considered massing and natural materials',
    description:
      'An architectural study exploring how proportion, site context and a clear sequence of spaces can shape a building idea.',
    scope: [
      'Early design coordination',
      'Spatial sequence',
      'Exterior material direction',
    ],
  },
  Renovation: {
    titles: [
      'A New Chapter',
      'The House Reframed',
      'A Lighter Touch',
      'Room for Renewal',
    ],
    photos: [
      'photo-1600210492486-724fe5c67fb0',
      'photo-1600607687939-ce8a6c25118c',
      'photo-1600210491892-03d54c0aaf87',
      'photo-1600607687920-4e2a09cf159d',
    ],
    alt: 'Renovated interior concept with improved natural light and a calm material palette',
    description:
      'A renovation concept focused on making the most of an existing space through a clearer layout and renewed material character.',
    scope: [
      'Existing-space review',
      'Layout improvement concept',
      'Finishes direction',
    ],
  },
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const projectCategories = Object.keys(projectSets) as ProjectCategory[]

const conceptProjects: Project[] = projectCategories.flatMap((type) => {
  const set = projectSets[type]

  return set.titles.map((title, index) => {
    const photoIndex = index % set.photos.length
    const gallery = [0, 1, 2].map((offset) =>
      image(set.photos[(photoIndex + offset) % set.photos.length]),
    )

    return {
      id: `${slugify(type)}-${String(index + 1).padStart(2, '0')}`,
      title,
      type,
      status: 'CONCEPT',
      location: 'Illustrative concept',
      image: gallery[0],
      gallery,
      alt: set.alt,
      description: set.description,
      scope: set.scope,
    }
  })
})

export const ongoingProjects: Project[] = [
  {
    id: 'ongoing-site-progress-01',
    title: 'Current site progress 01',
    type: 'Construction',
    status: 'ONGOING',
    location: 'Location to be confirmed',
    image: '/images/site_1.JPG',
    gallery: [],
    alt: 'Zettos team member in branded safety vest at a project site in progress',
    description:
      'An active project progress photo shared by Zettos. The project name, location, client and scope are not yet confirmed for publication.',
    scope: ['Ongoing site works'],
  },
  {
    id: 'ongoing-site-progress-02',
    title: 'Current site progress 02',
    type: 'Construction',
    status: 'ONGOING',
    location: 'Location to be confirmed',
    image: '/images/site_2.JPG',
    gallery: [],
    alt: 'Zettos team member in branded safety vest at a large project site in progress',
    description:
      'An active project progress photo shared by Zettos. The project name, location, client and scope are not yet confirmed for publication.',
    scope: ['Ongoing site works'],
  },
]

export const projects: Project[] = [...conceptProjects, ...ongoingProjects]

export const filters = [
  'All',
  ...projectCategories,
  'Ongoing',
  'Completed',
] as const

export const services = [
  {
    id: 'interior-design',
    number: '01',
    name: 'Interior design & decoration',
    short:
      'Thoughtful interiors, shaped around the way you live, work and gather.',
    image: image('photo-1600210491892-03d54c0aaf87', 1000),
    alt: 'Refined interior with natural textures and a warm neutral palette',
    introduction:
      'The most memorable interiors do more than look beautiful. They make daily life feel easier, more comfortable and more personal. We start by understanding the people and routines behind a space, then shape a considered direction for how it can look and work.',
    offerings: [
      'Residential and commercial interiors',
      'Space planning and interior styling',
      'Kitchen, bathroom and room concepts',
      'Furniture, fittings and material direction',
      'Lighting and decorative finishes',
      'Renovation and interior finishing',
    ],
    process: [
      'Talk through your brief, priorities and budget range.',
      'Review the space, measurements and existing conditions.',
      'Develop an agreed concept, layout and materials direction.',
      'Coordinate the next steps for implementation and review.',
    ],
    faqs: [
      {
        question: 'Can you help with a single room?',
        answer:
          'A single room can be a useful place to begin. The team can confirm availability and the right scope after learning about your space and what you need.',
      },
      {
        question: 'Do I need to have a finished brief?',
        answer:
          'No. The first conversation is an opportunity to explain what you have in mind, ask questions and understand what information will help shape the project.',
      },
      {
        question: 'Can you work with furniture or finishes I already own?',
        answer:
          'Existing pieces can be part of the conversation. Share what you would like to keep and the design approach can take those priorities into account.',
      },
    ],
  },
  {
    id: 'building-construction',
    number: '02',
    name: 'Building construction',
    short:
      'A considered path from an early building idea to a beautifully finished space.',
    image: image('photo-1600607687644-c7171b42498f', 1000),
    alt: 'Contemporary architecture with crisp forms and natural materials',
    introduction:
      'A building project asks for clear decisions, careful coordination and the right expertise at the right time. We help start the conversation around your goals, site and scope, and coordinate the project pathway with the appropriately qualified professionals required for the work.',
    offerings: [
      'Residential and commercial project coordination',
      'Building design coordination',
      'Site assessment and project planning',
      'Renovation and remodelling',
      'Construction and finishing coordination',
      'Project reviews and handover planning',
    ],
    process: [
      'Discuss the site, project goals, timing and budget expectations.',
      'Identify the required assessments, approvals and professional roles.',
      'Coordinate a project scope and delivery plan with the right team.',
      'Review progress, finishing requirements and handover expectations.',
    ],
    faqs: [
      {
        question: 'Can you take a project from the beginning?',
        answer:
          'The right starting point depends on the site, scope and professional requirements. An initial discussion can clarify where Zettos can contribute and which specialists need to be involved.',
      },
      {
        question: 'Do you provide architectural or engineering approvals?',
        answer:
          'No unconfirmed licensing or approval capability is implied. Any regulated design, engineering or approval work must be assessed and completed by suitably qualified professionals and relevant authorities.',
      },
      {
        question: 'Can you help with renovation work?',
        answer:
          'Renovation and remodelling are possible areas to discuss. The existing condition, project scope and technical requirements need to be assessed before availability can be confirmed.',
      },
    ],
  },
]

export const processSteps = [
  {
    number: '01',
    title: 'A first conversation',
    text: 'We listen to what you are planning, what matters most and what you hope the space will become.',
  },
  {
    number: '02',
    title: 'Understand the brief',
    text: 'Together we clarify the requirements, location, budget range, timing and the right next steps.',
  },
  {
    number: '03',
    title: 'Plan with purpose',
    text: 'Site assessment, design coordination and project planning are shaped around the agreed scope.',
  },
  {
    number: '04',
    title: 'Bring it to life',
    text: 'With approvals and the right professionals in place, the work moves into implementation and review.',
  },
]

export const imageCatalog = {
  quietForm: image('photo-1600210492486-724fe5c67fb0'),
  gatheredLight: image('photo-1600607687939-ce8a6c25118c'),
  architecture: image('photo-1600585154340-be6161a56a0c'),
}
