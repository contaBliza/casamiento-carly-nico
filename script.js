const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyjIVbvMFGfsQiAZLStyMJ6mFEcZHuaSDI58DBmAfHg7Uouz3u2JuJA6gAhIAuTniLg6Q/exec";

const attendanceInputs = document.querySelectorAll('input[name="attendance"]');
const attendanceExtra = document.getElementById('attendance-extra');
const attendanceMessage = document.getElementById('attendance-message');
const guestCountInput = document.getElementById('guest-count');
const generatedFields = document.getElementById('generated-fields');
const form = document.getElementById('rsvp-form');
const formFeedback = document.getElementById('form-feedback');
const submitButton = form.querySelector('button[type="submit"]');
const defaultSubmitButtonText = submitButton ? submitButton.textContent : '';

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

function setMessageState(element, state, message) {
  element.textContent = message;
  element.classList.remove('attending', 'not-attending', 'has-state');

  if (!state || !message) {
    return;
  }

  element.classList.add('has-state', state);
}

function clearFormFeedback() {
  setMessageState(formFeedback, '', '');
}

function updateAttendanceState(value) {
  const isAttending = value === 'si';
  const isNotAttending = value === 'no';

  attendanceExtra.classList.toggle('hidden', !isAttending);

  if (isAttending) {
    setMessageState(
      attendanceMessage,
      'attending',
      'Que alegria. Completen los datos para dejarnos su confirmacion.'
    );

    const count = Math.max(1, Math.min(12, Number(guestCountInput.value) || 1));
    guestCountInput.value = count;
    createGuestFields(count);
    return;
  }

  generatedFields.innerHTML = '';
  guestCountInput.value = 1;

  if (isNotAttending) {
    setMessageState(
      attendanceMessage,
      'not-attending',
      'Gracias por avisarnos. Los vamos a extranar ese dia.'
    );
    return;
  }

  setMessageState(attendanceMessage, '', '');
}

function buildPayload() {
  const formData = new FormData(form);
  const groupName = String(formData.get('groupName') || '').trim();
  const attendance = formData.get('attendance');

  if (!groupName) {
    throw new Error('validation');
  }

  if (attendance !== 'si' && attendance !== 'no') {
    throw new Error('validation');
  }

  if (attendance === 'no') {
    return {
      groupName,
      attendance,
      guestCount: 0,
      guestNames: [],
    };
  }

  const guestCount = Math.max(1, Math.min(12, Number(formData.get('guestCount')) || 0));
  const guestNames = Array.from({ length: guestCount }, (_, index) =>
    String(formData.get(`guest_${index + 1}`) || '').trim()
  );

  if (guestCount < 1 || guestNames.some((name) => !name)) {
    throw new Error('validation');
  }

  return {
    groupName,
    attendance,
    guestCount,
    guestNames,
  };
}

async function submitRsvp(payload) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'PEGAR_URL_AQUI') {
    throw new Error('missing-endpoint');
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let responseData = null;

  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }

  if (!response.ok || !responseData || responseData.status !== 'ok') {
    throw new Error('request-failed');
  }
}

function setSubmittingState(isSubmitting) {
  if (!submitButton) {
    return;
  }

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? 'Enviando...' : defaultSubmitButtonText;
}

function resetRsvpForm() {
  form.reset();
  generatedFields.innerHTML = '';
  guestCountInput.value = 1;
  updateAttendanceState('');
}

attendanceInputs.forEach((input) => {
  input.addEventListener('change', (event) => {
    clearFormFeedback();
    updateAttendanceState(event.target.value);
  });
});

guestCountInput.addEventListener('input', () => {
  clearFormFeedback();

  const count = Math.max(1, Math.min(12, Number(guestCountInput.value) || 1));
  guestCountInput.value = count;
  createGuestFields(count);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFormFeedback();

  let payload;

  try {
    payload = buildPayload();
  } catch {
    setMessageState(
      formFeedback,
      'not-attending',
      'No se pudo enviar la confirmación. Intentá nuevamente.'
    );
    return;
  }

  try {
    setSubmittingState(true);
    await submitRsvp(payload);

    setMessageState(
      formFeedback,
      payload.attendance === 'si' ? 'attending' : 'not-attending',
      payload.attendance === 'si'
        ? 'Confirmación enviada correctamente.'
        : 'Respuesta enviada correctamente. Gracias por avisarnos.'
    );

    resetRsvpForm();
  } catch {
    setMessageState(
      formFeedback,
      'not-attending',
      'No se pudo enviar la confirmación. Intentá nuevamente.'
    );
  } finally {
    setSubmittingState(false);
  }
});

form.addEventListener('input', clearFormFeedback);

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
