const attendanceInputs = document.querySelectorAll('input[name="attendance"]');
const attendanceExtra = document.getElementById('attendance-extra');
const attendanceMessage = document.getElementById('attendance-message');
const guestCountInput = document.getElementById('guest-count');
const generatedFields = document.getElementById('generated-fields');
const form = document.getElementById('rsvp-form');
const formFeedback = document.getElementById('form-feedback');
const RSVP_STORAGE_KEY = 'casamiento-rsvp';

function createGuestFields(count) {
  const previousValues = Array.from(
    generatedFields.querySelectorAll('input[type="text"]'),
    (input) => input.value
  );

  generatedFields.innerHTML = '';

  for (let index = 1; index <= count; index += 1) {
    const label = document.createElement('label');
    label.className = 'field';

    const title = document.createElement('span');
    title.textContent = `Nombre del asistente ${index}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.name = `guest_${index}`;
    input.placeholder = `Escribi el nombre del asistente ${index}`;
    input.required = true;
    input.value = previousValues[index - 1] || '';

    label.append(title, input);
    generatedFields.appendChild(label);
  }
}

function getStoredRsvp() {
  try {
    const raw = window.localStorage.getItem(RSVP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveRsvp(payload) {
  try {
    window.localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function fillGuestFields(guestNames = []) {
  guestNames.forEach((name, index) => {
    const input = form.querySelector(`[name="guest_${index + 1}"]`);

    if (input) {
      input.value = name || '';
    }
  });
}

function restoreStoredRsvp() {
  const stored = getStoredRsvp();

  if (!stored) {
    return;
  }

  if (typeof stored.groupName === 'string') {
    form.elements.groupName.value = stored.groupName;
  }

  if (stored.attendance === 'si' || stored.attendance === 'no') {
    const attendanceInput = form.querySelector(
      `input[name="attendance"][value="${stored.attendance}"]`
    );

    if (attendanceInput) {
      attendanceInput.checked = true;
      updateAttendanceState(stored.attendance);
    }
  }

  if (stored.attendance === 'si') {
    const count = Math.max(1, Math.min(12, Number(stored.guestCount) || 1));
    guestCountInput.value = count;
    createGuestFields(count);
    fillGuestFields(Array.isArray(stored.guestNames) ? stored.guestNames : []);
  }
}

function setMessageState(element, state, message) {
  element.textContent = message;
  element.classList.remove('attending', 'not-attending', 'has-state');

  if (!state) {
    return;
  }

  element.classList.add('has-state', state);
}

function updateAttendanceState(value) {
  const isAttending = value === 'si';

  attendanceExtra.classList.toggle('hidden', !isAttending);
  setMessageState(
    attendanceMessage,
    isAttending ? 'attending' : 'not-attending',
    isAttending
      ? 'Que alegria. Completen los datos para dejarnos su confirmacion.'
      : 'Gracias por avisarnos. Los vamos a extranar ese dia.'
  );

  if (isAttending) {
    const count = Math.max(1, Number(guestCountInput.value) || 1);
    guestCountInput.value = count;
    createGuestFields(count);
  } else {
    generatedFields.innerHTML = '';
  }
}

attendanceInputs.forEach((input) => {
  input.addEventListener('change', (event) => {
    updateAttendanceState(event.target.value);
  });
});

guestCountInput.addEventListener('input', () => {
  const count = Math.max(1, Math.min(12, Number(guestCountInput.value) || 1));
  guestCountInput.value = count;
  createGuestFields(count);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const attendance = formData.get('attendance');
  const guestCount = attendance === 'si' ? Number(formData.get('guestCount')) || 1 : 0;

  const payload = {
    groupName: formData.get('groupName'),
    attendance,
    guestCount,
    guestNames: attendance === 'si'
      ? Array.from({ length: guestCount }, (_, index) => formData.get(`guest_${index + 1}`))
      : [],
  };

  const saved = saveRsvp(payload);

  setMessageState(
    formFeedback,
    attendance === 'si' ? 'attending' : 'not-attending',
    saved
      ? attendance === 'si'
        ? 'Confirmacion guardada en este dispositivo. Cuando conectemos el formulario, podremos enviarla automaticamente.'
        : 'Respuesta guardada en este dispositivo. Gracias por tomarse un minuto para avisarnos.'
      : 'No se pudo guardar la confirmacion en este dispositivo. Revisen el navegador e intenten nuevamente.'
  );
});

const revealElements = document.querySelectorAll('.reveal');
const canAnimateReveal =
  window.matchMedia('(min-width: 760px)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canAnimateReveal) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px 80px 0px' });

  revealElements.forEach((element) => {
    element.classList.add('js-reveal');
    observer.observe(element);
  });
} else {
  revealElements.forEach((element) => {
    element.classList.add('is-visible');
  });
}

const preselectedAttendance = form.querySelector('input[name="attendance"]:checked');

if (preselectedAttendance) {
  updateAttendanceState(preselectedAttendance.value);
} else {
  setMessageState(attendanceMessage, '', '');
  setMessageState(formFeedback, '', '');
}

restoreStoredRsvp();
