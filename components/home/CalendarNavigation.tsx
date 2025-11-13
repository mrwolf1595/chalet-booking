interface CalendarNavigationProps {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
}

const CalendarNavigation = ({ monthLabel, onPrev, onNext }: CalendarNavigationProps) => {
  return (
    <div className="calendar-navigation">
      <button type="button" className="nav-btn" onClick={onPrev}>
        <span>⬅️</span>
        <span>السابق</span>
      </button>
      <h3 className="calendar-navigation__label">
        <span>🗓️</span>
        {monthLabel}
      </h3>
      <button type="button" className="nav-btn" onClick={onNext}>
        <span>التالي</span>
        <span>➡️</span>
      </button>
    </div>
  );
};

export default CalendarNavigation;
