'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../components/layout';
import InvestmentForm from '../../../components/investments/InvestmentForm';
import { Button } from '../../../components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewInvestmentPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/investments');
  };

  const handleClose = () => {
    router.push('/investments');
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/investments')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Investments
          </Button>
        </div>
        
        <InvestmentForm
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
