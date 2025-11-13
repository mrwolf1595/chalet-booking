import Link from "next/link";

const ActionLinks = () => {
  return (
    <div className="home-actions">
      <Link href="/admin" className="home-actions__link home-actions__link--primary">
        <span>⚙️</span>
        لوحة الإدارة
      </Link>
      <Link href="/history" className="home-actions__link home-actions__link--secondary">
        <span>📋</span>
        تتبع حجزي
      </Link>
    </div>
  );
};

export default ActionLinks;
