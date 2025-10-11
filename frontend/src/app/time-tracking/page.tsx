'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout';
import { TimeTracker } from '../../components/timeTracking/TimeTracker';
import { TimeStats } from '../../components/timeTracking/TimeStats';
import { TimeEntryList } from '../../components/timeTracking/TimeEntryList';
import { timeTrackingService } from '../../services/TimeTrackingService';
import { TimeEntry } from '../../models/timeTracking';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/ApiService';

export default function TimeTrackingPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; name: string; projectId: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectsAndTasks();
  }, []);

  const fetchProjectsAndTasks = async () => {
    try {
      setLoading(true);
      
      const [projectsResponse, tasksResponse] = await Promise.all([
        apiService.get('/projects').catch(() => ({ projects: [] })),
        apiService.get('/tasks').catch(() => ({ tasks: [] }))
      ]);

      setProjects(projectsResponse.projects || []);
      setTasks(tasksResponse.tasks || []);
    } catch (error) {
      console.error('Failed to fetch projects and tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeEntryCreated = (timeEntry: TimeEntry) => {
    console.log('Time entry created:', timeEntry);
  };

  const handleEditTimeEntry = (timeEntry: TimeEntry) => {
    console.log('Edit time entry:', timeEntry);
  };

  const handleDeleteTimeEntry = (timeEntry: TimeEntry) => {
    console.log('Delete time entry:', timeEntry);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Time Tracking
          </h1>
          <p className="text-gray-600 mt-2">
            Track your time and manage productivity
          </p>
        </div>

        <TimeTracker
          projects={projects}
          tasks={tasks}
          onTimeEntryCreated={handleTimeEntryCreated}
        />

        <TimeStats employeeId={user?.id} />

        <TimeEntryList
          projects={projects}
          tasks={tasks}
          onEdit={handleEditTimeEntry}
          onDelete={handleDeleteTimeEntry}
        />
      </div>
    </DashboardLayout>
  );
}
