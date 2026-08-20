function stepValue(input, direction) {
  if (input.disabled || input.readOnly) return;

  try {
    if (direction > 0) {
      input.stepUp();
    } else {
      input.stepDown();
    }
  } catch {
    return;
  }

  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export function initNumberSteppers() {
  const steps = document.querySelectorAll(".form-field__step");
  if (!steps.length) return;

  steps.forEach((step) => {
    const field = step.closest(".form-field--number");
    const input = field && field.querySelector("input[type='number']");
    if (!input) return;

    const direction = step.classList.contains("form-field__step--up") ? 1 : -1;

    // Keep the caret in the field so Arrow Up / Arrow Down keeps working
    // right after a pointer interaction.
    step.addEventListener("mousedown", (event) => event.preventDefault());

    step.addEventListener("click", () => {
      stepValue(input, direction);
      input.focus();
    });
  });
}
