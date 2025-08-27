"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Progress } from "../../components/ui/progress";
import {
  TrendingUp,
  FolderOpen,
  Users,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2,
  Star,
  BarChart3,
  Loader2,
  Warehouse,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/ApiService";
import { Project } from "../../models/project/Project";
import { DashboardLayout } from "../../components/layout";

import { cn, getStatusColor, getInitials, formatDate } from "../../lib/utils";

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTeamMembers: number;
  averageProgress: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTeamMembers: 0,
    averageProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [starredProjects, setStarredProjects] = useState<string[]>([]);

  useEffect(() => {
    // AuthGuard ensures user is authenticated, so we can directly fetch data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsResponse, usersResponse] = await Promise.all([
        apiService.getProjects(),
        apiService.getUsers().catch(() => ({ users: [] })),
      ]);

      const projectsData = projectsResponse.projects || [];
      const usersData = usersResponse.users || [];

      setProjects(projectsData);

      // Calculate stats
      const totalProjects = projectsData.length;
      const activeProjects = projectsData.filter(
        (p: Project) => p.status === "in_progress",
      ).length;
      const completedProjects = projectsData.filter(
        (p: Project) => p.status === "completed",
      ).length;
      const totalTeamMembers = usersData.length;
      const averageProgress =
        totalProjects > 0
          ? Math.round(
              projectsData.reduce(
                (sum: number, p: Project) => sum + p.completionPercent,
                0,
              ) / totalProjects,
            )
          : 0;

      setStats({
        totalProjects,
        activeProjects,
        completedProjects,
        totalTeamMembers,
        averageProgress,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const handleCreateProject = () => {
    router.push("/projects/new");
  };

  const handleViewAllProjects = () => {
    router.push("/projects");
  };

  const handleViewAllUsers = () => {
    router.push("/users");
  };

  const toggleStarred = (projectId: string) => {
    setStarredProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome back, {user?.firstName || user?.userName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your projects today.
          </p>
        </div>
        <Button onClick={handleCreateProject} className="modern-button">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} active, {stats.completedProjects} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeamMembers}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageProgress}%</div>
            <Progress value={stats.averageProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Updates this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Projects</CardTitle>
            <Button variant="outline" onClick={handleViewAllProjects}>
              View All →
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
              <p className="text-muted-foreground">
                Get started by creating your first project.
              </p>
              <Button className="mt-4" onClick={handleCreateProject}>
                Create Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Star
                        className={cn(
                          "h-4 w-4 cursor-pointer",
                          starredProjects.includes(project.id)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground hover:text-yellow-400",
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarred(project.id);
                        }}
                      />
                      <Badge variant={getStatusColor(project.status)}>
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {project.completionPercent}% Complete
                      </div>
                      <Progress
                        value={project.completionPercent}
                        className="w-20 mt-1"
                      />
                    </div>
                    <div className="flex -space-x-2">
                      {project.teamMembers?.slice(0, 3).map((member, index) => (
                        <Avatar
                          key={member.id}
                          className="h-8 w-8 border-2 border-background"
                        >
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {project.teamMembers &&
                        project.teamMembers.length > 3 && (
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium border-2 border-background">
                            +{project.teamMembers.length - 3}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Team Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Manage your team members, roles, and permissions.
            </p>
            <Button variant="outline" onClick={handleViewAllUsers}>
              Manage Team
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Reports & Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View detailed reports and analytics for your projects.
            </p>
            <Button variant="outline" onClick={() => router.push("/reports")}>
              View Reports
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Warehouse className="h-5 w-5" />
              <span>Inventory</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Manage your inventory and track stock levels.
            </p>
            <Button variant="outline" onClick={() => router.push("/inventory")}>
              Manage Inventory
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
