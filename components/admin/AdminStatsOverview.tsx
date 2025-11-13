interface AdminStatsOverviewProps {
  total: number;
  confirmed: number;
}

const AdminStatsOverview = ({ total, confirmed }: AdminStatsOverviewProps) => {
  return (
    <section className="admin-stats">
      <article className="admin-stats__card admin-stats__card--primary">
        <div className="admin-stats__icon">📊</div>
        <div>
          <p className="admin-stats__label">الحجوزات النشطة</p>
          <p className="admin-stats__value">{total}</p>
          <span className="admin-stats__meta">الملغية تُحذف فوراً</span>
        </div>
      </article>
      <article className="admin-stats__card admin-stats__card--danger">
        <div className="admin-stats__icon">🔒</div>
        <div>
          <p className="admin-stats__label">المؤكدة</p>
          <p className="admin-stats__value">{confirmed}</p>
        </div>
      </article>
    </section>
  );
};

export default AdminStatsOverview;
