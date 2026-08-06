'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Users,
  Award,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowRight,
  Check,
  Play,
  Globe,
  Zap,
  Heart,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  BarChart3,
  Lightbulb,
  Shield,
  TrendingUp,
  Megaphone,
  Database,
  Camera,
  Music,
  Activity,
  Sparkles,
  Quote,
  Send,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

const featuredCourses = [
  {
    id: 1,
    title: 'Advanced Web Development with React & Next.js',
    instructor: 'Sarah Johnson',
    rating: 4.9,
    reviews: 2847,
    students: 12450,
    price: 79.99,
    originalPrice: 199.99,
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
    badge: 'Bestseller',
    duration: '42 hours',
  },
  {
    id: 2,
    title: 'Data Science & Machine Learning Masterclass',
    instructor: 'Dr. Michael Chen',
    rating: 4.8,
    reviews: 1923,
    students: 8730,
    price: 89.99,
    originalPrice: 249.99,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
    badge: 'New',
    duration: '56 hours',
  },
  {
    id: 3,
    title: 'UI/UX Design: From Figma to Production',
    instructor: 'Emily Rodriguez',
    rating: 4.9,
    reviews: 1456,
    students: 6890,
    price: 69.99,
    originalPrice: 179.99,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop',
    badge: 'Hot',
    duration: '38 hours',
  },
  {
    id: 4,
    title: 'Digital Marketing & Growth Strategy',
    instructor: 'James Wilson',
    rating: 4.7,
    reviews: 987,
    students: 5420,
    price: 59.99,
    originalPrice: 149.99,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
    badge: 'Popular',
    duration: '32 hours',
  },
  {
    id: 5,
    title: 'iOS & Android App Development with Flutter',
    instructor: 'Alex Kim',
    rating: 4.8,
    reviews: 1678,
    students: 7340,
    price: 84.99,
    originalPrice: 219.99,
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop',
    badge: 'Bestseller',
    duration: '48 hours',
  },
  {
    id: 6,
    title: 'Cloud Architecture & DevOps with AWS',
    instructor: 'David Park',
    rating: 4.9,
    reviews: 2103,
    students: 9870,
    price: 94.99,
    originalPrice: 279.99,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop',
    badge: 'Trending',
    duration: '52 hours',
  },
]

const categories = [
  { name: 'Programming', icon: BookOpen, count: 248, color: 'from-blue-500 to-blue-600' },
  { name: 'Business', icon: TrendingUp, count: 186, color: 'from-emerald-500 to-emerald-600' },
  { name: 'Design', icon: Sparkles, count: 154, color: 'from-purple-500 to-purple-600' },
  { name: 'Marketing', icon: Megaphone, count: 132, color: 'from-orange-500 to-orange-600' },
  { name: 'Data Science', icon: Database, count: 198, color: 'from-cyan-500 to-cyan-600' },
  { name: 'Photography', icon: Camera, count: 87, color: 'from-pink-500 to-pink-600' },
  { name: 'Music', icon: Music, count: 64, color: 'from-amber-500 to-amber-600' },
  { name: 'Health', icon: Activity, count: 112, color: 'from-red-500 to-red-600' },
]

const instructors = [
  {
    name: 'Sarah Johnson',
    specialty: 'Web Development & React',
    rating: 4.9,
    students: 45200,
    courses: 12,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
  },
  {
    name: 'Dr. Michael Chen',
    specialty: 'Data Science & AI',
    rating: 4.8,
    students: 38900,
    courses: 9,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
  },
  {
    name: 'Emily Rodriguez',
    specialty: 'UI/UX Design',
    rating: 4.9,
    students: 31500,
    courses: 8,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face',
  },
  {
    name: 'James Wilson',
    specialty: 'Digital Marketing',
    rating: 4.7,
    students: 27800,
    courses: 6,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face',
  },
]

const benefits = [
  {
    icon: Users,
    title: 'Expert Instructors',
    description: 'Learn from industry professionals and world-class educators with real-world experience.',
  },
  {
    icon: Clock,
    title: 'Flexible Learning',
    description: 'Study at your own pace, anywhere, anytime. Access courses on any device.',
  },
  {
    icon: Award,
    title: 'Certificates',
    description: 'Earn recognized certificates upon completion to boost your professional profile.',
  },
  {
    icon: Heart,
    title: 'Community Support',
    description: 'Join a global community of learners. Get help from peers and mentors.',
  },
]

const pricingPlans = [
  {
    name: 'Basic',
    price: 0,
    period: 'Free forever',
    description: 'Perfect for getting started',
    features: ['Access to free courses', 'Community forum access', 'Basic certificates', 'Email support'],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: 29,
    period: '/month',
    description: 'Best for serious learners',
    features: [
      'All Basic features',
      'Unlimited course access',
      'Downloadable resources',
      'Priority support',
      'Advanced certificates',
      'Offline viewing',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 99,
    period: '/month',
    description: 'For teams and organizations',
    features: [
      'All Pro features',
      'Team management dashboard',
      'Custom learning paths',
      'API access',
      'Dedicated account manager',
      'SSO integration',
      'Custom branding',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

const testimonials = [
  {
    quote:
      'This platform completely transformed my career. The web development courses are top-notch and the instructors are incredibly supportive.',
    name: 'Rachel Adams',
    role: 'Frontend Developer at Google',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face',
    rating: 5,
  },
  {
    quote:
      'As a working professional, the flexibility to learn at my own pace was invaluable. I earned my data science certificate while working full-time.',
    name: 'Marcus Thompson',
    role: 'Data Analyst at Netflix',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
    rating: 5,
  },
  {
    quote:
      'The enterprise plan was perfect for our team. We onboarded 50+ engineers and the learning analytics helped us track progress effectively.',
    name: 'Priya Patel',
    role: 'CTO at TechStart Inc.',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=80&h=80&fit=crop&crop=face',
    rating: 5,
  },
]

const faqs = [
  {
    question: 'How do I get started?',
    answer:
      'Simply create a free account and start exploring our course catalog. You can enroll in any free course immediately, or upgrade to Pro for full access.',
  },
  {
    question: 'Can I get a refund?',
    answer:
      'Yes! We offer a 30-day money-back guarantee on all paid plans. If you are not satisfied, contact support for a full refund.',
  },
  {
    question: 'Are the certificates recognized?',
    answer:
      'Our certificates are recognized by industry leaders worldwide. They can be shared on LinkedIn and added to your professional portfolio.',
  },
  {
    question: 'Can I access courses offline?',
    answer:
      'Pro and Enterprise users can download course materials and videos for offline viewing on our mobile app.',
  },
  {
    question: 'How does the team plan work?',
    answer:
      'The Enterprise plan includes a team dashboard where admins can assign courses, track progress, manage billing, and generate reports for all team members.',
  },
]

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
        <div className="absolute bottom-32 left-1/3 w-3 h-3 bg-white/20 rounded-full animate-pulse delay-700" />
        <div className="absolute top-1/3 left-10 w-1.5 h-1.5 bg-indigo-300/40 rounded-full animate-pulse delay-1000" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium text-white/90">New: AI-Powered Learning Paths</span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            >
              Master New Skills with{' '}
              <span className="bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
                Expert-Led Courses
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-blue-100/80 mb-8 max-w-lg">
              Join millions of learners worldwide. Access 10,000+ courses taught by industry experts and advance your career at your own pace.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/#courses"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all shadow-lg shadow-black/10"
              >
                Browse Courses
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/apply/teacher"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-all"
              >
                Apply as Teacher
                <Play className="w-5 h-5" />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="flex items-center gap-8 mt-10">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">50K+</p>
                <p className="text-sm text-blue-200/70">Students</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">10K+</p>
                <p className="text-sm text-blue-200/70">Courses</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">500+</p>
                <p className="text-sm text-blue-200/70">Instructors</p>
              </div>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block relative"
          >
            <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="bg-white/10 rounded-xl p-4 mb-3">
                <div className="w-full h-36 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-lg flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              </div>
              <h3 className="text-white font-semibold mb-1">Advanced Web Development</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <span className="text-xs text-blue-200/70">4.9 (2,847 reviews)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-400" />
                  <span className="text-sm text-white/80">Sarah Johnson</span>
                </div>
                <span className="text-lg font-bold text-white">$79.99</span>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-3 shadow-lg flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">This week</p>
                <p className="text-sm font-bold text-gray-900">+2,340 enrollments</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  )
}

function FeaturedCoursesSection() {
  return (
    <section id="courses" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Featured Courses
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Learn from the Best
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our hand-picked selection of top-rated courses taught by industry experts.
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {featuredCourses.map((course) => (
            <motion.div
              key={course.id}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full text-gray-800 shadow-sm">
                    {course.badge}
                  </span>
                </div>
                <div className="absolute bottom-3 right-3">
                  <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {course.duration}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{course.instructor}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-amber-500">{course.rating}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i <= Math.floor(course.rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200 fill-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">({course.reviews.toLocaleString()})</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">${course.price}</span>
                    <span className="text-sm text-gray-400 line-through">${course.originalPrice}</span>
                  </div>
                  <span className="text-xs text-gray-500">{course.students.toLocaleString()} students</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        <div className="text-center mt-10">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            View All Courses
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function CategoriesSection() {
  return (
    <section id="categories" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block bg-indigo-50 text-indigo-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Categories
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Explore Top Categories
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find the perfect course from a wide range of categories.
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {categories.map((cat) => (
            <motion.div
              key={cat.name}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className="group bg-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <div
                className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <cat.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{cat.name}</h3>
              <p className="text-sm text-gray-500">{cat.count} courses</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function InstructorsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block bg-purple-50 text-purple-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Top Instructors
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Learn from the Best
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our instructors are industry leaders with years of real-world experience.
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {instructors.map((inst) => (
            <motion.div
              key={inst.name}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className="group bg-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <img
                src={inst.avatar}
                alt={inst.name}
                className="w-20 h-20 rounded-full mx-auto mb-4 object-cover ring-4 ring-gray-50 group-hover:ring-blue-50 transition-all"
              />
              <h3 className="font-semibold text-gray-900 mb-1">{inst.name}</h3>
              <p className="text-sm text-blue-600 mb-3">{inst.specialty}</p>
              <div className="flex items-center justify-center gap-1 mb-3">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold text-gray-700">{inst.rating}</span>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <span>{inst.students.toLocaleString()} students</span>
                <span>{inst.courses} courses</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function BenefitsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block bg-white/10 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/20">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-blue-100/70 max-w-2xl mx-auto">
            Our platform provides all the tools and resources you need for an effective learning experience.
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {benefits.map((b) => (
            <motion.div
              key={b.title}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <b.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{b.title}</h3>
              <p className="text-sm text-blue-100/70">{b.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block bg-emerald-50 text-emerald-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the plan that works best for you. Upgrade or downgrade anytime.
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {pricingPlans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className={`relative bg-white rounded-2xl p-8 border-2 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? 'border-blue-600 shadow-xl shadow-blue-100'
                  : 'border-gray-100 shadow-sm hover:shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
              <div className="mb-6">
                {plan.price === 0 ? (
                  <div className="text-4xl font-bold text-gray-900">Free</div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block bg-amber-50 text-amber-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Loved by Learners Worldwide
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See what our students have to say about their learning experience.
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-all duration-300"
            >
              <Quote className="w-8 h-8 text-blue-200 mb-4" />
              <p className="text-gray-700 leading-relaxed mb-6">{t.quote}</p>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block bg-cyan-50 text-cyan-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600">Got questions? We have answers.</p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="space-y-3"
        >
          {faqs.map((faq, idx) => (
            <motion.div
              key={faq.question}
              variants={fadeUp}
              transition={{ duration: 0.3 }}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                {openIndex === idx ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                )}
              </button>
              {openIndex === idx && (
                <div className="px-5 pb-5">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <GraduationCap className="w-16 h-16 text-white/80 mx-auto mb-6" />
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
          >
            Ready to Start Your Learning Journey?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-blue-100/70 mb-10 max-w-2xl mx-auto">
            Join over 50,000 learners who are already building new skills and advancing their careers. Start for free today.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-lg text-lg"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/#courses"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-all text-lg"
            >
              Explore Courses
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block bg-pink-50 text-pink-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Contact Us
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get in Touch
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Have a question or need assistance? We are here to help.
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Email Us</h4>
                  <p className="text-sm text-gray-500">support@lmsplatform.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Call Us</h4>
                  <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Visit Us</h4>
                  <p className="text-sm text-gray-500">123 Learning St, San Francisco, CA</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 bg-gray-50 rounded-2xl p-8">
              <form className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                  <input
                    type="text"
                    placeholder="How can we help?"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Tell us more..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <FeaturedCoursesSection />
      <CategoriesSection />
      <InstructorsSection />
      <BenefitsSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <ContactSection />
    </main>
  )
}
