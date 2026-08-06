'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSubmitTeacherApplication, useMyTeacherApplication } from '@/lib/hooks/useApplications'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { Loader2, ArrowLeft, ArrowRight, Check, User, Briefcase, BookOpen, Upload, FileCheck } from 'lucide-react'
import { FileUpload } from '@/components/shared/FileUpload'
import { useUploadTeacherDocument } from '@/lib/hooks/useApplications'
import { motion, AnimatePresence } from 'framer-motion'

const steps = [
  { title: 'Personal', icon: User },
  { title: 'Professional', icon: Briefcase },
  { title: 'Teaching', icon: BookOpen },
  { title: 'Declaration', icon: FileCheck },
  { title: 'Documents', icon: Upload },
]

const personalSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  cnic: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

const professionalSchema = z.object({
  highest_qualification: z.string().optional(),
  university: z.string().optional(),
  degree: z.string().optional(),
  specialization: z.string().optional(),
  teaching_experience: z.string().optional(),
  current_job: z.string().optional(),
  skills: z.string().optional(),
  languages: z.string().optional(),
  linkedin: z.string().optional(),
  portfolio_website: z.string().optional(),
})

const teachingSchema = z.object({
  subjects: z.string().optional(),
  categories: z.string().optional(),
  online_teaching_experience: z.string().optional(),
  offline_teaching_experience: z.string().optional(),
  expected_salary: z.string().optional(),
  available_days: z.string().optional(),
  available_time: z.string().optional(),
  teaching_statement: z.string().optional(),
})

const declarationSchema = z.object({
  declaration: z.literal(true, { errorMap: () => ({ message: 'You must confirm the information is correct' }) }),
})

type PersonalData = z.infer<typeof personalSchema>
type ProfessionalData = z.infer<typeof professionalSchema>
type TeachingData = z.infer<typeof teachingSchema>
type DeclarationData = z.infer<typeof declarationSchema>

export default function TeacherApplicationPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: existingApp } = useMyTeacherApplication()
  const submitMutation = useSubmitTeacherApplication()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [applicationId, setApplicationId] = useState<number | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string; url?: string }>>({})
  const uploadMutation = useUploadTeacherDocument()

  const personalForm = useForm<PersonalData>({ resolver: zodResolver(personalSchema) })
  const professionalForm = useForm<ProfessionalData>({ resolver: zodResolver(professionalSchema) })
  const teachingForm = useForm<TeachingData>({ resolver: zodResolver(teachingSchema) })
  const declarationForm = useForm<DeclarationData>({ resolver: zodResolver(declarationSchema) })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login')
    if (existingApp && existingApp.status !== 'rejected') {
      toast.error('You already have a pending application')
      router.push('/public-user/applications')
    }
  }, [authLoading, isAuthenticated, existingApp, router])

  if (authLoading || !isAuthenticated) return null

  const nextStep = async () => {
    let valid = false
    if (step === 0) valid = await personalForm.trigger()
    else if (step === 1) valid = await professionalForm.trigger()
    else if (step === 2) valid = await teachingForm.trigger()
    else if (step === 3) valid = await declarationForm.trigger()
    else valid = true

    if (valid) {
      const stepData = step === 0 ? personalForm.getValues() :
                       step === 1 ? professionalForm.getValues() :
                       step === 2 ? teachingForm.getValues() :
                       step === 3 ? declarationForm.getValues() : {}
      setFormData(prev => ({ ...prev, ...stepData }))
      if (step < 4) setStep(step + 1)
    }
  }

  const prevStep = () => { if (step > 0) setStep(step - 1) }

  const onSubmit = async () => {
    const finalData = {
      ...formData,
      ...declarationForm.getValues(),
      skills: formData.skills ? (formData.skills as string).split(',').map((s: string) => s.trim()) : [],
      languages: formData.languages ? (formData.languages as string).split(',').map((s: string) => s.trim()) : [],
      subjects: formData.subjects ? (formData.subjects as string).split(',').map((s: string) => s.trim()) : [],
      categories: formData.categories ? (formData.categories as string).split(',').map((s: string) => s.trim()) : [],
      expected_salary: formData.expected_salary ? parseFloat(formData.expected_salary as string) : null,
    }
    try {
      const result = await submitMutation.mutateAsync(finalData)
      const appId = result?.data?.id || result?.id
      if (appId) setApplicationId(appId)
      toast.success('Application submitted successfully!')
      setStep(4)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string | { error?: { message?: string } }; errors?: Array<{ message?: string }>; message?: string } } }
      let msg = 'Submission failed. Please try again.'
      if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string' ? err.response.data.detail : err.response.data.detail?.error?.message || msg
      } else if (err.response?.data?.errors?.length) {
        msg = err.response.data.errors.map((e: { message?: string }) => e.message).filter(Boolean).join(', ') || msg
      } else if (err.response?.data?.message) {
        msg = err.response.data.message
      }
      toast.error(msg)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label><Input placeholder="John Doe" {...personalForm.register('full_name')} error={personalForm.formState.errors.full_name?.message} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label><Input type="email" placeholder="john@example.com" {...personalForm.register('email')} error={personalForm.formState.errors.email?.message} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label><Input placeholder="+92-300-1234567" {...personalForm.register('phone')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNIC</label><Input placeholder="35202-1234567-1" {...personalForm.register('cnic')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label><Input type="date" {...personalForm.register('date_of_birth')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" {...personalForm.register('gender')}>
                <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label><Input placeholder="Street address" {...personalForm.register('address')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label><Input placeholder="Lahore" {...personalForm.register('city')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label><Input placeholder="Pakistan" {...personalForm.register('country')} /></div>
          </div>
        </div>
      )
      case 1: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Professional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Highest Qualification</label><Input placeholder="PhD / Masters / Bachelors" {...professionalForm.register('highest_qualification')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">University</label><Input placeholder="University name" {...professionalForm.register('university')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Degree</label><Input placeholder="BS Computer Science" {...professionalForm.register('degree')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialization</label><Input placeholder="Machine Learning" {...professionalForm.register('specialization')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teaching Experience</label><Input placeholder="5 years" {...professionalForm.register('teaching_experience')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Job</label><Input placeholder="Professor at XYZ" {...professionalForm.register('current_job')} /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (comma separated)</label><Input placeholder="Python, JavaScript, ML" {...professionalForm.register('skills')} /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Languages (comma separated)</label><Input placeholder="English, Urdu" {...professionalForm.register('languages')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LinkedIn</label><Input placeholder="https://linkedin.com/in/..." {...professionalForm.register('linkedin')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portfolio Website</label><Input placeholder="https://..." {...professionalForm.register('portfolio_website')} /></div>
          </div>
        </div>
      )
      case 2: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Teaching Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subjects (comma separated)</label><Input placeholder="Mathematics, Physics" {...teachingForm.register('subjects')} /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categories (comma separated)</label><Input placeholder="Programming, Data Science" {...teachingForm.register('categories')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Online Teaching Experience</label><Input placeholder="3 years" {...teachingForm.register('online_teaching_experience')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Offline Teaching Experience</label><Input placeholder="5 years" {...teachingForm.register('offline_teaching_experience')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Salary (PKR)</label><Input type="number" placeholder="50000" {...teachingForm.register('expected_salary')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available Days</label><Input placeholder="Mon-Fri" {...teachingForm.register('available_days')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available Time</label><Input placeholder="9 AM - 5 PM" {...teachingForm.register('available_time')} /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teaching Statement</label>
              <textarea className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white h-24" placeholder="Describe your teaching philosophy..." {...teachingForm.register('teaching_statement')} />
            </div>
          </div>
        </div>
      )
      case 3: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Declaration</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">I confirm that all information provided in this application is true and correct to the best of my knowledge. I understand that any false information may result in the rejection of my application or removal from the platform.</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-600" {...declarationForm.register('declaration')} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">I confirm that all information provided is correct *</span>
            </label>
            {declarationForm.formState.errors.declaration && (
              <p className="text-sm text-red-600 mt-2">{declarationForm.formState.errors.declaration.message}</p>
            )}
          </div>
        </div>
      )
      case 4: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Documents</h2>
          <p className="text-sm text-gray-500">Upload your documents below. You can also upload them later from your application dashboard.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { type: 'profile_photo', label: 'Profile Photo', accept: '.jpg,.jpeg,.png', max: 5 * 1024 * 1024 },
              { type: 'resume', label: 'Resume / CV', accept: '.pdf,.doc,.docx', max: 10 * 1024 * 1024 },
              { type: 'degree_certificates', label: 'Degree Certificates', accept: '.pdf,.jpg,.jpeg,.png', max: 10 * 1024 * 1024 },
              { type: 'experience_certificates', label: 'Experience Certificates', accept: '.pdf,.jpg,.jpeg,.png', max: 10 * 1024 * 1024 },
              { type: 'cnic_front', label: 'CNIC Front', accept: '.jpg,.jpeg,.png,.pdf', max: 5 * 1024 * 1024 },
              { type: 'cnic_back', label: 'CNIC Back', accept: '.jpg,.jpeg,.png,.pdf', max: 5 * 1024 * 1024 },
              { type: 'intro_video', label: 'Intro Video (Optional)', accept: '.mp4,.webm,.mov', max: 100 * 1024 * 1024 },
            ].map(doc => (
              <FileUpload
                key={doc.type}
                label={doc.label}
                accept={doc.accept}
                maxSize={doc.max}
                currentFile={uploadedDocs[doc.type] || null}
                onUpload={async (file) => {
                  if (!applicationId) {
                    toast.error('Please submit the application first, then upload documents.')
                    return
                  }
                  await uploadMutation.mutateAsync({ applicationId, documentType: doc.type, file })
                  setUploadedDocs(prev => ({ ...prev, [doc.type]: { name: file.name } }))
                }}
                onRemove={() => {
                  setUploadedDocs(prev => {
                    const next = { ...prev }
                    delete next[doc.type]
                    return next
                  })
                }}
              />
            ))}
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/public-user" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Application</h1>
          <p className="text-gray-500 mt-1">Complete the form below to apply as a teacher</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="flex items-center">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${i <= step ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-400'}`}>
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{s.title}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`w-8 h-0.5 mx-1 ${i < step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={prevStep} disabled={step === 0 || (step === 4 && applicationId === null)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
            {step < 3 ? (
              <Button onClick={nextStep}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : step === 3 ? (
              <Button onClick={onSubmit} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Check className="w-4 h-4 mr-2" /> Submit Application</>}
              </Button>
            ) : (
              <Button onClick={() => router.push('/apply/success?type=teacher')}>
                Finish <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
