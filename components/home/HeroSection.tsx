import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="home-hero">
      <div className="home-hero__glow home-hero__glow--primary" />
      <div className="home-hero__glow home-hero__glow--secondary" />

      <div className="home-hero__meta">
        <span className="home-hero__tag">WEB3 INSPIRED</span>
        <span className="home-hero__tag home-hero__tag--accent">شالية 5 نجوم</span>
      </div>

      <h1 className="home-hero__title">تجربة حجز مترفة بلمسة Web3</h1>
      <p className="home-hero__subtitle">
        واجهة زجاجية، مؤثرات نيون، وتدفق حجوزات سلس يحافظ على نفس المنطق الخاص بك.
        احجز يومك المفضل خلال لحظات وابق على اطلاع عبر إشعارات فورية.
      </p>

      <div className="home-hero__cta">
        <Link href="#calendar" className="home-hero__cta-main">
          استكشف التقويم
        </Link>
        <span className="home-hero__cta-secondary">انطلق إلى حجوزات لامركزية بتجربة حديثة</span>
      </div>

      <div className="home-hero__stats">
        <div className="home-hero__stat">
          <span className="home-hero__stat-icon">⚡</span>
          <div>
            <p className="home-hero__stat-label">حجز فوري</p>
            <p className="home-hero__stat-value">إلى بوابة واحدة</p>
          </div>
        </div>
        <div className="home-hero__stat">
          <span className="home-hero__stat-icon">🔒</span>
          <div>
            <p className="home-hero__stat-label">حماية بيانات</p>
            <p className="home-hero__stat-value">معايير مشددة</p>
          </div>
        </div>
        <div className="home-hero__stat">
          <span className="home-hero__stat-icon">🌙</span>
          <div>
            <p className="home-hero__stat-label">تقويم مزدوج</p>
            <p className="home-hero__stat-value">ميلادي + هجري</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
