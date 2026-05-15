import { Card, Typography } from 'antd'
import { LANDING_FEATURE_CARDS } from '../constants/featureCards'

export function FeaturesSection() {
  return (
    <section id="features" className="bg-muted/30 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Everything You Need to Succeed
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            Powerful features designed to streamline your business operations and boost productivity
          </p>
        </div>

        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {LANDING_FEATURE_CARDS.map((feature, index) => (
            <Card
              key={index}
              className="group border-0 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
              styles={{ body: { paddingTop: 8 } }}
            >
              <div className="pb-4 text-center">
                <div className="bg-primary/10 group-hover:bg-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors">
                  <feature.Icon className="text-primary text-3xl" />
                </div>
                <Typography.Title level={4} className="!mb-0 !text-xl">
                  {feature.title}
                </Typography.Title>
              </div>
              <p className="text-muted-foreground text-center leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
