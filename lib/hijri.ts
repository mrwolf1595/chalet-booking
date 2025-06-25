// lib/hijri.ts
import moment from 'moment-hijri';

// Set Arabic locale for Hijri dates
moment.locale('ar-sa');

export function getHijriDate(gregorianDate: string | Date): string {
  const hijriDate = moment(gregorianDate).format('iYYYY/iMM/iDD');
  return hijriDate;
}

export function getHijriMonthName(gregorianDate: string | Date): string {
  const hijriMonth = moment(gregorianDate).format('iMMMM');
  return hijriMonth;
}

export function getFullHijriDate(gregorianDate: string | Date): string {
  const hijriDate = moment(gregorianDate).format('iDD iMMMM iYYYY هـ');
  return hijriDate;
}

export function getCurrentHijriDate(): string {
  return moment().format('iDD iMMMM iYYYY هـ');
}

// Hijri month names in Arabic
export const hijriMonthNames = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

export const hijriDayNames = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 
  'الخميس', 'الجمعة', 'السبت'
];