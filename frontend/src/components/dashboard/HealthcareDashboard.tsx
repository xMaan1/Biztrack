'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import {
  Stethoscope,
  Users,
  Calendar,
  DollarSign,
  Package,
  BarChart3,
  Plus,
  ArrowRight,
  Heart,
  Pill,
} from 'lucide-react';

interface HealthcareStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTeamMembers: number;
  averageProgress: number;
  totalPatients: number;
  appointmentsToday: number;
  revenueThisMonth: number;
  patientSatisfaction: number;
}

interface HealthcareDashboardProps {
  stats: HealthcareStats;
  onNavigate: (path: string) => void;
}

export default function HealthcareDashboard({
  stats,
  onNavigate,
}: HealthcareDashboardProps) {
  const { getCurrencySymbol } = useCurrency();
  const handleCreateProject = () => onNavigate('/projects/new');
  const handleNewAppointment = () => onNavigate('/appointments/new');
  const handleViewPatients = () => onNavigate('/patients');
  const handleViewSchedule = () => onNavigate('/schedule');

  return (
    <div className="space-y-8">
      {/* Healthcare-Specific Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Healthcare Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Medical Practice Management Overview
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleCreateProject}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
          <Button
            onClick={handleNewAppointment}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Calendar className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Healthcare-Specific Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalPatients}
            </div>
            <p className="text-xs text-muted-foreground">Registered patients</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.appointmentsToday}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled today</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {getCurrencySymbol()}{stats.revenueThisMonth.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Patient Satisfaction
            </CardTitle>
            <Heart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.patientSatisfaction}%
            </div>
            <p className="text-xs text-muted-foreground">Rating score</p>
          </CardContent>
        </Card>
      </div>

      {/* Healthcare-Specific Content Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              Patient Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Active Cases</span>
              <span className="text-sm text-blue-600">
                {stats.activeProjects}
              </span>
            </div>
            <Progress value={stats.averageProgress} className="h-2" />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.completedProjects}
                </div>
                <div className="text-xs text-gray-600">Completed Cases</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalTeamMembers}
                </div>
                <div className="text-xs text-gray-600">Medical Staff</div>
              </div>
            </div>

            <Button
              onClick={handleViewPatients}
              variant="outline"
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              View Patient Records
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Schedule & Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Schedule & Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-sm">Upcoming Appointments</span>
                <Badge variant="default">8</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                <span className="text-sm">Pending Follow-ups</span>
                <Badge variant="secondary">3</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <span className="text-sm">Emergency Cases</span>
                <Badge variant="destructive">1</Badge>
              </div>
            </div>

            <Button
              onClick={handleViewSchedule}
              variant="outline"
              className="w-full border-green-600 text-green-600 hover:bg-green-50"
            >
              View Schedule
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => onNavigate('/patients')}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Patient Records</span>
            </Button>

            <Button
              onClick={() => onNavigate('/appointments')}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Appointments</span>
            </Button>

            <Button
              onClick={() => onNavigate('/inventory')}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Pill className="h-6 w-6" />
              <span className="text-sm">Medical Supplies</span>
            </Button>

            <Button
              onClick={() => onNavigate('/reports')}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
