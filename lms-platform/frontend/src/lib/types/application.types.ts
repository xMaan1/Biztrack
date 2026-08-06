export interface TeacherApplication {
  id: number
  user_id: number
  status: 'submitted' | 'reviewed' | 'selected' | 'rejected'
  full_name: string
  email: string
  phone?: string | null
  cnic?: string | null
  date_of_birth?: string | null
  gender?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  highest_qualification?: string | null
  university?: string | null
  degree?: string | null
  specialization?: string | null
  teaching_experience?: string | null
  current_job?: string | null
  skills?: string[] | null
  languages?: string[] | null
  linkedin?: string | null
  portfolio_website?: string | null
  subjects?: string[] | null
  categories?: string[] | null
  online_teaching_experience?: string | null
  offline_teaching_experience?: string | null
  expected_salary?: number | null
  available_days?: string | null
  available_time?: string | null
  teaching_statement?: string | null
  reviewed_by?: number | null
  reviewed_at?: string | null
  admin_remarks?: string | null
  rejection_reason?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface StudentApplication {
  id: number
  user_id: number
  status: 'submitted' | 'reviewed' | 'selected' | 'rejected'
  full_name: string
  email: string
  phone?: string | null
  cnic_passport?: string | null
  date_of_birth?: string | null
  gender?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  current_qualification?: string | null
  school_college_university?: string | null
  previous_qualification?: string | null
  field_of_study?: string | null
  gpa_percentage?: string | null
  interested_courses?: string[] | null
  learning_category?: string[] | null
  previous_experience?: string | null
  career_goals?: string | null
  learning_mode?: string | null
  availability?: string | null
  reviewed_by?: number | null
  reviewed_at?: string | null
  admin_remarks?: string | null
  rejection_reason?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ApplicationDocument {
  id: number
  application_type: 'teacher' | 'student'
  application_id: number
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  mime_type?: string | null
  created_at?: string | null
}

export interface ApplicationStatusLog {
  id: number
  application_type: 'teacher' | 'student'
  application_id: number
  old_status?: string | null
  new_status: string
  changed_by?: number | null
  remarks?: string | null
  created_at?: string | null
}

export interface ApplicationDetail {
  application: TeacherApplication | StudentApplication
  documents: ApplicationDocument[]
  status_logs: ApplicationStatusLog[]
}

export interface ApplicationListResponse {
  applications: (TeacherApplication | StudentApplication)[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ApplicationStats {
  total: number
  submitted: number
  reviewed: number
  selected: number
  rejected: number
}
