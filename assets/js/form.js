const validators = {
  required: (value) => value.trim().length > 0,
  email: (value) => /\S+@\S+\.\S+/.test(value),
  tel: (value) => /^\+[1-9]\d{1,14}$/.test(normalizePhone(value)),
  number: (value) => !Number.isNaN(Number(value)) && Number(value) > 0,
};

function normalizePhone(value) {
  return value
    .trim()
    .replace(/[\s().-]/g, "")
    .replace(/(?!^)\+/g, "")
    .replace(/[^\d+]/g, "");
}

const quoteHistory = [];

function showError(input, message) {
  const errorEl = getErrorElement(input);
  if (errorEl) errorEl.textContent = message;
  input.setAttribute("aria-invalid", "true");
  input.classList.add("invalid");
}

function clearError(input) {
  const errorEl = getErrorElement(input);
  if (errorEl) errorEl.textContent = "";
  input.removeAttribute("aria-invalid");
  input.classList.remove("invalid");
}

function getErrorElement(input) {
  const describedBy = input.getAttribute("aria-describedby");
  let errorId = describedBy && describedBy.trim();

  if (!errorId) {
    const baseId = input.id || input.name;
    if (!baseId) return null;
    errorId = `${baseId}-error`;
    input.setAttribute("aria-describedby", errorId);
  }

  const errorEl = document.getElementById(errorId);
  if (errorEl) {
    errorEl.setAttribute("aria-live", "polite");
  }
  return errorEl;
}

function validateField(input) {
  const type = input.getAttribute("type");
  const required = input.hasAttribute("required");
  const value = input.value;

  if (required && !validators.required(value)) {
    showError(input, "To pole jest wymagane.");
    return false;
  }

  if (type === "email" && value && !validators.email(value)) {
    showError(input, "Podaj prawidłowy adres email.");
    return false;
  }

  if (type === "tel" && value && !validators.tel(value)) {
    showError(input, "Podaj numer w formacie międzynarodowym, np. +48123456789.");
    return false;
  }

  if (type === "number" && required && !validators.number(value)) {
    showError(input, "Wpisz wartość większą od zera.");
    return false;
  }

  if (input.tagName === "SELECT" && required && !validators.required(value)) {
    showError(input, "Wybierz opcję z listy.");
    return false;
  }

  clearError(input);
  return true;
}

function attachValidation(form, { onValid, resetOnValid = true, allowNativeSubmit = false } = {}) {
  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    input.addEventListener("blur", () => validateField(input));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;
    let firstInvalidInput = null;
    inputs.forEach((input) => {
      if (!validateField(input)) {
        valid = false;
        if (!firstInvalidInput) firstInvalidInput = input;
      }
    });

    const requiredCheckbox = form.querySelector("input[type='checkbox'][required]");
    if (requiredCheckbox && !requiredCheckbox.checked) {
      showError(requiredCheckbox, "Zgoda jest wymagana.");
      valid = false;
      if (!firstInvalidInput) firstInvalidInput = requiredCheckbox;
    } else if (requiredCheckbox) {
      clearError(requiredCheckbox);
    }

    if (!valid) {
      firstInvalidInput?.focus();
      return;
    }

    if (typeof onValid === "function") {
      onValid();
      return;
    }

    if (allowNativeSubmit) {
      form.submit();
      return;
    }

    if (resetOnValid) form.reset();
    const success = form.querySelector(".form__success");
    if (success) {
      success.hidden = false;
      success.focus?.();
    }
  });
}

function calculateRate(distance, weight, type, extras = []) {
  const base =
    {
      standard: 1.8,
      express: 2.4,
      adr: 2.9,
      chlodnia: 3.1,
      cold: 3.1,
    }[type] || 1.8;

  let rate = base;
  if (weight > 1000) rate += 0.2;
  if (weight > 5000) rate += 0.4;
  if (extras.includes("lift")) rate += 0.15;
  if (extras.includes("insurance")) rate += 0.2;
  if (extras.includes("weekend") || extras.includes("tail")) rate += 0.1;
  return distance * rate;
}

function initQuickQuote() {
  const form = document.getElementById("quick-quote");
  const result = document.getElementById("quote-result");
  const historyList = document.getElementById("quote-history");
  if (!form || !result) return;

  attachValidation(form, {
    resetOnValid: false,
    onValid: () => {
      const distance = Number(form.distance.value);
      const weight = Number(form.weight.value);
      const type = form.serviceType.value;
      const extras = Array.from(form.querySelectorAll("input[type='checkbox']:checked")).map((c) => c.value);

      if (!distance || !weight || !type) {
        result.textContent = "Uzupełnij pola, aby obliczyć koszt.";
        return;
      }

      const price = calculateRate(distance, weight, type, extras);
      result.textContent = `Szacowana stawka: ${price.toFixed(0)} zł netto`;

      const typeLabels = {
        standard: "Standard",
        express: "Express",
        adr: "ADR",
        cold: "Chłodnia",
        chlodnia: "Chłodnia",
      };

      const typeLabel = typeLabels[type] || type;
      const extrasLabel =
        extras.length > 0
          ? " · +" +
            extras
              .map((e) => {
                if (e === "lift") return "winda";
                if (e === "insurance") return "ubezpieczenie";
                if (e === "weekend") return "weekend";
                return e;
              })
              .join(", ")
          : "";

      quoteHistory.unshift({
        distance,
        weight,
        type,
        typeLabel,
        extras,
        extrasLabel,
        price,
      });
      if (quoteHistory.length > 5) {
        quoteHistory.length = 5;
      }
      renderQuoteHistory(historyList);
    },
  });
}

function initPricingForm() {
  const form = document.getElementById("pricing-form");
  const result = document.getElementById("pricing-result");
  if (!form || !result) return;
  attachValidation(form, {
    resetOnValid: false,
    onValid: () => {
      const distance = Number(form.distance.value);
      const weight = Number(form.weight.value);
      const type = form.service.value;
      const extras = Array.from(form.querySelectorAll("input[type='checkbox']:checked")).map((c) => c.value);
      if (!distance || !weight || !type) {
        result.textContent = "Uzupełnij wszystkie pola, aby zobaczyć wynik.";
        return;
      }
      const price = calculateRate(distance, weight, type, extras);
      result.textContent = `Szacunkowy koszt: ${price.toFixed(0)} zł netto`;
    },
  });
}

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const success = document.getElementById("contact-success");
  const params = new URLSearchParams(window.location.search);
  if (params.get("success") === "1" && success) {
    success.hidden = false;
    success.tabIndex = -1;
    success.focus?.();
  }

  attachValidation(form, { allowNativeSubmit: true });
}

function renderQuoteHistory(listEl) {
  if (!listEl) return;
  listEl.innerHTML = "";

  quoteHistory.forEach((item) => {
    const li = document.createElement("li");
    li.className = "quote-history__item";
    li.innerHTML = `
      <span class="quote-history__meta">
        ${item.distance} km · ${item.weight} kg · ${item.typeLabel}${item.extrasLabel}
      </span>
      <span class="quote-history__price">
        ${item.price.toFixed(0)} zł
      </span>
    `;
    listEl.appendChild(li);
  });
}

export function initForms() {
  initQuickQuote();
  initPricingForm();
  initContactForm();
}
