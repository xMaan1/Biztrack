import { useNavigate } from 'react-router-dom'
import { FeaturesSection } from './components/FeaturesSection'
import { HeroSection } from './components/HeroSection'
import { LandingCtaSection } from './components/LandingCtaSection'
import { LandingFooter } from './components/LandingFooter'
import { LandingNav } from './components/LandingNav'
import { PricingSection } from './components/PricingSection'
import { TestimonialsSection } from './components/TestimonialsSection'
import { trialRegisterPath } from './utils/plan'

export function LandingPage() {
  const navigate = useNavigate()

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="from-background via-background to-muted/20 min-h-screen bg-gradient-to-br">
      <LandingNav />
      <HeroSection
        onStartFreeTrial={() => navigate(trialRegisterPath('commerce'))}
        onSeeHowItWorks={() => scrollTo('features')}
      />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <LandingCtaSection
        onGetStarted={() => navigate(trialRegisterPath('commerce'))}
        onViewPricing={() => scrollTo('pricing')}
      />
      <LandingFooter />
    </div>
  )
}
