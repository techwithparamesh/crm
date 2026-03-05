/**
 * Serves the embeddable form script (GET /forms/embed.js).
 * Script fetches form config, renders fields, validates, and submits.
 */

export function getEmbedScriptContent(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/$/, "");
  return `
(function() {
  var API_BASE = "${base}";
  var forms = document.querySelectorAll("[data-crm-form]");
  forms.forEach(function(el) {
    var formId = el.getAttribute("data-crm-form");
    var apiUrl = el.getAttribute("data-crm-api") || API_BASE;
    if (!formId) return;
    loadForm(el, formId, apiUrl);
  });

  function loadForm(container, formId, apiUrl) {
    fetch(apiUrl + "/forms/" + formId + "/config")
      .then(function(r) { return r.json(); })
      .then(function(config) {
        renderForm(container, formId, config, apiUrl);
      })
      .catch(function() {
        container.innerHTML = "<p>Form could not be loaded.</p>";
      });
  }

  function renderForm(container, formId, config, apiUrl) {
    var form = document.createElement("form");
    form.className = "crm-embed-form";
    form.setAttribute("data-form-id", formId);

    var title = document.createElement("h3");
    title.textContent = config.formName || "Contact";
    form.appendChild(title);

    config.fields.forEach(function(f) {
      var wrap = document.createElement("div");
      wrap.className = "crm-field";
      var label = document.createElement("label");
      label.textContent = f.label || f.fieldKey;
      if (f.required) label.innerHTML += " *";
      var input = document.createElement(
        f.type === "textarea" ? "textarea" : "input"
      );
      input.name = f.fieldKey;
      input.type = f.type === "phone" ? "tel" : (f.type === "email" ? "email" : "text");
      input.required = !!f.required;
      if (f.placeholder) input.placeholder = f.placeholder;
      wrap.appendChild(label);
      wrap.appendChild(input);
      form.appendChild(wrap);
    });

    if (config.recaptchaEnabled && config.recaptchaSiteKey) {
      var recaptchaDiv = document.createElement("div");
      recaptchaDiv.className = "crm-recaptcha";
      recaptchaDiv.id = "recaptcha-" + formId;
      form.appendChild(recaptchaDiv);
    }

    var submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.textContent = "Submit";
    form.appendChild(submitBtn);

    var messageDiv = document.createElement("div");
    messageDiv.className = "crm-form-message";
    form.appendChild(messageDiv);

    form.onsubmit = function(e) {
      e.preventDefault();
      var values = {};
      var inputs = form.querySelectorAll("input, textarea");
      inputs.forEach(function(inp) {
        if (inp.name) values[inp.name] = inp.value;
      });
      var payload = { values: values };
      if (config.recaptchaEnabled && typeof grecaptcha !== "undefined") {
        var widgetId = window.__crmRecaptchaWidget && window.__crmRecaptchaWidget[formId];
        if (widgetId != null) {
          payload.recaptchaToken = grecaptcha.getResponse(widgetId);
        }
      }
      submitBtn.disabled = true;
      messageDiv.textContent = "Sending...";
      fetch(apiUrl + "/forms/" + formId + "/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.successMessage) {
            messageDiv.textContent = data.successMessage;
            messageDiv.className = "crm-form-message crm-success";
            form.reset();
          } else if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          } else {
            messageDiv.textContent = "Thank you!";
            messageDiv.className = "crm-form-message crm-success";
            form.reset();
          }
        })
        .catch(function() {
          messageDiv.textContent = "Something went wrong. Please try again.";
          messageDiv.className = "crm-form-message crm-error";
          submitBtn.disabled = false;
        });
      return false;
    };

    container.appendChild(form);

    if (config.recaptchaEnabled && config.recaptchaSiteKey && typeof grecaptcha !== "undefined") {
      window.__crmRecaptchaWidget = window.__crmRecaptchaWidget || {};
      grecaptcha.ready(function() {
        window.__crmRecaptchaWidget[formId] = grecaptcha.render("recaptcha-" + formId, {
          sitekey: config.recaptchaSiteKey,
          theme: "light"
        });
      });
    }
  }
})();
`;
}
