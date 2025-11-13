interface CalendarSummaryProps {
  gregorianDate: string;
  hijriDate: string;
}

const CalendarSummary = ({ gregorianDate, hijriDate }: CalendarSummaryProps) => {
  return (
    <div className="calendar-summary">
      <div className="calendar-summary__card">
        <div className="calendar-summary__icon">📅</div>
        <div>
          <p className="calendar-summary__label">التاريخ الميلادي</p>
          <p className="calendar-summary__value">{gregorianDate}</p>
        </div>
      </div>
      <div className="calendar-summary__card">
        <div className="calendar-summary__icon">🌙</div>
        <div>
          <p className="calendar-summary__label">التاريخ الهجري</p>
          <p className="calendar-summary__value calendar-summary__value--accent">{hijriDate}</p>
        </div>
      </div>
    </div>
  );
};

export default CalendarSummary;
