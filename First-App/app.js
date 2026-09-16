import {
  getNextRenewalDate,
  getDaysAway,
  getRenewalStatus,
  getCancelByInfo,
  parseISODate,
  getUpcomingRenewalsTotal,
} from './calculations.js';
import { loadSubscriptions, saveSubscriptions } from './storage.js';

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

  let cancelByText = '';
  if (subscription.noticeDays != null) {
    const cancelByInfo = getCancelByInfo(nextRenewal, subscription.noticeDays, today);
    cancelByText = cancelByInfo.deadlinePassed
      ? 'Cancellation deadline passed'
      : `Cancel by ${formatDisplayDate(cancelByInfo.date)}`;
  }

  li.innerHTML = `
    <div class="card-header">
      <h3 class="name"></h3>
      <span class="status status-${statusClass(status)}">${status}</span>
    </div>
    <p class="cost">$${subscription.cost.toFixed(2)} / ${subscription.frequency}</p>
    <p class="renewal-date">${formatDisplayDate(nextRenewal)}</p>
    <p class="relative">${relativeText}</p>
    ${cancelByText ? `<p class="cancel-by">${cancelByText}</p>` : ''}
  `;
  li.querySelector('.name').textContent = subscription.name;

  const deleteContainer = document.createElement('div');
  deleteContainer.className = 'delete-container';
  renderDeleteControl(deleteContainer, subscription);
  li.appendChild(deleteContainer);

  return li;
}

function renderSummary(today) {
  const summaryEl = document.getElementById('summary');
  if (subscriptions.length === 0) {
    summaryEl.textContent = '';
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
  summaryEl.textContent = `Renewing in the next 30 days: $${total.toFixed(2)}`;
}

function renderList(today) {
  const listEl = document.getElementById('subscription-list');
  const emptyStateEl = document.getElementById('empty-state');
  listEl.innerHTML = '';

  if (subscriptions.length === 0) {
    emptyStateEl.hidden = false;
    return;
  }
  emptyStateEl.hidden = true;

  const withComputed = subscriptions.map((subscription) => {
    const anchor = parseISODate(subscription.anchorDate);
    const nextRenewal = getNextRenewalDate(anchor, subscription.frequency, today);
    const daysAway = getDaysAway(nextRenewal, today);
    return { subscription, nextRenewal, daysAway };
  });

  withComputed.sort((a, b) => a.daysAway - b.daysAway);

  for (const item of withComputed) {
    listEl.appendChild(renderCard(item, today));
  }
}

function render() {
  const today = getToday();
  renderSummary(today);
  renderList(today);
}

render();
