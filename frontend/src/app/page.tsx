"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/ApiService";
import { LandingNav } from "../components/landing/LandingNav";
import {
  Check,
  Star,
  Users,
  FolderOpen,
  BarChart3,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Loader2,
  Building2
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  planType: string;
  price: number;
  maxProjects: number;
  maxUsers: number;
  features: string[];
  description: string;
}

interface SubscriptionModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tenantName: string) => void;
  loading: boolean;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  plan,
  isOpen,
  onClose,
  onSubmit,
  loading
}) => {
  const [tenantName, setTenantName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tenantName.trim()) {
      onSubmit(tenantName.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenantName">Workspace Name</Label>
            <Input
              id="tenantName"
              placeholder="Enter your company/workspace name"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              This will be the name of your workspace in SparkCo ERP
            </p>
          </div>
          
          {plan && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">{plan.name} Plan</span>
                <Badge variant="secondary">${plan.price}/month</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {plan.maxProjects} projects • {plan.maxUsers} users
              </p>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || !tenantName.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Workspace
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [subscriptionModal, setSubscriptionModal] = useState<{
    isOpen: boolean;
    plan: Plan | null;
  }>({ isOpen: false, plan: null });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await apiService.get("/tenants/plans");
      setPlans(response.plans || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const handleSubscribe = (plan: Plan) => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      router.push("/login");
      return;
    }
    
    setSubscriptionModal({ isOpen: true, plan });
  };

  const handleCreateTenant = async (tenantName: string) => {
    if (!subscriptionModal.plan) return;
    
    try {
      setLoading(true);
      const response = await apiService.createTenantFromLanding({
        planId: subscriptionModal.plan.id,
        tenantName,
        domain: tenantName.toLowerCase().replace(/\s+/g, '-')
      });

      if (response.success) {
        // Close modal and redirect to dashboard
        setSubscriptionModal({ isOpen: false, plan: null });
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error creating tenant:", error);
      alert("Failed to create workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: FolderOpen,
      title: "Project Management",
      description: "Plan, track, and manage projects with ease. Set milestones, assign tasks, and monitor progress in real-time."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together seamlessly with team chat, file sharing, and real-time collaboration tools."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Get insights into your business performance with comprehensive dashboards and reports."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with role-based access control, audit logs, and data encryption."
    },
    {
      icon: Zap,
      title: "Automation",
      description: "Automate repetitive tasks and workflows to boost productivity and reduce errors."
    },
    {
      icon: Globe,
      title: "Multi-tenant",
      description: "Scale your business with our robust multi-tenant architecture designed for growth."
    }
  ];

    return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <LandingNav />

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Complete Business Management
            <span className="text-primary block">All in One Platform</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Streamline your business operations with our comprehensive ERP solution. 
            Manage projects, sales, HR, inventory, and more from a single dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => router.push("/signup")}>
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push("/login")}>
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help your business grow and succeed
            </p>
        </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
            ))}
                </div>
              </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow. All plans include a 14-day free trial.
            </p>
              </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.planType === 'enterprise' ? 'border-primary shadow-lg' : ''}`}>
                {plan.planType === 'enterprise' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Projects</span>
                      <span className="font-medium">{plan.maxProjects}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Team Members</span>
                      <span className="font-medium">{plan.maxUsers}</span>
                        </div>
                      </div>

                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                    <Button
                    className="w-full" 
                    variant={plan.planType === 'enterprise' ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan)}
                    >
                    {isAuthenticated ? 'Subscribe Now' : 'Start Free Trial'}
                    </Button>
              </CardContent>
            </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of companies already using SparkCo ERP to streamline their operations
          </p>
              <Button
            size="lg" 
            variant="secondary"
            onClick={() => router.push("/signup")}
          >
            Get Started Today
            <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t bg-muted/50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">SparkCo ERP</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete business management solution for modern companies
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="/docs" className="hover:text-foreground">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-foreground">About</a></li>
                <li><a href="/contact" className="hover:text-foreground">Contact</a></li>
                <li><a href="/careers" className="hover:text-foreground">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/help" className="hover:text-foreground">Help Center</a></li>
                <li><a href="/status" className="hover:text-foreground">System Status</a></li>
                <li><a href="/contact" className="hover:text-foreground">Contact Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 SparkCo ERP. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Subscription Modal */}
      <SubscriptionModal
        plan={subscriptionModal.plan}
        isOpen={subscriptionModal.isOpen}
        onClose={() => setSubscriptionModal({ isOpen: false, plan: null })}
        onSubmit={handleCreateTenant}
        loading={loading}
      />
      </div>
  );
}
