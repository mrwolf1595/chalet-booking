const InfoBanner = () => {
  return (
    <div className="home-info-banner">
      <span className="home-info-banner__icon">ℹ️</span>
      <p className="home-info-banner__text">
        للحجز قم بالضغط على اليوم الذي تريده. الخلية <span className="home-info-banner__token home-info-banner__token--danger">🔒 محجوزة</span>
        ، بينما تشير <span className="home-info-banner__token home-info-banner__token--success">🎯 المتاحة</span> إلى تأكيد فوري.
      </p>
    </div>
  );
};

export default InfoBanner;
