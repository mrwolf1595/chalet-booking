import Link from "next/link";

interface AdminActionPanelProps {
  onRefresh: () => void;
  onLogout: () => void;
}

const AdminActionPanel = ({ onRefresh, onLogout }: AdminActionPanelProps) => {
  return (
    <div className="admin-action-panel">
      <div className="admin-action-panel__row">
        <button type="button" className="admin-btn" onClick={onRefresh}>
          <span>🔄</span>
          تحديث البيانات
        </button>
        <Link href="/" className="booking-btn">
          <span>🏠</span>
          العودة للرئيسية
        </Link>
      </div>
      <button type="button" className="logout-btn" onClick={onLogout}>
        <span>🚪</span>
        تسجيل خروج
      </button>
    </div>
  );
};

export default AdminActionPanel;
