const features = [
  {
    icon: "⚡",
    title: "حجز لحظي",
    description: "واجهة سريعة تستجيب فوراً لطلباتك.",
  },
  {
    icon: "🔒",
    title: "آمن ومشفر",
    description: "بياناتك تحت حماية متعددة الطبقات.",
  },
  {
    icon: "📱",
    title: "تنبيهات ذكية",
    description: "إشعارات واتساب فورية لتأكيد الحجز.",
  }
];

const FeatureGrid = () => {
  return (
    <section className="feature-grid">
      <header className="feature-grid__header">
        <span>ℹ️</span>
        <h3>معلومات الحجز</h3>
      </header>
      <div className="feature-grid__items">
        {features.map((item) => (
          <div className="feature-grid__item" key={item.title}>
            <div className="feature-grid__icon">{item.icon}</div>
            <h4>{item.title}</h4>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureGrid;
