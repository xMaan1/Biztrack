export interface Course {
  id: number
  title: string
  code: string
  description: string | null
  credits: number
  department_id: number
  department_name: string | null
  teacher_id: number
  teacher_name: string | null
  semester: string
  academic_year: string
  max_students: number
  current_enrollment: number
  start_date: string
  end_date: string
  is_published: boolean
  thumbnail_url: string | null
  syllabus_url: string | null
  created_at: string
  updated_at: string
}

export interface CourseCreatePayload {
  title: string
  code: string
  description?: string
  credits: number
  department_id: number
  teacher_id: number
  semester: string
  academic_year: string
  max_students: number
  start_date: string
  end_date: string
  is_published?: boolean
  thumbnail_url?: string
  syllabus_url?: string
}

export interface CourseListResponse {
  courses: Course[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PaginatedCoursesParams {
  page?: number
  page_size?: number
  search?: string
  department_id?: number
  teacher_id?: number
  semester?: string
  is_published?: boolean
}
