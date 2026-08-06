'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSubmitStudentApplication, useMyStudentApplication } from '@/lib/hooks/useApplications'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { Loader2, ArrowLeft, ArrowRight, Check, User, GraduationCap, BookOpen, Upload, FileCheck } from 'lucide-react'
import { FileUpload } from '@/components/shared/FileUpload'
import { useUploadStudentDocument } from '@/lib/hooks/useApplications'
import { motion, AnimatePresence } from 'framer-motion'

const steps = [
  { title: 'Personal', icon: User },
  { title: 'Academic', icon: GraduationCap },
  { title: 'Learning', icon: BookOpen },
  { title: 'Declaration', icon: FileCheck },
  { title: 'Documents', icon: Upload },
]

const personalSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  cnic_passport: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

const academicSchema = z.object({
  current_qualification: z.string().optional(),
  school_college_university: z.string().optional(),
  previous_qualification: z.string().optional(),
  field_of_study: z.string().optional(),
  gpa_percentage: z.string().optional(),
})

const learningSchema = z.object({
  interested_courses: z.string().optional(),
  learning_category: z.string().optional(),
  previous_experience: z.string().optional(),
  career_goals: z.string().optional(),
  learning_mode: z.string().optional(),
  availability: z.string().optional(),
})

const declarationSchema = z.object({
  declaration: z.literal(true, { errorMap: () => ({ message: 'You must confirm the information is correct' }) }),
})

type PersonalData = z.infer<typeof personalSchema>
type AcademicData = z.infer<typeof academicSchema>
type LearningData = z.infer<typeof learningSchema>
type DeclarationData = z.infer<typeof declarationSchema>

export default function StudentApplicationPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: existingApp } = useMyStudentApplication()
  const submitMutation = useSubmitStudentApplication()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [applicationId, setApplicationId] = useState<number | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string; url?: string }>>({})
  const uploadMutation = useUploadStudentDocument()

  const personalForm = useForm<PersonalData>({ resolver: zodResolver(personalSchema) })
  const academicForm = useForm<AcademicData>({ resolver: zodResolver(academicSchema) })
  const learningForm = useForm<LearningData>({ resolver: zodResolver(learningSchema) })
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
    else if (step === 1) valid = await academicForm.trigger()
    else if (step === 2) valid = await learningForm.trigger()
    else if (step === 3) valid = await declarationForm.trigger()
    else valid = true

    if (valid) {
      const stepData = step === 0 ? personalForm.getValues() :
                       step === 1 ? academicForm.getValues() :
                       step === 2 ? learningForm.getValues() :
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
      interested_courses: formData.interested_courses ? (formData.interested_courses as string).split(',').map((s: string) => s.trim()) : [],
      learning_category: formData.learning_category ? (formData.learning_category as string).split(',').map((s: string) => s.trim()) : [],
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
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNIC / Passport</label><Input placeholder="35202-1234567-1" {...personalForm.register('cnic_passport')} /></div>
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Academic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Qualification</label><Input placeholder="Intermediate / Bachelors" {...academicForm.register('current_qualification')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School / College / University</label><Input placeholder="Institution name" {...academicForm.register('school_college_university')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Previous Qualification</label><Input placeholder="Matric / Intermediate" {...academicForm.register('previous_qualification')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field of Study</label><Input placeholder="Computer Science" {...academicForm.register('field_of_study')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GPA / Percentage</label><Input placeholder="3.5 / 85%" {...academicForm.register('gpa_percentage')} /></div>
          </div>
        </div>
      )
      case 2: return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interested Courses (comma separated)</label><Input placeholder="Web Development, Data Science" {...learningForm.register('interested_courses')} /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Learning Category</label><Input placeholder="Programming, Design, Business" {...learningForm.register('learning_category')} /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Previous Learning Experience</label><Input placeholder="Completed XYZ course on Udemy" {...learningForm.register('previous_experience')} /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Career Goals</label>
              <textarea className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white h-24" placeholder="Describe your career goals..." {...learningForm.register('career_goals')} />
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Learning Mode</label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" {...learningForm.register('learning_mode')}>
                <option value="">Select</option><option value="online">Online</option><option value="in_person">In Person</option><option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Availability</label><Input placeholder="Weekends / Evenings" {...learningForm.register('availability')} /></div>
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
              { type: 'cnic', label: 'CNIC / Passport', accept: '.jpg,.jpeg,.png,.pdf', max: 5 * 1024 * 1024 },
              { type: 'academic_certificates', label: 'Academic Certificates', accept: '.pdf,.jpg,.jpeg,.png', max: 10 * 1024 * 1024 },
              { type: 'transcript', label: 'Transcript', accept: '.pdf,.jpg,.jpeg,.png', max: 10 * 1024 * 1024 },
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Application</h1>
          <p className="text-gray-500 mt-1">Complete the form below to apply as a student</p>
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
              <Button onClick={() => router.push('/apply/success?type=student')}>
                Finish <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
