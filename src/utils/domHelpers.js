export function createElement(tag, className = '', attributes = {}, children = []) {
  const el = document.createElement(tag);
  if (className) {
    if (Array.isArray(className)) {
      el.classList.add(...className);
    } else {
      el.className = className;
    }
  }
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'textContent') {
      el.textContent = value;
    } else if (key === 'innerHTML') {
      el.innerHTML = value;
    } else {
      el.setAttribute(key, value);
    }
  });
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  });
  return el;
}

export function appendChildren(parent, children) {
  children.forEach(child => {
    if (typeof child === 'string') {
      parent.appendChild(document.createTextNode(child));
    } else {
      parent.appendChild(child);
    }
  });
  return parent;
}

export function clearElement(el) {
  el.innerHTML = '';
}

export function showModal(title, contentHTML, onConfirm, confirmText = 'Confirmar', cancelText = 'Cancelar') {
  const overlay = createElement('div', 'modal-overlay');
  const modal = createElement('div', 'modal-content');
  const h2 = createElement('h2', '', { textContent: title });
  const body = createElement('div', 'modal-body', { innerHTML: contentHTML });
  const actions = createElement('div', 'form-actions');
  const btnCancel = createElement('button', 'btn btn-secondary', { textContent: cancelText });
  const btnConfirm = createElement('button', 'btn btn-primary', { textContent: confirmText });

  btnCancel.addEventListener('click', () => document.body.removeChild(overlay));
  btnConfirm.addEventListener('click', () => {
    if (onConfirm) onConfirm();
    document.body.removeChild(overlay);
  });

  appendChildren(actions, [btnCancel, btnConfirm]);
  appendChildren(modal, [h2, body, actions]);
  appendChildren(overlay, [modal]);
  document.body.appendChild(overlay);
  return overlay;
}
