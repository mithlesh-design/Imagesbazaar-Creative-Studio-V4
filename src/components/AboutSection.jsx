import './AboutSection.css'

export default function AboutSection() {
  return (
    <section className="about" aria-labelledby="about-heading">
      <div className="about__inner container">
        <h2 className="about__heading" id="about-heading">
          India, through authentic visuals.
        </h2>
        <p className="about__body">
          Every image in our library is shot in India, with Indian people, in Indian homes,
          workplaces, streets and celebrations. From village fields to city offices, festival
          crowds to quiet family mornings — visual content that reflects how the country
          actually looks, rather than a generic stand-in for it.
        </p>
        <a className="about__cta" href="#">
          Learn more
        </a>
      </div>
    </section>
  )
}
