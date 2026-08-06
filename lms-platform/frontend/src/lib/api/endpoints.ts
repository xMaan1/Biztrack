/**
 * API Endpoints Configuration
 * Centralized endpoint definitions
 */

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
  version: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
}

export const ENDPOINTS = {
  // Auth
  auth: {
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    refresh: '/api/v1/auth/refresh',
    logout: '/api/v1/auth/logout',
    changePassword: '/api/v1/auth/change-password',
    forgotPassword: '/api/v1/auth/forgot-password',
    resetPassword: '/api/v1/auth/reset-password',
    verifyEmail: '/api/v1/auth/verify-email',
  },

  // Users
  users: {
    list: '/api/v1/users/',
    me: '/api/v1/users/me',
    detail: (id: number) => `/api/v1/users/${id}`,
    create: '/api/v1/users/',
    update: (id: number) => `/api/v1/users/${id}`,
    profile: '/api/v1/users/profile',
    updateProfile: '/api/v1/users/profile',
    updatePassword: '/api/v1/users/change-password',
    delete: (id: number) => `/api/v1/users/${id}`,
    students: '/api/v1/users/students',
    teachers: '/api/v1/users/teachers',
    admins: '/api/v1/users/admins',
  },

  // Courses
  courses: {
    list: '/api/v1/courses',
    detail: (id: number) => `/api/v1/courses/${id}`,
    create: '/api/v1/courses',
    update: (id: number) => `/api/v1/courses/${id}`,
    delete: (id: number) => `/api/v1/courses/${id}`,
    publish: (id: number) => `/api/v1/courses/${id}/publish`,
    unpublish: (id: number) => `/api/v1/courses/${id}/unpublish`,
    statistics: (id: number) => `/api/v1/courses/${id}/statistics`,
    requestDeletion: (id: number) => `/api/v1/courses/${id}/request-deletion`,
    deletionRequests: '/api/v1/courses/deletion-requests',
    approveDeletion: (id: number) => `/api/v1/courses/deletion-requests/${id}/approve`,
    rejectDeletion: (id: number) => `/api/v1/courses/deletion-requests/${id}/reject`,
  },

  // Lectures
  lectures: {
     list: (courseId: number) => `/api/v1/lectures/course/${courseId}`,
    detail: (id: number) => `/api/v1/lectures/${id}`,
     create: (courseId: number) => `/api/v1/lectures/course/${courseId}`,
    update: (id: number) => `/api/v1/lectures/${id}`,
    delete: (id: number) => `/api/v1/lectures/${id}`,
    uploadVideo: (id: number) => `/api/v1/lectures/${id}/upload-video`,
    uploadMedia: (id: number) => `/api/v1/lectures/${id}/upload-media`,
    publish: (id: number) => `/api/v1/lectures/${id}/publish`,
    unpublish: (id: number) => `/api/v1/lectures/${id}/unpublish`,
    progress: '/api/v1/lectures/progress',
    materials: (lectureId: number) => `/api/v1/lectures/${lectureId}/materials`,
  },

  // Attendance
  attendance: {
    sessions: '/api/v1/attendance/sessions',
    sessionDetail: (id: number) => `/api/v1/attendance/sessions/${id}`,
    createSession: '/api/v1/attendance/sessions',
    updateSession: (id: number) => `/api/v1/attendance/sessions/${id}`,
    regenerateQR: (id: number) => `/api/v1/attendance/sessions/${id}/regenerate-qr`,
    markAttendance: (sessionId: number) => `/api/v1/attendance/sessions/${sessionId}/mark`,
    records: (sessionId: number) => `/api/v1/attendance/sessions/${sessionId}/records`,
    myAttendance: '/api/v1/attendance/my-attendance',
    faceRecognize: '/api/v1/face-recognition/recognize',
    faceEnroll: '/api/v1/face-recognition/enroll',
    faceRemove: (studentId: number) => `/api/v1/face-recognition/enroll/${studentId}`,
  },

  // Assignments
  assignments: {
    list: '/api/v1/assignments',
    detail: (id: number) => `/api/v1/assignments/${id}`,
    my: (status?: string) => `/api/v1/assignments/my${status ? `?status=${status}` : ''}`,
    create: '/api/v1/assignments',
    update: (id: number) => `/api/v1/assignments/${id}`,
    delete: (id: number) => `/api/v1/assignments/${id}`,
    submissions: (assignmentId: number) => `/api/v1/assignments/${assignmentId}/submissions`,
    submit: (assignmentId: number) => `/api/v1/assignments/${assignmentId}/submit`,
    grade: (submissionId: number) => `/api/v1/assignments/submissions/${submissionId}/grade`,
  },

  // Grades
  grades: {
    student: (studentId: number) => `/api/v1/grades/students/${studentId}`,
    course: (courseId: number) => `/api/v1/grades/courses/${courseId}`,
    create: '/api/v1/grades',
    update: (id: number) => `/api/v1/grades/${id}`,
    summary: (studentId: number, courseId: number) => 
      `/api/v1/grades/students/${studentId}/summary?course_id=${courseId}`,
  },

  // Reports
  reports: {
    enrollmentStats: '/api/v1/reports/enrollment-stats',
    attendanceStats: (courseId: number) => `/api/v1/reports/attendance-stats?course_id=${courseId}`,
    gradeDistribution: (courseId: number) => `/api/v1/reports/grade-distribution?course_id=${courseId}`,
    coursePerformance: (courseId: number) => `/api/v1/reports/course-performance?course_id=${courseId}`,
    systemStats: '/api/v1/reports/system-stats',
  },

  // Departments
  departments: {
    list: '/api/v1/departments',
    detail: (id: number) => `/api/v1/departments/${id}`,
    create: '/api/v1/departments',
    update: (id: number) => `/api/v1/departments/${id}`,
    delete: (id: number) => `/api/v1/departments/${id}`,
  },

  // Live Sessions
  liveSessions: {
    create: '/api/v1/live-sessions',
    my: '/api/v1/live-sessions/my-sessions',
    detail: (id: number) => `/api/v1/live-sessions/${id}`,
    joinByCode: (code: string) => `/api/v1/live-sessions/join/${code}`,
    start: (id: number) => `/api/v1/live-sessions/${id}/start`,
    end: (id: number) => `/api/v1/live-sessions/${id}/end`,
    join: (code: string) => `/api/v1/live-sessions/join/${code}`,
    delete: (id: number) => `/api/v1/live-sessions/${id}`,
    active: '/api/v1/live-sessions/active/courses',
  },

  // Enrollments
  enrollments: {
    list: '/api/v1/enrollments',
    my: '/api/v1/enrollments/my-enrollments',
    create: '/api/v1/enrollments',
    update: (id: number) => `/api/v1/enrollments/${id}`,
    delete: (id: number) => `/api/v1/enrollments/${id}`,
    student: (studentId: number) => `/api/v1/enrollments/students/${studentId}`,
    course: (courseId: number) => `/api/v1/enrollments/courses/${courseId}`,
    available: '/api/v1/enrollments/available-courses',
  },

  // Notifications
  notifications: {
    list: '/api/v1/notifications',
    markRead: (id: number) => `/api/v1/notifications/${id}/read`,
    markAllRead: '/api/v1/notifications/read-all',
    delete: (id: number) => `/api/v1/notifications/${id}`,
    clearAll: '/api/v1/notifications/clear-all',
  },

  // Applications
  applications: {
    teacher: {
      submit: '/api/v1/applications/teacher',
      myApplication: '/api/v1/applications/teacher/my',
      list: '/api/v1/applications/teacher',
      stats: '/api/v1/applications/teacher/stats',
      detail: (id: number) => `/api/v1/applications/teacher/${id}`,
      review: (id: number) => `/api/v1/applications/teacher/${id}/review`,
      approve: (id: number) => `/api/v1/applications/teacher/${id}/approve`,
      reject: (id: number) => `/api/v1/applications/teacher/${id}/reject`,
      upload: (id: number) => `/api/v1/applications/teacher/${id}/upload`,
      downloadDoc: (appId: number, docId: number) => `/api/v1/applications/teacher/${appId}/documents/${docId}/download`,
    },
    student: {
      submit: '/api/v1/applications/student',
      myApplication: '/api/v1/applications/student/my',
      list: '/api/v1/applications/student',
      stats: '/api/v1/applications/student/stats',
      detail: (id: number) => `/api/v1/applications/student/${id}`,
      review: (id: number) => `/api/v1/applications/student/${id}/review`,
      approve: (id: number) => `/api/v1/applications/student/${id}/approve`,
      reject: (id: number) => `/api/v1/applications/student/${id}/reject`,
      upload: (id: number) => `/api/v1/applications/student/${id}/upload`,
      downloadDoc: (appId: number, docId: number) => `/api/v1/applications/student/${appId}/documents/${docId}/download`,
    },
  },
}