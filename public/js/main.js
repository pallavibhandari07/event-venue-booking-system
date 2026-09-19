/**
 * WEB_ASS_2 - Event & Venue Booking Interactive Utilities
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Booking Form: Live Cost & Duration Auto-Calculator
  const startTimeInput = document.getElementById('bookingStartTime');
  const endTimeInput = document.getElementById('bookingEndTime');
  const durationDisplay = document.getElementById('calcDuration');
  const costDisplay = document.getElementById('calcTotalCost');
  const hourlyRateInput = document.getElementById('venueHourlyRate');

  function calculateBookingCost() {
    if (!startTimeInput || !endTimeInput || !hourlyRateInput) return;

    const startVal = startTimeInput.value;
    const endVal = endTimeInput.value;
    const hourlyRate = parseFloat(hourlyRateInput.value) || 0;

    if (!startVal || !endVal) return;

    const [sH, sM] = startVal.split(':').map(Number);
    const [eH, eM] = endVal.split(':').map(Number);

    const sMinutes = sH * 60 + sM;
    const eMinutes = eH * 60 + eM;

    if (eMinutes <= sMinutes) {
      if (durationDisplay) durationDisplay.textContent = 'Invalid (End must be after start)';
      if (costDisplay) costDisplay.textContent = '₹0';
      return;
    }

    const durationHours = Math.max(1, Math.round(((eMinutes - sMinutes) / 60) * 10) / 10);
    const totalCost = Math.round(durationHours * hourlyRate);

    if (durationDisplay) durationDisplay.textContent = `${durationHours} hour(s)`;
    if (costDisplay) costDisplay.textContent = `₹${totalCost.toLocaleString('en-IN')}`;
  }

  if (startTimeInput && endTimeInput) {
    startTimeInput.addEventListener('change', calculateBookingCost);
    endTimeInput.addEventListener('change', calculateBookingCost);
    calculateBookingCost();
  }

  // 2. Admin Rejection Modal
  const rejectModal = document.getElementById('rejectModal');
  const rejectForm = document.getElementById('rejectForm');
  const rejectEventName = document.getElementById('rejectEventName');

  document.querySelectorAll('.btn-trigger-reject').forEach((btn) => {
    btn.addEventListener('click', () => {
      const bookingId = btn.dataset.id;
      const eventName = btn.dataset.eventname;

      if (rejectForm) rejectForm.action = `/admin/bookings/${bookingId}/status`;
      if (rejectEventName) rejectEventName.textContent = eventName;
      if (rejectModal) rejectModal.style.display = 'flex';
    });
  });

  const btnCloseRejectModal = document.getElementById('btnCloseRejectModal');
  if (btnCloseRejectModal && rejectModal) {
    btnCloseRejectModal.addEventListener('click', () => {
      rejectModal.style.display = 'none';
    });
  }
});
