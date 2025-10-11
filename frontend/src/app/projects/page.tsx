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

import {

  Tabs,

  TabsContent,

  TabsList,

  TabsTrigger,

} from '../../components/ui/tabs';

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuSeparator,

  DropdownMenuTrigger,

} from '../../components/ui/dropdown-menu';

import { DashboardLayout } from '../../components/layout';

import { Project, ProjectCreate, ProjectStatus, ProjectPriority } from '../../models/project';

import { User } from '../../models/auth';

import { apiService } from '../../services/ApiService';

import { useAuth } from '../../contexts/AuthContext';

import { useCurrency } from '../../contexts/CurrencyContext';

import { Alert, AlertDescription } from '../../components/ui/alert';

import {

  Search,

  Plus,

  Star,

  MoreVertical,

  Eye,

  Edit,

  Trash2,

  FolderOpen,

  CheckSquare,

  Calendar,

  DollarSign,

  Filter,

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

  const { getCurrencySymbol } = useCurrency();



  const handleStarClick = useCallback((e: React.MouseEvent) => {

    e.stopPropagation();

    onToggleStarred(project.id);

  }, [project.id, onToggleStarred]);



  const handleViewClick = useCallback((e: React.MouseEvent) => {

    e.stopPropagation();

    onViewProject(project.id);

  }, [project.id, onViewProject]);



  const handleTasksClick = useCallback((e: React.MouseEvent) => {

    e.stopPropagation();

    onViewTasks(project.id);

  }, [project.id, onViewTasks]);



  const handleEditClick = useCallback(() => {

    onEditProject(project);

  }, [project, onEditProject]);



  const handleDeleteClick = useCallback(() => {

    onDeleteProject(project);

  }, [project, onDeleteProject]);



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

                          <DropdownMenu>

                            <DropdownMenuTrigger asChild>

                              <Button

                                variant="ghost"

                                size="icon"

                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"

                              >

                                <MoreVertical className="h-4 w-4" />

                              </Button>

                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-48">

                <DropdownMenuItem onClick={handleViewClick}>

                                <Eye className="h-4 w-4 mr-2" />

                                View Details

                              </DropdownMenuItem>

                <DropdownMenuItem onClick={handleTasksClick}>

                                <FolderOpen className="h-4 w-4 mr-2" />

                                Manage Tasks

                              </DropdownMenuItem>

                {canEdit && (

                  <DropdownMenuItem onClick={handleEditClick}>

                                  <Edit className="h-4 w-4 mr-2" />

                                  Edit Project

                                </DropdownMenuItem>

                              )}

                              <DropdownMenuSeparator />

                {canEdit && (

                                <DropdownMenuItem

                    onClick={handleDeleteClick}

                                  className="text-red-600 focus:text-red-600"

                                >

                                  <Trash2 className="h-4 w-4 mr-2" />

                                  Delete Project

                                </DropdownMenuItem>

                              )}

                            </DropdownMenuContent>

                          </DropdownMenu>

                        </div>

                      </div>



                      <p className="text-sm text-gray-600 line-clamp-2 mt-2">

                        {project.description}

                      </p>

                    </CardHeader>



                    <CardContent className="pt-0">

                      <div className="flex gap-2 mb-4 flex-wrap">

          <Badge variant="outline" className="text-xs font-medium">

                          {project.status.replace('_', ' ').toUpperCase()}

                        </Badge>

          <Badge variant="outline" className="text-xs font-medium">

                          {project.priority.toUpperCase()}

                        </Badge>

                      </div>



                      <div className="mb-4">

                        <div className="flex justify-between items-center mb-2">

            <span className="text-sm font-medium text-gray-700">Progress</span>

                          <span className="text-sm font-bold text-gray-900">

                            {project.completionPercent}%

                          </span>

                        </div>

          <Progress value={project.completionPercent} className="h-2" />

                      </div>



                      <Separator className="my-4" />



                      <div className="flex items-center justify-between mb-4">

                        <div className="flex items-center gap-2">

                          <Avatar className="h-6 w-6">

                            <AvatarImage src={project.projectManager.name} />

                            <AvatarFallback className="text-xs bg-gradient-primary text-white">

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



                      <div className="flex justify-between items-center text-xs text-gray-500 mb-4">

                        <div className="flex items-center gap-1">

                          <Calendar className="h-3 w-3" />

            <span>Due: {new Date(project.endDate).toLocaleDateString()}</span>

                        </div>

                        {project.budget && (

                          <div className="flex items-center gap-1">

                            <DollarSign className="h-3 w-3" />

                            <span>{getCurrencySymbol()}{project.budget.toLocaleString()}</span>

                          </div>

                        )}

                      </div>



                      <div className="flex gap-2">

                        <Button

                          variant="outline"

                          size="sm"

            onClick={handleViewClick}

                          className="flex-1"

                        >

                          <Eye className="h-3 w-3 mr-1" />

                          Details

                        </Button>

                        <Button

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

  const router = useRouter();

  

  const [mounted, setMounted] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [priorityFilter, setPriorityFilter] = useState('all');

  const [activeTab, setActiveTab] = useState('all');

  const [starredProjects, setStarredProjects] = useState<string[]>([]);

  const [sortBy] = useState('name');

  const [dialogOpen, setDialogOpen] = useState(false);

  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  

  // Form states

  const [formData, setFormData] = useState<ProjectCreate>({

    name: '',

    description: '',

    status: ProjectStatus.PLANNING,

    priority: ProjectPriority.MEDIUM,

    startDate: '',

    endDate: '',

    budget: undefined,

    notes: '',

    clientEmail: '',

    projectManagerId: '',

    teamMemberIds: [],

  });

  const [formLoading, setFormLoading] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);



  useEffect(() => {

    setMounted(true);

  }, []);



  const fetchProjects = useCallback(async () => {

    try {

      setLoading(true);

      setError(null);

      const response = await apiService.get('/projects');

      setProjects(response.projects || []);

    } catch (err: any) {

      setError(err?.response?.data?.detail || err?.message || 'Failed to fetch projects');

    } finally {

      setLoading(false);

    }

  }, []);



  const fetchUsers = useCallback(async () => {

    try {

      const response = await apiService.getUsers();

      setUsers(response.users || []);

    } catch (err: any) {

      console.error('Failed to fetch users:', err);

    }

  }, []);



  useEffect(() => {

    if (mounted) {

      Promise.all([fetchProjects(), fetchUsers()]);

    }

  }, [mounted, fetchProjects, fetchUsers]);



  const filteredProjects = React.useMemo(() => {

    let filtered = [...projects];



    if (searchTerm) {

      filtered = filtered.filter(project =>

        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||

        project.description.toLowerCase().includes(searchTerm.toLowerCase())

      );

    }



    if (statusFilter !== 'all') {

      filtered = filtered.filter(project => project.status === statusFilter);

    }



    if (priorityFilter !== 'all') {

      filtered = filtered.filter(project => project.priority === priorityFilter);

    }



    if (activeTab === 'my') {

      filtered = filtered.filter(project => project.projectManager.id === user?.id);

    } else if (activeTab === 'starred') {

      filtered = filtered.filter(project => starredProjects.includes(project.id));

    }



    filtered.sort((a, b) => {

      switch (sortBy) {

        case 'name':

          return a.name.localeCompare(b.name);

        case 'status':

          return a.status.localeCompare(b.status);

        case 'priority':

          return a.priority.localeCompare(b.priority);

        case 'progress':

          return b.completionPercent - a.completionPercent;

        case 'endDate':

          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();

        default:

          return 0;

      }

    });



    return filtered;

  }, [projects, searchTerm, statusFilter, priorityFilter, activeTab, starredProjects, sortBy, user?.id]);



  const canCreateProject = useCallback(() => {

    return !!user;

  }, [user]);



  const canEditProject = useCallback((project: Project) => {

    return (

      user?.userRole === 'super_admin' ||

      (user?.userRole === 'project_manager' && project.projectManager.id === user.id)

    );

  }, [user]);



  const handleCreateProject = useCallback(() => {

    setSelectedProject(null);

    setDialogMode('create');

    setFormData({

      name: '',

      description: '',

      status: ProjectStatus.PLANNING,

      priority: ProjectPriority.MEDIUM,

      startDate: '',

      endDate: '',

      budget: undefined,

      notes: '',

      clientEmail: '',

      projectManagerId: user?.id || '',

      teamMemberIds: [],

    });

    setFormError(null);

    setDialogOpen(true);

  }, [user?.id]);



  const handleEditProject = useCallback((project: Project) => {

    setSelectedProject(project);

    setDialogMode('edit');

    setFormData({

      name: project.name,

      description: project.description,

      status: project.status,

      priority: project.priority,

      startDate: project.startDate,

      endDate: project.endDate,

      budget: project.budget,

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

                <SelectItem value="all">All Priorities</SelectItem>

                <SelectItem value="low">Low</SelectItem>

                <SelectItem value="medium">Medium</SelectItem>

                <SelectItem value="high">High</SelectItem>

                <SelectItem value="critical">Critical</SelectItem>

              </SelectContent>

            </Select>

            <Button variant="outline" onClick={clearFilters}>

              <Filter className="h-4 w-4 mr-2" />

              Clear

            </Button>

          </div>



          {canCreateProject() && (

            <Button onClick={handleCreateProject} className="modern-button">

              <Plus className="h-4 w-4 mr-2" />

              Create Project

            </Button>

          )}

        </div>



        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">

            <TabsTrigger value="all">All Projects</TabsTrigger>

            <TabsTrigger value="my">My Projects</TabsTrigger>

            <TabsTrigger value="starred">Starred</TabsTrigger>

          </TabsList>



          <TabsContent value={activeTab} className="space-y-6">

            {loading && (

              <div className="flex items-center justify-center py-8">

                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>

              </div>

            )}



            {error && (

              <div className="flex flex-col items-center justify-center py-8">

                <p className="text-red-500 text-lg mb-4">{error}</p>

                <Button onClick={fetchProjects} variant="outline">

                  <RefreshCw className="h-4 w-4 mr-2" />

                  Retry

                </Button>

              </div>

            )}



            {!loading && !error && (

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

          </TabsContent>

        </Tabs>



        {dialogOpen && (

          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">

              <h2 className="text-lg font-semibold mb-4">

                {dialogMode === 'create' ? 'Create New Project' : 'Edit Project'}

              </h2>

              

              <form onSubmit={handleFormSubmit} className="space-y-6">

                {formError && (

                  <Alert variant="destructive">

                    <AlertDescription>{formError}</AlertDescription>

                  </Alert>

                )}

                

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="md:col-span-2">

                    <Label htmlFor="name">Project Name *</Label>

                    <Input

                      id="name"

                      value={formData.name}

                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}

                      placeholder="Enter project name"

                      required

                    />

                  </div>

                  

                  <div className="md:col-span-2">

                    <Label htmlFor="description">Description</Label>

                    <Textarea

                      id="description"

                      value={formData.description || ''}

                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}

                      placeholder="Enter project description"

                      rows={3}

                    />

                  </div>

                  

                  <div>

                    <Label htmlFor="status">Status</Label>

                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as ProjectStatus })}>

                      <SelectTrigger>

                        <SelectValue />

                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value={ProjectStatus.PLANNING}>Planning</SelectItem>

                        <SelectItem value={ProjectStatus.IN_PROGRESS}>In Progress</SelectItem>

                        <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>

                        <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>

                        <SelectItem value={ProjectStatus.CANCELLED}>Cancelled</SelectItem>

                      </SelectContent>

                    </Select>

                  </div>

                  

                  <div>

                    <Label htmlFor="priority">Priority</Label>

                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as ProjectPriority })}>

                      <SelectTrigger>

                        <SelectValue />

                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value={ProjectPriority.LOW}>Low</SelectItem>

                        <SelectItem value={ProjectPriority.MEDIUM}>Medium</SelectItem>

                        <SelectItem value={ProjectPriority.HIGH}>High</SelectItem>

                        <SelectItem value={ProjectPriority.CRITICAL}>Critical</SelectItem>

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

                      value={formData.budget || ''}

                      onChange={(e) => setFormData({ ...formData, budget: e.target.value ? Number(e.target.value) : undefined })}

                      placeholder="Enter budget amount"

                    />

                  </div>

                  

                  <div>

                    <Label htmlFor="clientEmail">Client Email</Label>

                    <Input

                      id="clientEmail"

                      type="email"

                      value={formData.clientEmail || ''}

                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}

                      placeholder="Enter client email"

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

                          <SelectItem key={user.id} value={user.id}>

                            {user.firstName} {user.lastName} ({user.email})

                          </SelectItem>

                        ))}

                      </SelectContent>

                    </Select>

                  </div>

                  

                  <div className="md:col-span-2">

                    <Label htmlFor="notes">Notes</Label>

                    <Textarea

                      id="notes"

                      value={formData.notes}

                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}

                      placeholder="Additional notes..."

                      rows={3}

                    />

                  </div>

                  

                  <div className="md:col-span-2">

                    <Label>Team Members</Label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-2">

                      {users.map((user) => (

                        <div key={user.id} className="flex items-center space-x-2">

                          <input

                            type="checkbox"

                            id={`member-${user.id}`}

                            checked={formData.teamMemberIds.includes(user.id)}

                            onChange={() => handleTeamMemberToggle(user.id)}

                            className="rounded"

                          />

                          <Label htmlFor={`member-${user.id}`} className="text-sm">

                            {user.firstName} {user.lastName} ({user.email})

                          </Label>

                        </div>

                      ))}

                    </div>

                  </div>

                </div>

                

                <div className="flex gap-2 justify-end">

                  <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={formLoading}>

                    Cancel

                  </Button>

                  <Button type="submit" className="modern-button" disabled={formLoading}>

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
      name: project.name,

      description: project.description,

      status: project.status,

      priority: project.priority,

      startDate: project.startDate,

      endDate: project.endDate,

      budget: project.budget,

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

                <SelectItem value="all">All Priorities</SelectItem>

                <SelectItem value="low">Low</SelectItem>

                <SelectItem value="medium">Medium</SelectItem>

                <SelectItem value="high">High</SelectItem>

                <SelectItem value="critical">Critical</SelectItem>

              </SelectContent>

            </Select>

            <Button variant="outline" onClick={clearFilters}>

              <Filter className="h-4 w-4 mr-2" />

              Clear

            </Button>

          </div>



          {canCreateProject() && (

            <Button onClick={handleCreateProject} className="modern-button">

              <Plus className="h-4 w-4 mr-2" />

              Create Project

            </Button>

          )}

        </div>



        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">

            <TabsTrigger value="all">All Projects</TabsTrigger>

            <TabsTrigger value="my">My Projects</TabsTrigger>

            <TabsTrigger value="starred">Starred</TabsTrigger>

          </TabsList>



          <TabsContent value={activeTab} className="space-y-6">

            {loading && (

              <div className="flex items-center justify-center py-8">

                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>

              </div>

            )}



            {error && (

              <div className="flex flex-col items-center justify-center py-8">

                <p className="text-red-500 text-lg mb-4">{error}</p>

                <Button onClick={fetchProjects} variant="outline">

                  <RefreshCw className="h-4 w-4 mr-2" />

                  Retry

                </Button>

              </div>

            )}



            {!loading && !error && (

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

          </TabsContent>

        </Tabs>



        {dialogOpen && (

          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">

              <h2 className="text-lg font-semibold mb-4">

                {dialogMode === 'create' ? 'Create New Project' : 'Edit Project'}

              </h2>

              

              <form onSubmit={handleFormSubmit} className="space-y-6">

                {formError && (

                  <Alert variant="destructive">

                    <AlertDescription>{formError}</AlertDescription>

                  </Alert>

                )}

                

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="md:col-span-2">

                    <Label htmlFor="name">Project Name *</Label>

                    <Input

                      id="name"

                      value={formData.name}

                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}

                      placeholder="Enter project name"

                      required

                    />

                  </div>

                  

                  <div className="md:col-span-2">

                    <Label htmlFor="description">Description</Label>

                    <Textarea

                      id="description"

                      value={formData.description || ''}

                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}

                      placeholder="Enter project description"

                      rows={3}

                    />

                  </div>

                  

                  <div>

                    <Label htmlFor="status">Status</Label>

                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as ProjectStatus })}>

                      <SelectTrigger>

                        <SelectValue />

                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value={ProjectStatus.PLANNING}>Planning</SelectItem>

                        <SelectItem value={ProjectStatus.IN_PROGRESS}>In Progress</SelectItem>

                        <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>

                        <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>

                        <SelectItem value={ProjectStatus.CANCELLED}>Cancelled</SelectItem>

                      </SelectContent>

                    </Select>

                  </div>

                  

                  <div>

                    <Label htmlFor="priority">Priority</Label>

                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as ProjectPriority })}>

                      <SelectTrigger>

                        <SelectValue />

                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value={ProjectPriority.LOW}>Low</SelectItem>

                        <SelectItem value={ProjectPriority.MEDIUM}>Medium</SelectItem>

                        <SelectItem value={ProjectPriority.HIGH}>High</SelectItem>

                        <SelectItem value={ProjectPriority.CRITICAL}>Critical</SelectItem>

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

                      value={formData.budget || ''}

                      onChange={(e) => setFormData({ ...formData, budget: e.target.value ? Number(e.target.value) : undefined })}

                      placeholder="Enter budget amount"

                    />

                  </div>

                  

                  <div>

                    <Label htmlFor="clientEmail">Client Email</Label>

                    <Input

                      id="clientEmail"

                      type="email"

                      value={formData.clientEmail || ''}

                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}

                      placeholder="Enter client email"

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

                          <SelectItem key={user.id} value={user.id}>

                            {user.firstName} {user.lastName} ({user.email})

                          </SelectItem>

                        ))}

                      </SelectContent>

                    </Select>

                  </div>

                  

                  <div className="md:col-span-2">

                    <Label htmlFor="notes">Notes</Label>

                    <Textarea

                      id="notes"

                      value={formData.notes}

                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}

                      placeholder="Additional notes..."

                      rows={3}

                    />

                  </div>

                  

                  <div className="md:col-span-2">

                    <Label>Team Members</Label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-2">

                      {users.map((user) => (

                        <div key={user.id} className="flex items-center space-x-2">

                          <input

                            type="checkbox"

                            id={`member-${user.id}`}

                            checked={formData.teamMemberIds.includes(user.id)}

                            onChange={() => handleTeamMemberToggle(user.id)}

                            className="rounded"

                          />

                          <Label htmlFor={`member-${user.id}`} className="text-sm">

                            {user.firstName} {user.lastName} ({user.email})

                          </Label>

                        </div>

                      ))}

                    </div>

                  </div>

                </div>

                

                <div className="flex gap-2 justify-end">

                  <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={formLoading}>

                    Cancel

                  </Button>

                  <Button type="submit" className="modern-button" disabled={formLoading}>

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
