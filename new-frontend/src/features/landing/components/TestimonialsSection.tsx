import { StarFilled } from '@ant-design/icons'
import { Card } from 'antd'
import { LANDING_TESTIMONIALS } from '../constants/testimonials'

export function TestimonialsSection() {
  return (
    <section className="bg-muted/30 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Loved by Businesses Worldwide
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            See what our customers have to say about their experience
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {LANDING_TESTIMONIALS.map((testimonial, index) => (
            <Card
              key={index}
              className="border-0 bg-card/50 text-center backdrop-blur-sm"
              styles={{ body: { paddingTop: 24 } }}
            >
              <div className="mb-4 flex justify-center">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <StarFilled key={i} className="text-xl text-amber-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 italic">&quot;{testimonial.content}&quot;</p>
              <div>
                <div className="text-foreground font-semibold">{testimonial.name}</div>
                <div className="text-muted-foreground text-sm">{testimonial.role}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
