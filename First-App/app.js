import {
  getNextRenewalDate,
  getDaysAway,
  getRenewalStatus,
  getCancelByInfo,
  parseISODate,
  formatISODate,
  addDays,
  getUpcomingRenewalsTotal,
} from './calculations.js';
import { loadSubscriptions, saveSubscriptions } from './storage.js';

const REVIEW_DISCLAIMER = "This summary reflects your answers only. It isn't financial advice.";

const REVIEW_QUESTIONS = [
  {
    key: 'usedRecently',
    legend: 'Have you used this recently?',
    options: [['yes', 'Yes'], ['no', 'No']],
  },
  {
    key: 'wouldSignUpAgain',
    legend: 'If deciding today, would you sign up again?',
    options: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']],
  },
  {
    key: 'hasSimilarAlternative',
    legend: 'Do you have another service with a similar benefit?',
    options: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']],
  },
];

function getReviewResultMessage(review) {
  if (review.usedRecently === 'yes' && review.wouldSignUpAgain === 'yes' && review.hasSimilarAlternative === 'no') {
    return 'Your answers indicate that this subscription is currently providing value for you.';
  }
  if (review.usedRecently === 'no' && review.wouldSignUpAgain === 'no' && review.hasSimilarAlternative === 'yes') {
    return 'Your answers suggest this subscription may be worth reviewing before renewal.';
  }
  return 'Your answers are mixed. Consider reviewing the cost, usage, and alternatives before renewal.';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// "Today" is read once per render from the user's local calendar day
// (not UTC), then passed into the pure calculations.js functions.
function getToday() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

function formatDisplayDate(date) {
  return `${MONTH_NAMES[date.month - 1]} ${date.day}, ${date.year}`;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Shown once, only on a visitor's very first load (see the seeding check
// below), so the app isn't a blank page before anyone has added anything.
// Dates are relative to today so they still make sense on any visit date.
function getDefaultSubscriptions(today) {
  return [
    {
      id: 'seed-netflix',
      name: 'Netflix',
      cost: 15.49,
      frequency: 'monthly',
      anchorDate: formatISODate(addDays(today, 3)),
      noticeDays: null,
      review: null,
    },
    {
      id: 'seed-gym',
      name: 'Gym Membership',
      cost: 40,
      frequency: 'monthly',
      anchorDate: formatISODate(addDays(today, 2)),
      noticeDays: 10,
      review: null,
    },
    {
      id: 'seed-spotify',
      name: 'Spotify',
      cost: 11.99,
      frequency: 'monthly',
      anchorDate: formatISODate(addDays(today, 18)),
      noticeDays: 5,
      review: null,
    },
    {
      id: 'seed-adobe',
      name: 'Adobe Creative Cloud',
      cost: 599.88,
      frequency: 'annual',
      anchorDate: formatISODate(addDays(today, 120)),
      noticeDays: null,
      review: null,
    },
    {
      id: 'seed-hulu-trial',
      name: 'Hulu (Free Trial)',
      cost: 7.99,
      frequency: 'monthly',
      anchorDate: formatISODate(addDays(today, 2)),
      noticeDays: 1,
      review: null,
    },
    {
      id: 'seed-audible-trial',
      name: 'Audible (Free Trial)',
      cost: 14.95,
      frequency: 'monthly',
      anchorDate: formatISODate(addDays(today, 12)),
      noticeDays: 3,
      review: null,
    },
  ];
}

function statusClass(status) {
  if (status === 'Renewing soon') {
    return 'soon';
  }
  if (status === 'Coming up') {
    return 'coming-up';
  }
  return 'later';
}

let subscriptions = loadSubscriptions();
if (subscriptions === null) {
  subscriptions = getDefaultSubscriptions(getToday());
  saveSubscriptions(subscriptions);
}

const form = document.getElementById('subscription-form');
const nameInput = document.getElementById('name');
const costInput = document.getElementById('cost');
const frequencyInput = document.getElementById('frequency');
const renewalDateInput = document.getElementById('renewal-date');
const noticeDaysInput = document.getElementById('notice-days');

const errorElements = {
  name: document.getElementById('name-error'),
  cost: document.getElementById('cost-error'),
  frequency: document.getElementById('frequency-error'),
  renewalDate: document.getElementById('renewal-date-error'),
  noticeDays: document.getElementById('notice-days-error'),
};

function clearErrors() {
  for (const key in errorElements) {
    errorElements[key].textContent = '';
  }
}

function validateForm(values) {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = 'Name is required.';
  } else if (values.name.length > 60) {
    errors.name = 'Name must be 60 characters or fewer.';
  }

  if (values.cost === '') {
    errors.cost = 'Cost is required.';
  } else {
    const cost = Number(values.cost);
    if (Number.isNaN(cost) || cost <= 0) {
      errors.cost = 'Cost must be a number greater than 0.';
    }
  }

  if (!values.frequency) {
    errors.frequency = 'Billing frequency is required.';
  }

  if (!values.renewalDate) {
    errors.renewalDate = 'Next renewal date is required.';
  }

  if (values.noticeDays !== '') {
    const noticeDays = Number(values.noticeDays);
    if (!Number.isInteger(noticeDays) || noticeDays < 1 || noticeDays > 365) {
      errors.noticeDays = 'Notice must be a whole number from 1 to 365.';
    }
  }

  return errors;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearErrors();

  const values = {
    name: nameInput.value,
    cost: costInput.value,
    frequency: frequencyInput.value,
    renewalDate: renewalDateInput.value,
    noticeDays: noticeDaysInput.value,
  };

  const errors = validateForm(values);
  if (Object.keys(errors).length > 0) {
    for (const key in errors) {
      errorElements[key].textContent = errors[key];
    }
    return;
  }

  subscriptions.push({
    id: generateId(),
    name: values.name.trim(),
    cost: Number(values.cost),
    frequency: values.frequency,
    anchorDate: values.renewalDate,
    noticeDays: values.noticeDays === '' ? null : Number(values.noticeDays),
    review: null,
  });

  saveSubscriptions(subscriptions);
  form.reset();
  render();
});

document.getElementById('empty-state-add-button').addEventListener('click', () => {
  nameInput.focus();
});

function deleteSubscription(id) {
  subscriptions = subscriptions.filter((subscription) => subscription.id !== id);
  saveSubscriptions(subscriptions);
  render();
}

function renderDeleteControl(container, subscription) {
  container.innerHTML = '';
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete-button';
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', () => {
    renderConfirmDelete(container, subscription);
  });
  container.appendChild(deleteButton);
}

function renderConfirmDelete(container, subscription) {
  container.innerHTML = '';

  const prompt = document.createElement('span');
  prompt.className = 'confirm-prompt';
  prompt.textContent = `Delete ${subscription.name}?`;

  const confirmButton = document.createElement('button');
  confirmButton.type = 'button';
  confirmButton.className = 'confirm-delete-button';
  confirmButton.textContent = 'Yes, delete';
  confirmButton.addEventListener('click', () => {
    deleteSubscription(subscription.id);
  });

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'cancel-delete-button';
  cancelButton.textContent = 'Cancel';
  cancelButton.addEventListener('click', () => {
    renderDeleteControl(container, subscription);
  });

  container.appendChild(prompt);
  container.appendChild(confirmButton);
  container.appendChild(cancelButton);
}

function renderReviewControl(container, subscription) {
  container.innerHTML = '';
  if (subscription.review) {
    renderReviewResult(container, subscription);
  } else {
    renderStartReviewButton(container, subscription, 'Start renewal review');
  }
}

function renderStartReviewButton(container, subscription, label) {
  container.innerHTML = '';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'start-review-button';
  button.textContent = label;
  button.addEventListener('click', () => {
    renderReviewForm(container, subscription);
  });
  container.appendChild(button);
}

function renderReviewResult(container, subscription) {
  container.innerHTML = '';

  const messageEl = document.createElement('p');
  messageEl.className = 'review-message';
  messageEl.textContent = getReviewResultMessage(subscription.review);

  const disclaimerEl = document.createElement('p');
  disclaimerEl.className = 'review-disclaimer';
  disclaimerEl.textContent = REVIEW_DISCLAIMER;

  const dateEl = document.createElement('p');
  dateEl.className = 'review-date';
  dateEl.textContent = `Reviewed on ${formatDisplayDate(parseISODate(subscription.review.answeredOn))}`;

  const retakeButton = document.createElement('button');
  retakeButton.type = 'button';
  retakeButton.className = 'start-review-button';
  retakeButton.textContent = 'Retake review';
  retakeButton.addEventListener('click', () => {
    renderReviewForm(container, subscription);
  });

  container.appendChild(messageEl);
  container.appendChild(disclaimerEl);
  container.appendChild(dateEl);
  container.appendChild(retakeButton);
}

function buildReviewFieldset(name, question) {
  const fieldset = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = question.legend;
  fieldset.appendChild(legend);

  for (const [value, optionLabel] of question.options) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.value = value;
    label.appendChild(input);
    label.append(` ${optionLabel}`);
    fieldset.appendChild(label);
  }

  return fieldset;
}

function getSelectedRadioValue(form, name) {
  const selected = form.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : null;
}

function renderReviewForm(container, subscription) {
  container.innerHTML = '';

  const form = document.createElement('form');
  form.className = 'review-form';
  form.noValidate = true;

  const fieldNames = {};
  for (const question of REVIEW_QUESTIONS) {
    const fieldName = `review-${subscription.id}-${question.key}`;
    fieldNames[question.key] = fieldName;
    form.appendChild(buildReviewFieldset(fieldName, question));
  }

  const errorEl = document.createElement('span');
  errorEl.className = 'error';
  form.appendChild(errorEl);

  const saveButton = document.createElement('button');
  saveButton.type = 'submit';
  saveButton.textContent = 'Save review';
  form.appendChild(saveButton);

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.textContent = 'Cancel';
  cancelButton.addEventListener('click', () => {
    renderReviewControl(container, subscription);
  });
  form.appendChild(cancelButton);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const answers = {};
    for (const question of REVIEW_QUESTIONS) {
      answers[question.key] = getSelectedRadioValue(form, fieldNames[question.key]);
    }

    if (!answers.usedRecently || !answers.wouldSignUpAgain || !answers.hasSimilarAlternative) {
      errorEl.textContent = 'Please answer all three questions.';
      return;
    }

    subscription.review = {
      usedRecently: answers.usedRecently,
      wouldSignUpAgain: answers.wouldSignUpAgain,
      hasSimilarAlternative: answers.hasSimilarAlternative,
      answeredOn: formatISODate(getToday()),
    };
    saveSubscriptions(subscriptions);
    render();
  });

  container.appendChild(form);
}

function renderCard({ subscription, nextRenewal, daysAway }, today) {
  const li = document.createElement('li');
  li.className = 'subscription-card';

  const status = getRenewalStatus(daysAway);

  let relativeText;
  if (daysAway === 0) {
    relativeText = 'Renews today';
  } else if (daysAway === 1) {
    relativeText = 'Renews tomorrow';
  } else {
    relativeText = `Renews in ${daysAway} days`;
  }

  // Cancel-by text is urgent (styled in red) once its deadline has passed,
  // or once it's 7 days away or closer -- otherwise it reads as normal text.
  let cancelByText = '';
  let cancelByUrgent = false;
  if (subscription.noticeDays != null) {
    const cancelByInfo = getCancelByInfo(nextRenewal, subscription.noticeDays, today);
    if (cancelByInfo.deadlinePassed) {
      cancelByText = 'Cancellation deadline passed';
      cancelByUrgent = true;
    } else {
      cancelByText = `Cancel by ${formatDisplayDate(cancelByInfo.date)}`;
      cancelByUrgent = getDaysAway(cancelByInfo.date, today) <= 7;
    }
  }

  li.innerHTML = `
    <div class="card-header">
      <h3 class="name"></h3>
      <span class="status status-${statusClass(status)}">${status}</span>
    </div>
    <p class="cost">$${subscription.cost.toFixed(2)} / ${subscription.frequency}</p>
    <p class="renewal-line">${formatDisplayDate(nextRenewal)} — ${relativeText}</p>
    ${cancelByText ? `<p class="cancel-by${cancelByUrgent ? ' cancel-by-urgent' : ''}">${cancelByText}</p>` : ''}
  `;
  li.querySelector('.name').textContent = subscription.name;

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const reviewContainer = document.createElement('div');
  reviewContainer.className = 'review-container';
  renderReviewControl(reviewContainer, subscription);
  actions.appendChild(reviewContainer);

  const deleteContainer = document.createElement('div');
  deleteContainer.className = 'delete-container';
  renderDeleteControl(deleteContainer, subscription);
  actions.appendChild(deleteContainer);

  li.appendChild(actions);

  return li;
}

function renderSummary(withComputed, today) {
  const summaryEl = document.getElementById('summary');
  summaryEl.innerHTML = '';

  if (subscriptions.length === 0) {
    return;
  }

  const total = getUpcomingRenewalsTotal(
    subscriptions.map((subscription) => ({
      cost: subscription.cost,
      frequency: subscription.frequency,
      anchor: parseISODate(subscription.anchorDate),
    })),
    today
  );

  const soonCount = withComputed.filter(
    (item) => getRenewalStatus(item.daysAway) === 'Renewing soon'
  ).length;

  const attentionText = soonCount > 0
    ? ` — ${soonCount} subscription${soonCount === 1 ? '' : 's'} need${soonCount === 1 ? 's' : ''} attention`
    : '';

  const hero = document.createElement('div');
  hero.className = 'hero-stat';
  hero.innerHTML = `
    <div class="hero-stat-amount">$${total.toFixed(2)}</div>
    <div class="hero-stat-label">renewing in the next 30 days${attentionText}</div>
  `;

  const quietStats = document.createElement('p');
  quietStats.className = 'quiet-stats';
  quietStats.textContent = `${subscriptions.length} subscription${subscriptions.length === 1 ? '' : 's'} tracked`;

  summaryEl.appendChild(hero);
  summaryEl.appendChild(quietStats);
}

function renderList(withComputed, today) {
  const listEl = document.getElementById('subscription-list');
  const emptyStateEl = document.getElementById('empty-state');
  listEl.innerHTML = '';

  if (subscriptions.length === 0) {
    emptyStateEl.hidden = false;
    return;
  }
  emptyStateEl.hidden = true;

  for (const item of withComputed) {
    listEl.appendChild(renderCard(item, today));
  }
}

function render() {
  const today = getToday();

  const withComputed = subscriptions.map((subscription) => {
    const anchor = parseISODate(subscription.anchorDate);
    const nextRenewal = getNextRenewalDate(anchor, subscription.frequency, today);
    const daysAway = getDaysAway(nextRenewal, today);
    return { subscription, nextRenewal, daysAway };
  });
  withComputed.sort((a, b) => a.daysAway - b.daysAway);

  renderSummary(withComputed, today);
  renderList(withComputed, today);
}

render();
