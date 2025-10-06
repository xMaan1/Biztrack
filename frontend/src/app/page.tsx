'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { apiService } from '../services/ApiService';
import { LandingNav } from '../components/landing/LandingNav';
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
  CheckCircle,
} from 'lucide-react';

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
  loading,
}) => {
  const { getCurrencySymbol } = useCurrency();
  const [tenantName, setTenantName] = useState('');

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
          <DialogDescription>
            Set up your new workspace with the {plan?.name} plan
          </DialogDescription>
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
              This will be the name of your workspace in BizTrack
            </p>
          </div>

          {plan && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">{plan.name} Plan</span>
                <Badge variant="secondary">{getCurrencySymbol()}{plan.price}/month</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {plan.maxProjects} projects • {plan.maxUsers} users
              </p>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !tenantName.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
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
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { getCurrencySymbol } = useCurrency();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [subscriptionModal, setSubscriptionModal] = useState<{
    isOpen: boolean;
    plan: Plan | null;
  }>({ isOpen: false, plan: null });

  useEffect(() => {
    fetchPlans();
  }, []);

  // Handle stored plan for new signups
  useEffect(() => {
    if (isAuthenticated) {
      // Check localStorage for selected plan (for new signups)
      const storedPlan = localStorage.getItem('selectedPlanForSignup');
      if (storedPlan) {
        try {
          const plan = JSON.parse(storedPlan);
          // Check if user already has tenants before showing workspace creation
          checkExistingTenantsAndHandlePlan(plan);
          // Clear the stored plan
          localStorage.removeItem('selectedPlanForSignup');
        } catch (error) {
          localStorage.removeItem('selectedPlanForSignup');
        }
      }
    }
  }, [isAuthenticated]);

  const checkExistingTenantsAndHandlePlan = async (plan: Plan) => {
    try {
      // Get user's existing tenants
      const existingTenants = apiService.getUserTenants();

      if (existingTenants && existingTenants.length > 0) {
        // User already has tenants - show message and redirect to dashboard
        alert('You already have a workspace! Redirecting to your dashboard.');
        router.push('/dashboard');
        return;
      }

      // User has no tenants - show workspace creation modal
      setSubscriptionModal({ isOpen: true, plan });
    } catch (error) {
      // Fallback: show workspace creation modal
      setSubscriptionModal({ isOpen: true, plan });
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await apiService.get('/public/plans');
      setPlans(response.plans || []);
    } catch (error) {
      // Plans fetch failed, continue without plans
    }
  };

  const handleSubscribe = (plan: Plan) => {
    if (!isAuthenticated) {
      // Store the selected plan in localStorage and redirect to signup
      localStorage.setItem('selectedPlanForSignup', JSON.stringify(plan));
      router.push('/signup');
      return;
    }

    // User is authenticated - check existing tenants first
    checkExistingTenantsAndHandlePlan(plan);
  };

  const handleCreateTenant = async (tenantName: string) => {
    if (!subscriptionModal.plan) return;

    try {
      setLoading(true);
      const response = await apiService.createTenantFromLanding({
        planId: subscriptionModal.plan.id,
        tenantName,
        domain: tenantName.toLowerCase().replace(/\s+/g, '-'),
      });

      if (response.success && response.tenant) {
        // Close modal
        setSubscriptionModal({ isOpen: false, plan: null });

        // Refresh tenant data to get the newly created tenant
        try {
          await apiService.refreshTenants();

          // Verify tenant was created and set as current
          const tenants = apiService.getUserTenants();
          const newTenant = tenants.find((t) => t.name === tenantName);

          if (newTenant) {
            apiService.setTenantId(newTenant.id);

            // Small delay to ensure localStorage is updated
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Only redirect if tenant was successfully created and set
            router.push('/dashboard');
          } else {
            throw new Error('Tenant was not found after creation');
          }
        } catch (error) {
          alert('Workspace created but there was an issue setting it up. Please refresh the page and try again.');
          return; // Don't redirect if tenant setup failed
        }
      } else {
        throw new Error('Tenant creation failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to create workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: FolderOpen,
      title: 'Project Management',
      description:
        'Plan, track, and manage projects with ease. Set milestones, assign tasks, and monitor progress in real-time.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description:
        'Work together seamlessly with team chat, file sharing, and real-time collaboration tools.',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description:
        'Get insights into your business performance with comprehensive dashboards and reports.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description:
        'Bank-level security with role-based access control, audit logs, and data encryption.',
    },
    {
      icon: Zap,
      title: 'Automation',
      description:
        'Automate repetitive tasks and workflows to boost productivity and reduce errors.',
    },
    {
      icon: Globe,
      title: 'Multi-tenant',
      description:
        'Scale your business with our robust multi-tenant architecture designed for growth.',
    },
  ];

  const stats = [
    { label: 'Active Users', value: '10,000+', icon: Users },
    { label: 'Projects Managed', value: '50,000+', icon: FolderOpen },
    { label: 'Uptime', value: '99.9%', icon: CheckCircle },
    { label: 'Customer Satisfaction', value: '4.9/5', icon: Star },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CEO, TechFlow Solutions',
      content:
        'BizTrack transformed our business operations. The project management and analytics features are game-changers.',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Operations Manager, Global Manufacturing',
      content:
        'We\'ve increased productivity by 40% since implementing BizTrack. The automation features are incredible.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'HR Director, Healthcare Plus',
      content:
        'The multi-tenant setup and security features give us peace of mind while managing multiple locations.',
      rating: 5,
    },
  ];

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Navigation */}
      <LandingNav />

      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6">
              <Star className="h-4 w-4 fill-primary" />
              <span className="text-sm font-medium">
                Trusted by 10,000+ businesses
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              Complete Business
              <span className="block">Management Platform</span>
            </h1>

            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Streamline your business operations with our comprehensive ERP
              solution. Manage projects, sales, HR, inventory, and more from a
              single dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="text-lg px-8 py-6 h-auto"
                onClick={() => router.push('/signup')}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 h-auto"
                onClick={() =>
                  document
                    .getElementById('features')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                See How It Works
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    <stat.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to streamline your business operations
              and boost productivity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm"
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow. All plans include a 14-day free
              trial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative group hover:shadow-xl transition-all duration-300 ${
                  plan.planType === 'enterprise'
                    ? 'border-primary shadow-lg scale-105'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {plan.planType === 'enterprise' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-2 text-sm">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-foreground mb-2">
                    {getCurrencySymbol()}{plan.price}
                    <span className="text-lg font-normal text-muted-foreground">
                      /month
                    </span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Projects</span>
                      <span className="font-medium">{plan.maxProjects}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Team Members
                      </span>
                      <span className="font-medium">{plan.maxUsers}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {plan.features.slice(0, 6).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full group-hover:scale-105 transition-transform bg-blue-600 hover:bg-blue-700 ${
                      plan.planType === 'enterprise' ? 'shadow-lg' : ''
                    }`}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {isAuthenticated ? 'Create Workspace' : 'Start Free Trial'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Loved by Businesses Worldwide
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our customers have to say about their experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="text-center border-0 bg-card/50 backdrop-blur-sm"
              >
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
            Join thousands of companies already using BizTrack to streamline
            their operations and boost productivity
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6 h-auto"
              onClick={() => router.push('/signup')}
            >
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 h-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              onClick={() =>
                document
                  .getElementById('pricing')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t bg-muted/50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">BizTrack</h3>
              <p className="text-muted-foreground text-sm">
                Complete business management platform for modern enterprises.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Community
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Status
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 BizTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={subscriptionModal.isOpen}
        onClose={() => setSubscriptionModal({ isOpen: false, plan: null })}
        plan={subscriptionModal.plan}
        onSubmit={handleCreateTenant}
        loading={loading}
      />
    </div>
  );
}
/ /   T e s t   a u t o - d e p l o y m e n t   -   1 0 / 0 6 / 2 0 2 5   1 7 : 4 4 : 1 4  
 