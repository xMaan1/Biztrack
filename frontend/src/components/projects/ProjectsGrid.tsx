'use client';

import type { Project } from '@/src/models';
import { ProjectCard } from './ProjectCard';

interface ProjectsGridProps {
  projects: Project[];
  starredProjects: string[];
  canEditProject: () => boolean;
  onToggleStarred: (projectId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onViewProject: (projectId: string) => void;
  onViewTasks: (projectId: string) => void;
}

export function ProjectsGrid({
  projects,
  starredProjects,
  canEditProject,
  onToggleStarred,
  onEditProject,
  onDeleteProject,
  onViewProject,
  onViewTasks,
}: ProjectsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isStarred={starredProjects.includes(project.id)}
          onToggleStarred={onToggleStarred}
          onEditProject={onEditProject}
          onDeleteProject={onDeleteProject}
          onViewProject={onViewProject}
          onViewTasks={onViewTasks}
          canEdit={canEditProject()}
        />
      ))}
    </div>
  );
}
