'use client';



import React, { useState, useEffect, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import {

  Card,

  CardContent,

  CardHeader,

  CardTitle,

} from '../../components/ui/card';

import { Button } from '../../components/ui/button';

import { Badge } from '../../components/ui/badge';

import { Input } from '../../components/ui/input';

import { Progress } from '../../components/ui/progress';

import { Separator } from '../../components/ui/separator';

import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';

import { Label } from '../../components/ui/label';

import { Textarea } from '../../components/ui/textarea';

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from '../../components/ui/select';

import { DashboardLayout } from '../../components/layout';

import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

import { apiService } from '../../services/ApiService';

import { Project, User } from '../../models';

import {

  Plus,

  Search,

  Star,

  MoreVertical,

  Calendar,

  FolderOpen,

  Eye,

  Edit,

  Trash2,

  FolderOpen,

  CheckSquare,

  RefreshCw,

} from 'lucide-react';

import { cn } from '../../lib/utils';



const ProjectCard = React.memo(({ 

  project, 

  isStarred, 

  onToggleStarred, 

  onEditProject, 

  onDeleteProject, 

  onViewProject, 

  onViewTasks, 

  canEdit 

}: {

  project: Project;

  isStarred: boolean;

  onToggleStarred: (projectId: string) => void;

  onEditProject: (project: Project) => void;

  onDeleteProject: (project: Project) => void;

  onViewProject: (projectId: string) => void;

  onViewTasks: (projectId: string) => void;

  canEdit: boolean;

}) => {

  const handleStarClick = useCallback(() => {

    onToggleStarred(project.id);

  }, [project.id, onToggleStarred]);



  const handleEditClick = useCallback(() => {

    onEditProject(project);

  }, [project, onEditProject]);



  const handleDeleteClick = useCallback(() => {

    onDeleteProject(project);

  }, [project, onDeleteProject]);



  const handleViewClick = useCallback(() => {

    onViewProject(project.id);

  }, [project.id, onViewProject]);



  const handleTasksClick = useCallback(() => {

    onViewTasks(project.id);

  }, [project.id, onViewTasks]);



  return (

    <Card className="modern-card card-hover group">

                    <CardHeader className="pb-3">

                      <div className="flex justify-between items-start">

                        <CardTitle className="text-lg font-semibold text-gray-900 flex-1 pr-2 group-hover:text-blue-600 transition-colors line-clamp-1">

                          {project.name}

                        </CardTitle>

                        <div className="flex items-center gap-1">

                          <Button

                            variant="ghost"

                            size="icon"

              onClick={handleStarClick}

                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"

                          >

                            <Star

                              className={cn(

                                'h-4 w-4',

                  isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'

                              )}

                            />

                          </Button>

                          {canEdit && (

                            <div className="relative">

                              <Button

                                variant="ghost"

                                size="icon"

                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"

                              >

                                <MoreVertical className="h-4 w-4" />

                              </Button>

                              <div className="absolute right-0 top-8 bg-white rounded-md shadow-lg border py-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">

                                <Button

                                  variant="ghost"

                                  size="sm"

                                  onClick={handleEditClick}

                                  className="w-full justify-start px-3 py-2 text-sm"

                                >

                                  <Edit className="h-3 w-3 mr-2" />

                                  Edit

                                </Button>

                                <Button

                                  variant="ghost"

                                  size="sm"

                                  onClick={handleDeleteClick}

                                  className="w-full justify-start px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"

                                >

                                  <Trash2 className="h-3 w-3 mr-2" />

                                  Delete

                                </Button>

                              </div>

                            </div>

                          )}

                        </div>

                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">

                        {project.description || 'No description provided'}

                      </p>

                    </CardHeader>

                    <CardContent className="pt-0 space-y-4">

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-2">

                          <Badge variant={

                            project.status === 'completed' ? 'default' :

                            project.status === 'in_progress' ? 'secondary' :

                            project.status === 'on_hold' ? 'outline' : 'destructive'

                          }>

                            {project.status.replace('_', ' ')}

                          </Badge>

                          <Badge variant={

                            project.priority === 'high' ? 'destructive' :

                            project.priority === 'medium' ? 'secondary' : 'outline'

                          }>

                            {project.priority}

                          </Badge>

                        </div>

                        <div className="text-sm text-gray-500">

                          {project.completionPercent}%

                        </div>

                      </div>

                      <Progress value={project.completionPercent} className="h-2" />

                      <div className="flex items-center justify-between text-sm text-gray-600">

                        <div className="flex items-center gap-4">

                          <div className="flex items-center gap-1">

                            <Calendar className="h-3 w-3" />

                            <span>

                              {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'No start date'}

                            </span>

                          </div>

                          <div className="flex items-center gap-1">

                            <FolderOpen className="h-3 w-3" />

                            <span>

                              {project.budget ? `$${project.budget.toLocaleString()}` : 'No budget'}

                            </span>

                          </div>

                        </div>

                      </div>

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-2">

                          <Avatar className="h-6 w-6">

                            <AvatarImage src={project.projectManager.name} />

                            <AvatarFallback className="text-xs bg-gradient-secondary text-white">

                              {project.projectManager.name.charAt(0)}

                            </AvatarFallback>

                          </Avatar>

                          <span className="text-sm text-gray-600">

                            PM: {project.projectManager.name}

                          </span>

                        </div>



                        <div className="flex -space-x-2">

                          {project.teamMembers.slice(0, 3).map((member) => (

              <Avatar key={member.id} className="h-6 w-6 border-2 border-white">

                              <AvatarImage src={member.name} />

                              <AvatarFallback className="text-xs bg-gradient-secondary text-white">

                  {member.name.charAt(0)}

                              </AvatarFallback>

                            </Avatar>

                          ))}

                          {project.teamMembers.length > 3 && (

                            <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">

                              <span className="text-xs text-gray-600">

                                +{project.teamMembers.length - 3}

                              </span>

                            </div>

                          )}

                        </div>

                      </div>

                      <Separator />

                      <div className="flex gap-2">

                        <Button

                          variant="outline"

                          size="sm"

                          onClick={handleViewClick}

                          className="flex-1 modern-button"

                        >

                          <Eye className="h-3 w-3 mr-1" />

                          View

                        </Button>

                        <Button

                          variant="outline"

                          size="sm"

            onClick={handleTasksClick}

                          className="flex-1 modern-button"

                        >

                          <CheckSquare className="h-3 w-3 mr-1" />

                          View Tasks

                        </Button>

                      </div>

                    </CardContent>

                  </Card>

  );

});



ProjectCard.displayName = 'ProjectCard';



export default function ProjectsPage() {

  const { user } = useAuth();
  const { canManageProjects, isOwner } = usePermissions();

  const router = useRouter();

  

  const [mounted, setMounted] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [priorityFilter, setPriorityFilter] = useState('all');

  const [starredProjects, setStarredProjects] = useState<string[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({

    name: '',

    description: '',

    status: 'planning',

    priority: 'medium',

    startDate: '',

    endDate: '',

    budget: 0,

    notes: '',

    clientEmail: '',

    projectManagerId: '',

    teamMemberIds: [] as string[],

  });

  const [formLoading, setFormLoading] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);



  useEffect(() => {

    setMounted(true);

    fetchProjects();

    fetchUsers();

  }, []);



  const fetchProjects = useCallback(async () => {

    try {

      setLoading(true);

      const response = await apiService.get('/projects');

      setProjects(response.projects || []);

    } catch (error) {

      console.error('Failed to fetch projects:', error);

      setError('Failed to load projects');

    } finally {

      setLoading(false);

    }

  }, []);



  const fetchUsers = useCallback(async () => {

    try {

      const response = await apiService.get('/users');

      setUsers(response.users || []);

    } catch (error) {

      console.error('Failed to fetch users:', error);

    }

  }, []);



  const filteredProjects = projects.filter(project => {

    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||

                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;

  });



  const canCreateProject = useCallback(() => {
    return canManageProjects() || user?.userRole === 'super_admin';
  }, [canManageProjects, user]);



  const canEditProject = useCallback((project: Project) => {
    return canManageProjects() || user?.userRole === 'super_admin' || 
           project.projectManager.id === user?.id;
  }, [canManageProjects, user]);



  const handleCreateProject = useCallback(() => {

    setDialogMode('create');

    setSelectedProject(null);

    setFormData({

      name: '',

      description: '',

      status: 'planning',

      priority: 'medium',

      startDate: '',

      endDate: '',

      budget: 0,

      notes: '',

      clientEmail: '',

      projectManagerId: users.length > 0 ? users[0].id || '' : '',

      teamMemberIds: [],

    });

    setFormError(null);

    setDialogOpen(true);

  }, [users]);



  const handleEditProject = useCallback((project: Project) => {

    setDialogMode('edit');

    setSelectedProject(project);

    setFormData({

      name: project.name,

      description: project.description || '',

      status: project.status,

      priority: project.priority,

      startDate: project.startDate || '',

      endDate: project.endDate || '',

      budget: project.budget || 0,

      notes: project.notes || '',

      clientEmail: project.clientEmail || '',

      projectManagerId: project.projectManager.id,

      teamMemberIds: project.teamMembers.map(member => member.id),

    });

    setFormError(null);

    setDialogOpen(true);

  }, []);



  const handleDeleteProject = useCallback((project: Project) => {

    setProjectToDelete(project);

    setDeleteDialogOpen(true);

  }, []);



  const confirmDeleteProject = useCallback(async () => {

    if (projectToDelete) {

      try {

        await apiService.deleteProject(projectToDelete.id);

        await fetchProjects();

        setDeleteDialogOpen(false);

        setProjectToDelete(null);

      } catch (error: any) {

        const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to delete project';

        alert(`Delete Error: ${errorMessage}`);

      }

    }

  }, [projectToDelete, fetchProjects]);



  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {

    e.preventDefault();

    

    try {

      setFormLoading(true);

      setFormError(null);

      

      if (dialogMode === 'create') {

        await apiService.createProject(formData);

      } else if (selectedProject) {

        await apiService.updateProject(selectedProject.id, formData);

      }

      

      await fetchProjects();

      setDialogOpen(false);

    } catch (err: any) {

      setFormError(err?.response?.data?.detail || err?.message || 'Failed to save project');

    } finally {

      setFormLoading(false);

    }

  }, [formData, dialogMode, selectedProject, fetchProjects]);



  const handleTeamMemberToggle = useCallback((userId: string) => {

    setFormData(prev => ({

      ...prev,

      teamMemberIds: prev.teamMemberIds.includes(userId)

        ? prev.teamMemberIds.filter(id => id !== userId)

        : [...prev.teamMemberIds, userId]

    }));

  }, []);



  const toggleStarred = useCallback((projectId: string) => {

    setStarredProjects(prev =>

      prev.includes(projectId)

        ? prev.filter(id => id !== projectId)

        : [...prev, projectId]

    );

  }, []);



  const handleViewProject = useCallback((projectId: string) => {

    router.push(`/projects/${projectId}`);

  }, [router]);



  const handleViewTasks = useCallback((projectId: string) => {

    router.push(`/projects/${projectId}/tasks`);

  }, [router]);



  const clearFilters = useCallback(() => {

    setSearchTerm('');

    setStatusFilter('all');

    setPriorityFilter('all');

  }, []);



  if (!mounted) {

    return null;

  }



  return (

    <DashboardLayout>

      <div className="container mx-auto px-6 py-8 space-y-8">

        <div>

          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">

            Projects

          </h1>

          <p className="text-gray-600 mt-2">

            Manage and track your projects

          </p>

        </div>



        <div className="flex justify-between items-center">

          <div className="flex items-center gap-4">

            <div className="relative">

              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />

              <Input

                placeholder="Search projects..."

                value={searchTerm}

                onChange={(e) => setSearchTerm(e.target.value)}

                className="pl-10 w-64"

              />

            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>

              <SelectTrigger className="w-32">

                <SelectValue placeholder="Status" />

              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all">All Status</SelectItem>

                <SelectItem value="planning">Planning</SelectItem>

                <SelectItem value="in_progress">In Progress</SelectItem>

                <SelectItem value="on_hold">On Hold</SelectItem>

                <SelectItem value="completed">Completed</SelectItem>

                <SelectItem value="cancelled">Cancelled</SelectItem>

              </SelectContent>

            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>

              <SelectTrigger className="w-32">

                <SelectValue placeholder="Priority" />

              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all">All Priority</SelectItem>

                <SelectItem value="low">Low</SelectItem>

                <SelectItem value="medium">Medium</SelectItem>

                <SelectItem value="high">High</SelectItem>

              </SelectContent>

            </Select>

            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">

              <RefreshCw className="h-4 w-4" />

              Clear

            </Button>

          </div>

          {canCreateProject() && (

            <Button onClick={handleCreateProject} className="modern-button">

              <Plus className="h-4 w-4 mr-2" />

              New Project

            </Button>

          )}

        </div>



        {loading ? (

          <div className="flex items-center justify-center h-64">

            <RefreshCw className="h-8 w-8 animate-spin" />

          </div>

        ) : error ? (

          <Card className="modern-card">

            <CardContent className="p-8 text-center">

              <p className="text-red-600">{error}</p>

              <Button onClick={fetchProjects} className="mt-4">

                <RefreshCw className="h-4 w-4 mr-2" />

                Retry

              </Button>

            </CardContent>

          </Card>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {filteredProjects.map((project) => (

              <ProjectCard

                key={project.id}

                project={project}

                isStarred={starredProjects.includes(project.id)}

                onToggleStarred={toggleStarred}

                onEditProject={handleEditProject}

                onDeleteProject={handleDeleteProject}

                onViewProject={handleViewProject}

                onViewTasks={handleViewTasks}

                canEdit={canEditProject(project)}

              />

            ))}

          </div>

        )}



        {!loading && !error && filteredProjects.length === 0 && (

          <Card className="modern-card">

            <CardContent className="p-8 text-center">

              <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />

              <h3 className="text-lg font-semibold text-gray-900 mb-2">

                No projects found

              </h3>

              <p className="text-gray-600 mb-4">

                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'

                  ? 'Try adjusting your filters'

                  : 'Create your first project to get started'}

              </p>

              {canCreateProject() && (

                <Button onClick={handleCreateProject} className="modern-button">

                  <Plus className="h-4 w-4 mr-2" />

                  Create Project

                </Button>

              )}

            </CardContent>

          </Card>

        )}



        {dialogOpen && (

          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">

              <h2 className="text-lg font-semibold mb-4">

                {dialogMode === 'create' ? 'Create New Project' : 'Edit Project'}

              </h2>

              {formError && (

                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">

                  <p className="text-red-600 text-sm">{formError}</p>

                </div>

              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>

                    <Label htmlFor="name">Project Name *</Label>

                    <Input

                      id="name"

                      value={formData.name}

                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}

                      required

                    />

                  </div>

                  <div>

                    <Label htmlFor="status">Status</Label>

                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>

                      <SelectTrigger>

                        <SelectValue />

                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value="planning">Planning</SelectItem>

                        <SelectItem value="in_progress">In Progress</SelectItem>

                        <SelectItem value="on_hold">On Hold</SelectItem>

                        <SelectItem value="completed">Completed</SelectItem>

                        <SelectItem value="cancelled">Cancelled</SelectItem>

                      </SelectContent>

                    </Select>

                  </div>

                  

                  <div>

                    <Label htmlFor="startDate">Start Date</Label>

                    <Input

                      id="startDate"

                      type="date"

                      value={formData.startDate || ''}

                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}

                    />

                  </div>

                  

                  <div>

                    <Label htmlFor="endDate">End Date</Label>

                    <Input

                      id="endDate"

                      type="date"

                      value={formData.endDate || ''}

                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}

                    />

                  </div>

                  

                  <div>

                    <Label htmlFor="budget">Budget</Label>

                    <Input

                      id="budget"

                      type="number"

                      value={formData.budget}

                      onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}

                    />

                  </div>

                  <div>

                    <Label htmlFor="priority">Priority</Label>

                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>

                      <SelectTrigger>

                        <SelectValue />

                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value="low">Low</SelectItem>

                        <SelectItem value="medium">Medium</SelectItem>

                        <SelectItem value="high">High</SelectItem>

                      </SelectContent>

                    </Select>

                  </div>

                </div>

                

                <div>

                  <Label htmlFor="description">Description</Label>

                  <Textarea

                    id="description"

                    value={formData.description}

                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}

                    rows={3}

                  />

                </div>

                

                <div>

                  <Label htmlFor="clientEmail">Client Email</Label>

                  <Input

                    id="clientEmail"

                    type="email"

                    value={formData.clientEmail}

                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}

                  />

                </div>

                

                <div>

                  <Label htmlFor="notes">Notes</Label>

                  <Textarea

                    id="notes"

                    value={formData.notes}

                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}

                    rows={2}

                  />

                </div>

                

                <div>

                  <Label htmlFor="projectManager">Project Manager</Label>

                  <Select value={formData.projectManagerId} onValueChange={(value) => setFormData({ ...formData, projectManagerId: value })}>

                    <SelectTrigger>

                      <SelectValue placeholder="Select project manager" />

                    </SelectTrigger>

                    <SelectContent>

                      {users.map((user) => (

                        <SelectItem key={user.id} value={user.id || ''}>

                          {user.firstName} {user.lastName}

                        </SelectItem>

                      ))}

                    </SelectContent>

                  </Select>

                </div>

                

                <div>

                  <Label>Team Members</Label>

                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">

                    {users.map((user) => (

                      <div key={user.id} className="flex items-center space-x-2">

                        <input

                          type="checkbox"

                          id={`member-${user.id}`}

                          checked={formData.teamMemberIds.includes(user.id || '')}

                          onChange={() => handleTeamMemberToggle(user.id || '')}

                          className="rounded"

                        />

                        <Label htmlFor={`member-${user.id}`} className="text-sm">

                          {user.firstName} {user.lastName}

                        </Label>

                      </div>

                    ))}

                  </div>

                </div>

                

                <div className="flex justify-end gap-2 pt-4">

                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>

                    Cancel

                  </Button>
                  <Button type="submit" disabled={formLoading} className="modern-button">
                    {formLoading ? 'Saving...' : dialogMode === 'create' ? 'Create Project' : 'Update Project'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {deleteDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-lg font-semibold mb-4">Delete Project</h2>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmDeleteProject} className="bg-red-600 hover:bg-red-700">
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}