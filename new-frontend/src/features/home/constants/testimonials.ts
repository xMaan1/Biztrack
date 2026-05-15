export type Testimonial = {
  name: string
  role: string
  content: string
  rating: number
}

export const LANDING_TESTIMONIALS: Testimonial[] = [
  {
    name: 'Sarah Johnson',
    role: 'CEO, TechFlow Solutions',
    content:
      'BizTrack transformed our business operations. The project management and analytics features are game-changers.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Operations Manager, Global Manufacturing',
    content:
      "We've increased productivity by 40% since implementing BizTrack. The automation features are incredible.",
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'HR Director, Healthcare Plus',
    content:
      'The multi-tenant setup and security features give us peace of mind while managing multiple locations.',
    rating: 5,
  },
]
