function getCurrentDate() {
  const date = new Date();
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  return { day, monthIndex, year };
}

function getDayWithSuffix(day) {
    const suffix = (day % 10 === 1 && day % 100 !== 11) ? 'st' :
                   (day % 10 === 2 && day % 100 !== 12) ? 'nd' :
                   (day % 10 === 3 && day % 100 !== 13) ? 'rd' : 'th';
    return `${day}${suffix}`;
  }

function formatDateConventional(dateComponents) {
  const { day, monthIndex, year } = dateComponents;

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  return `${getDayWithSuffix(day)} ${monthNames[monthIndex]} ${year}`;
}

function formatDateStructured(dateComponents) {
  const { year, monthIndex, day } = dateComponents;

  // Pad month and day with leading zeros if necessary
  const formattedMonth = String(monthIndex + 1).padStart(2, '0'); // monthIndex is 0-based
  const formattedDay = String(day).padStart(2, '0');

  return `${year}${formattedMonth}${formattedDay}`;
}

module.exports = { getCurrentDate, formatDateConventional, formatDateStructured };