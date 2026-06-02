import { useNavigate } from 'react-router-dom'
import { CompanyVerificationSection } from './components/CompanyVerificationSection'
import { FeaturesSection } from './components/FeaturesSection'
import { HeroSection } from './components/HeroSection'
import { ImpactCommitmentSection } from './components/ImpactCommitmentSection'
import { LandingCtaSection } from './components/LandingCtaSection'
import { LandingFooter } from './components/LandingFooter'
import { LandingNav } from './components/LandingNav'
import { LandingPlanModulesSection } from './components/LandingPlanModulesSection'
import { PricingSection } from './components/PricingSection'
import { ProductCrmOverviewSection } from './components/ProductCrmOverviewSection'
import { ReviewsReputationSection } from './components/ReviewsReputationSection'
import { trialRegisterPath } from './utils/plan'

export function LandingPage() {
  const navigate = useNavigate()

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <HeroSection
        onStartFreeTrial={() => navigate(trialRegisterPath('agency'))}
        onSeeHowItWorks={() => scrollTo('overview')}
      />
      <ProductCrmOverviewSection />
      <FeaturesSection />
      <ReviewsReputationSection />
      <ImpactCommitmentSection />
      <CompanyVerificationSection />
      <LandingCtaSection onBookDemo={() => navigate('/register')} />
      <LandingPlanModulesSection />
      <PricingSection />
      <LandingFooter />
    </div>
  )
}
