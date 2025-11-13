import { getFullHijriDate } from "@/lib/hijri";
import {
  CalendarBooking,
  CalendarInteractionEvent,
} from "@/types/calendar";

const dayNames = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

interface CalendarGridProps {
  currentDate: Date;
  bookedDates: CalendarBooking[];
  onInteraction: (event: CalendarInteractionEvent) => void;
}

const CalendarGrid = ({ currentDate, bookedDates, onInteraction }: CalendarGridProps) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const now = new Date();
  const normalizedNow = new Date(now);
  normalizedNow.setHours(0, 0, 0, 0);

  const dayCells = Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + index);
    cellDate.setHours(0, 0, 0, 0);

    const y = cellDate.getFullYear();
    const m = (cellDate.getMonth() + 1).toString().padStart(2, "0");
    const d = cellDate.getDate().toString().padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    const booking = bookedDates.find((b) => b.date === dateStr);
    const isCurrentMonth = cellDate.getMonth() === month;
    const isToday = cellDate.getTime() === normalizedNow.getTime();
    const beforeCutoff = isToday && now.getHours() < 15;
    const afterCutoff = isToday && now.getHours() >= 15;

    const isAvailable =
      !booking &&
      isCurrentMonth &&
      ((isToday && beforeCutoff) || cellDate > today);

    const isPast = cellDate < today || (isToday && afterCutoff);

    return {
      dateStr,
      booking,
      cellDate,
      isCurrentMonth,
      isToday,
      isAvailable,
      isPast,
      hijriDate: getFullHijriDate(cellDate),
    };
  });

  return (
    <div className="calendar-grid">
      {dayNames.map((name, index) => (
        <div key={`header-${name}`} className="calendar-day header">
          <span className="day-header-icon">
            {index === 5 ? "🕌" : index === 6 ? "🌙" : "📅"}
          </span>
          <span className="day-header-label">{name}</span>
        </div>
      ))}

      {dayCells.map((cell) => {
        const classNames = ["calendar-day"];
        if (!cell.isCurrentMonth) classNames.push("other-month");
        if (cell.isToday) classNames.push("today");
        if (cell.booking) classNames.push("booked");
        if (cell.isAvailable) classNames.push("available");

        const title = cell.booking
          ? "محجوز 🔒"
          : cell.isPast
          ? "تاريخ منتهي"
          : "متاح للحجز 🎯";

        const handleClick = () => {
          if (cell.booking) {
            onInteraction({ type: "booked", dateStr: cell.dateStr });
            return;
          }

          if (cell.isAvailable) {
            onInteraction({ type: "available", dateStr: cell.dateStr });
          }
        };

        const hijriParts = cell.hijriDate.split(" ");

        const isInteractive = cell.isAvailable || Boolean(cell.booking);
        const tabIndex = isInteractive ? 0 : -1;

        return (
          <div
            key={cell.dateStr}
            className={classNames.join(" ")}
            title={title}
            onClick={handleClick}
            data-date={cell.dateStr}
            role={isInteractive ? "button" : undefined}
            tabIndex={tabIndex}
            onKeyDown={(event) => {
              if (!isInteractive) {
                return;
              }

              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleClick();
              }
            }}
          >
            <span className="calendar-day__number">{cell.cellDate.getDate()}</span>
            <span className="calendar-day__hijri">
              {hijriParts[0]} {hijriParts[1]}
            </span>
            {cell.booking && <span className="calendar-day__marker calendar-day__marker--booked">🔒</span>}
            {cell.isAvailable && (
              <span className="calendar-day__marker calendar-day__marker--available">🎯</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CalendarGrid;
