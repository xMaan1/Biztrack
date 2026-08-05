'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/src/components/layout';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Avatar,
  AvatarFallback,
} from '@/src/components/ui/avatar';
import {
  Progress,
} from '@/src/components/ui/progress';
import {
  TaskDialog,
} from '@/src/components/tasks';
import { TaskMessagesPanel } from '@/src/components/tasks/TaskMessagesPanel';
import {
  ArrowLeft,
  Calendar,
  User,
  Timer,
  Trash2,
  Edit,
  Loader2,
  Plus,
  CheckCircle2,
  Circle,
  MessageCircle,
  AlertTriangle,
  Clock,
  Pencil,
  Users,
  ClipboardList,
} from 'lucide-react';
import {
  Task,
  TaskStatus,
  TaskPriority,
  SubTask,
  TaskCreate,
  TaskUpdate,
} from '@/src/models/task';
import { Project } from '@/src/models/project/Project';
import { User as AuthUser } from '@/src/models/auth';
import { apiService } from '@/src/services/ApiService';
import { extractErrorMessage } from '@/src/utils/errorUtils';
import { toast } from 'sonner';
import { usePermissions } from '@/src/hooks/usePermissions';
import {
  formatDurationHms,
  getEstimatedDurationSeconds,
  getLiveTrackedSeconds,
} from '@/src/utils/taskTimeUtils';

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.COMPLETED]: 'Completed',
  [TaskStatus.CANCELLED]: 'Cancelled',
};

const STATUS_BADGE_STYLES: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
  [TaskStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-200',
};

const PRIORITY_BADGE_STYLES: Record<TaskPriority, string> = {
  [TaskPriority.CRITICAL]: 'bg-red-100 text-red-800 border-red-200',
  [TaskPriority.HIGH]: 'bg-orange-100 text-orange-800 border-orange-200',
  [TaskPriority.MEDIUM]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TaskPriority.LOW]: 'bg-green-100 text-green-800 border-green-200',
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function sortSubtasks(subtasks: SubTask[]): SubTask[] {
  return [...subtasks].sort((a, b) => {
    if (a.status === b.status) return 0;
    if (a.status === TaskStatus.COMPLETED) return 1;
    if (b.status === TaskStatus.COMPLETED) return -1;
    return 0;
  });
}

function TaskDetail() {
  const params = useParams();
  const router = useRouter();
  const taskId = typeof params.id === 'string' ? params.id : '';
  const { canCreateTasks, canUpdateTasks, canDeleteTasks } = usePermissions();

  const [task, setTask] = useState<Task | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'chat'>(
    'details',
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingSubtask, setDeletingSubtask] = useState<SubTask | null>(null);

  const [addSubtaskOpen, setAddSubtaskOpen] = useState(false);
  const [subtaskLoading, setSubtaskLoading] = useState(false);
  const [subtaskError, setSubtaskError] = useState<string | null>(null);

  const [, setTick] = useState(0);

  const projectMap = useCallback(() => {
    const map: Record<string, Project> = {};
    projects.forEach((p) => (map[p.id] = p));
    return map;
  }, [projects]);

  const fetchTask = useCallback(async () => {
    if (!taskId) {
      router.replace('/tasks');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getTask(taskId);
      let resolved = data as Task;
      if (Array.isArray(data)) resolved = (data as unknown as Task[])[0];
      else if (
        data &&
        typeof data === 'object' &&
        'task' in data &&
        (data as { task?: Task }).task
      ) {
        resolved = (data as { task: Task }).task;
      } else if (
        data &&
        typeof data === 'object' &&
        'data' in data &&
        (data as { data?: { id?: string } }).data?.id
      ) {
        resolved = (data as { data: Task }).data;
      }
      setTask(resolved);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load task'));
    } finally {
      setLoading(false);
    }
  }, [taskId, router]);

  useEffect(() => {
    void fetchTask();
  }, [fetchTask]);

  useEffect(() => {
    Promise.all([apiService.getProjects(), apiService.getUsers()])
      .then(([projectsRes, usersRes]) => {
        setProjects(projectsRes.projects || []);
        setUsers(usersRes.users || []);
      })
      .catch(() => {
        // non-fatal: project/user names resolve to "—"
      });
  }, []);

  useEffect(() => {
    if (!task?.isTimerActive) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [task?.isTimerActive]);

  const liveTrackedSeconds = task
    ? getLiveTrackedSeconds(
        task.trackedSeconds || 0,
        task.isTimerActive,
        task.activeTimerStartedAt,
      )
    : 0;

  const estimatedSeconds = task ? getEstimatedDurationSeconds(task) : 0;
  const liveRemainingSeconds = task
    ? Math.max(0, estimatedSeconds - liveTrackedSeconds)
    : 0;

  const isTimeLow = task
    ? !!task.isTimeLow ||
      (estimatedSeconds > 0 &&
        liveRemainingSeconds > 0 &&
        ((task.reminderHours || 0) * 3600 +
          (task.reminderMinutes || 0) * 60 +
          (task.reminderSeconds || 0)) >
          0 &&
        liveRemainingSeconds <=
          (task.reminderHours || 0) * 3600 +
            (task.reminderMinutes || 0) * 60 +
            (task.reminderSeconds || 0))
    : false;

  const completionPercentage = task
    ? task.subtaskCount > 0
      ? Math.round((task.completedSubtaskCount / task.subtaskCount) * 100)
      : task.status === TaskStatus.COMPLETED
        ? 100
        : 0
    : 0;

  const subtasks = task ? sortSubtasks(task.subtasks || []) : [];

  const handleSaveData = async (data: TaskCreate | TaskUpdate) => {
    if (!task) return;
    try {
      setEditLoading(true);
      setEditError(null);
      await apiService.updateTask(task.id, data);
      setEditOpen(false);
      toast.success('Task updated');
      await fetchTask();
    } catch (err) {
      setEditError(extractErrorMessage(err, 'Failed to update task'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleStatusChange = async (status: TaskStatus) => {
    if (!task) return;
    try {
      await apiService.updateTask(task.id, { status });
      toast.success(`Task marked as ${STATUS_LABELS[status]}`);
      await fetchTask();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to update task status'));
    }
  };

  const handleSubtaskToggle = async (
    subtask: SubTask,
    status: TaskStatus,
  ) => {
    try {
      await apiService.updateTask(subtask.id, { status });
      await fetchTask();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to update subtask'));
    }
  };

  const handleAddSubtask = async (data: TaskCreate | TaskUpdate) => {
    if (!task) return;
    try {
      setSubtaskLoading(true);
      setSubtaskError(null);
      await apiService.createSubtask(task.id, data);
      setAddSubtaskOpen(false);
      toast.success('Subtask created');
      await fetchTask();
    } catch (err) {
      setSubtaskError(extractErrorMessage(err, 'Failed to create subtask'));
    } finally {
      setSubtaskLoading(false);
    }
  };

  const handleEditSubtask = (subtask: SubTask) => {
    setTask({
      ...subtask,
      project: task?.project || '',
      subtasks: [],
      subtaskCount: 0,
      completedSubtaskCount: 0,
    });
    setEditOpen(true);
  };

  const handleConfirmDelete = async () => {
    const target = deletingSubtask || task;
    if (!target) return;
    try {
      setDeleting(true);
      await apiService.deleteTask(target.id);
      setDeleteOpen(false);
      toast.success(
        deletingSubtask ? 'Subtask deleted' : 'Task deleted',
      );
      if (deletingSubtask) {
        setDeletingSubtask(null);
        await fetchTask();
      } else {
        router.push('/tasks');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete task'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-100">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-100">
        <div className="container mx-auto px-6 py-8">
          <Card className="modern-card">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to load task
              </h3>
              <p className="text-gray-600 mb-6">{error || 'Task not found'}</p>
              <Button variant="outline" onClick={() => router.push('/tasks')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tasks
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const projectName = task.project
    ? projectMap()[task.project]?.name || task.project
    : '—';
  const createdByName = task.createdBy?.name || '—';

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 font-['Inter',sans-serif]">
      <style>{`
        .task-tab { position: relative; cursor: pointer; color: #6b7280; transition: color 0.2s; }
        .task-tab:hover { color: #374151; }
        .task-tab.active { color: #2563eb; font-weight: 500; }
        .task-tab.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #2563eb;
        }
      `}</style>
      <div className="container mx-auto px-6 py-8 space-y-6 max-w-[1400px]">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {task.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={STATUS_BADGE_STYLES[task.status]}>
                  {STATUS_LABELS[task.status]}
                </Badge>
                <Badge className={PRIORITY_BADGE_STYLES[task.priority]}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>
                {task.parentTaskId && (
                  <Badge variant="outline" className="border-gray-300 text-gray-600">
                    Subtask
                  </Badge>
                )}
                {task.isTimerActive && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                    <Timer className="mr-1 h-3 w-3 animate-pulse" />
                    Timer Running
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {canUpdateTasks() && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="outline" onClick={() => setActiveTab('chat')}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>
            {canDeleteTasks() && (
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => {
                  setDeletingSubtask(null);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Status quick actions */}
        {canUpdateTasks() && (
          <Card className="modern-card">
            <CardContent className="p-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-600 mr-2">
                Change status:
              </span>
              {Object.values(TaskStatus).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={task.status === status ? 'default' : 'outline'}
                  onClick={() => void handleStatusChange(status)}
                >
                  {STATUS_LABELS[status]}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Card className="modern-card">
          <CardContent className="p-6">
            <div className="flex gap-6 border-b border-gray-100 pb-2 mb-5 text-sm text-gray-500">
              <button
                className={`task-tab ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button
                className={`task-tab ${activeTab === 'subtasks' ? 'active' : ''}`}
                onClick={() => setActiveTab('subtasks')}
              >
                Subtasks ({task.subtaskCount})
              </button>
              <button
                className={`task-tab ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Chat
              </button>
            </div>

            {activeTab === 'details' && (
              <div className="space-y-6">
                {task.description && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <ClipboardList className="h-4 w-4 text-gray-400" />
                      Description
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Project
                    </div>
                    <div className="text-sm text-gray-800 flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-blue-500" />
                      {projectName}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Assigned To
                    </div>
                    <div className="text-sm text-gray-800 flex items-center gap-2">
                      {task.assignedTo?.name ? (
                        <>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-gradient-primary text-white">
                              {task.assignedTo.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {task.assignedTo.name}
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4 text-gray-400" />
                          Unassigned
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Due Date
                    </div>
                    <div className="text-sm text-gray-800 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : '—'}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Created By
                    </div>
                    <div className="text-sm text-gray-800 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      {createdByName}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Created
                    </div>
                    <div className="text-sm text-gray-800 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {formatDate(task.createdAt)}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Last Updated
                    </div>
                    <div className="text-sm text-gray-800 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {formatDate(task.updatedAt)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`rounded-lg p-4 border ${
                      isTimeLow ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-500 uppercase mb-3">
                      Time Tracking
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-xl font-bold text-gray-900">
                          {formatDurationHms(liveTrackedSeconds)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Tracked</div>
                      </div>
                      {estimatedSeconds > 0 && (
                        <>
                          <div>
                            <div className="text-xl font-bold text-gray-900">
                              {formatDurationHms(estimatedSeconds)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Estimated
                            </div>
                          </div>
                          <div>
                            <div
                              className={`text-xl font-bold ${
                                isTimeLow ? 'text-amber-700' : 'text-gray-900'
                              }`}
                            >
                              {formatDurationHms(liveRemainingSeconds)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Remaining
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    {isTimeLow && (
                      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-amber-800">
                        <AlertTriangle className="h-3 w-3" />
                        Time is running low on this task
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-3">
                      Tags
                    </div>
                    {task.tags && task.tags.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {task.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs border-gray-300 text-gray-600"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">—</div>
                    )}
                  </div>
                </div>

                {task.subtaskCount > 0 && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        Overall Progress
                      </span>
                      <span className="text-xs font-medium text-gray-700">
                        {task.completedSubtaskCount}/{task.subtaskCount} subtasks ·{' '}
                        {completionPercentage}%
                      </span>
                    </div>
                    <Progress
                      value={completionPercentage}
                      className="h-2 rounded bg-gray-200"
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subtasks' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-800 text-sm">
                    Subtasks ({task.subtaskCount})
                  </h3>
                  {canCreateTasks() && (
                    <Button
                      size="sm"
                      className="modern-button"
                      onClick={() => setAddSubtaskOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subtask
                    </Button>
                  )}
                </div>

                {subtasks.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <Circle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-700">
                      No subtasks yet
                    </p>
                    <p className="text-sm mt-1">
                      Break this task down into smaller pieces.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:shadow-sm transition"
                      >
                        <button
                          type="button"
                          disabled={
                            !canUpdateTasks()
                          }
                          aria-label="Toggle subtask status"
                          className="mt-0.5 flex items-center justify-center h-5 w-5 rounded-full border border-gray-300 bg-white text-gray-400 hover:bg-gray-100 focus:outline-none disabled:opacity-50"
                          onClick={() =>
                            void handleSubtaskToggle(
                              subtask,
                              subtask.status === TaskStatus.COMPLETED
                                ? TaskStatus.TODO
                                : TaskStatus.COMPLETED,
                            )
                          }
                        >
                          {subtask.status === TaskStatus.COMPLETED ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={
                                subtask.status === TaskStatus.COMPLETED
                                  ? 'line-through opacity-70 text-gray-500'
                                  : 'text-gray-800'
                              }
                            >
                              {subtask.title}
                            </span>
                            <Badge
                              className={PRIORITY_BADGE_STYLES[subtask.priority]}
                            >
                              {subtask.priority.charAt(0).toUpperCase() +
                                subtask.priority.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-xs mt-1">
                            {subtask.assignedTo?.name && (
                              <span className="text-gray-500 flex items-center gap-1">
                                <Users className="h-3 w-3 text-gray-400" />
                                @{subtask.assignedTo.name}
                              </span>
                            )}
                            {subtask.dueDate && (
                              <span className="text-gray-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due:{' '}
                                {new Date(subtask.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {(subtask.trackedSeconds || 0) > 0 && (
                              <span className="text-gray-400 flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {formatDurationHms(subtask.trackedSeconds)}
                              </span>
                            )}
                          </div>
                        </div>
                        {(canUpdateTasks() || canDeleteTasks()) && (
                          <div className="flex gap-1 shrink-0">
                            {canUpdateTasks() && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit Subtask"
                                onClick={() => handleEditSubtask(subtask)}
                              >
                                <Pencil className="h-4 w-4 text-gray-500" />
                              </Button>
                            )}
                            {canDeleteTasks() && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete Subtask"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  setDeletingSubtask(subtask);
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chat' && (
              <TaskMessagesPanel taskId={task.id} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Task Dialog */}
      <TaskDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleSaveData}
        task={task}
        projects={projects}
        users={users.map((u) => ({
          id: u.id || u.userId || '',
          name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.userName,
          email: u.email,
        }))}
        loading={editLoading}
        error={editError ?? undefined}
        readOnly={!canUpdateTasks()}
      />

      {/* Add Subtask Dialog */}
      <TaskDialog
        open={addSubtaskOpen}
        onClose={() => setAddSubtaskOpen(false)}
        onSubmit={handleAddSubtask}
        parentTask={task}
        projects={projects}
        users={users.map((u) => ({
          id: u.id || u.userId || '',
          name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.userName,
          email: u.email,
        }))}
        loading={subtaskLoading}
        error={subtaskError ?? undefined}
        readOnly={!canCreateTasks()}
        defaultProjectId={task.project}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete {deletingSubtask ? 'Subtask' : 'Task'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>{deletingSubtask?.title || task.title}</strong>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TaskDetailPage() {
  return (
    <DashboardLayout>
      <ErrorBoundary>
        <TaskDetail />
      </ErrorBoundary>
    </DashboardLayout>
  );
}