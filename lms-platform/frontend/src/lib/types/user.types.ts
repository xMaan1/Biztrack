export interface UserProfile {
  id: number
  user_id: number
  first_name: string
  last_name: string
  middle_name?: string | null
  full_name: string
  date_of_birth?: string | null
  gender?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string
  profile_picture_url?: string | null
  bio?: string | null
  employee_id?: string | null
  student_id?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  email: string
  role: string
  department_id?: number | null
  is_active: boolean
  is_verified: boolean
  last_login_at?: string | null
  created_at: string
  updated_at: string
  department_name?: string | null
  profile?: UserProfile | null
}

export interface StudentRecord {
  id: number
  student_number?: string | null
  enrollment_year?: number | null
  gpa?: number | null
  academic_status?: string | null
}

export interface TeacherRecord {
  id: number
  employee_number?: string | null
  hire_date?: string | null
  specialization?: string | null
  employment_type?: string | null
}

export interface AdminRecord {
  id: number
  employee_number?: string | null
  admin_level?: string | null
}

export interface Student extends User {
  student_record?: StudentRecord | null
}

export interface Teacher extends User {
  teacher_record?: TeacherRecord | null
}

export interface AdminUser extends User {
  admin_record?: AdminRecord | null
}

export interface UsersResponse {
  users: User[]
  total: number
  skip: number
  limit: number
}

export interface CreateUserRequest {
  email: string
  password: string
  role: string
  department_id?: number | null
  is_active?: boolean
  is_verified?: boolean
  first_name?: string
  last_name?: string
  phone?: string
  student_number?: string
  employee_number?: string
  specialization?: string
}
