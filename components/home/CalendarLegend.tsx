const CalendarLegend = () => {
  return (
    <div className="calendar-legend">
      <span className="legend-item">
        <span className="dot available" />
        <span>متاح 🎯</span>
      </span>
      <span className="legend-item">
        <span className="dot booked" />
        <span>محجوز 🔒</span>
      </span>
    </div>
  );
};

export default CalendarLegend;
