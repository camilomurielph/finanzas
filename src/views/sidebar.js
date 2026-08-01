import { getCurrentUser } from '../config/clerk.js';
import { createElement, appendChildren } from '../utils/domHelpers.js';

const navItems = [
  { id: 'bolsillos', icon: '💰', label: 'Bolsillos' },
  { id: 'gastos', icon: '💳', label: 'Gastos' },
  { id: 'suscripciones', icon: '🔄', label: 'Suscripciones' },
  { id: 'inversiones', icon: '📈', label: 'Inversiones' },
  { id: 'deudas', icon: '🏦', label: 'Deudas' },
  { id: 'sueldo', icon: '🧾', label: 'Sueldo' },
  { id: 'reporte', icon: '📊', label: 'Reporte' },
];

export function renderSidebar(container) {
  const user = getCurrentUser();
  const firstName = user?.firstName || user?.username || 'Usuario';

  const logo = createElement('div', 'logo', { textContent: '💰 Finanzas' });
  const nav = createElement('nav');
  const ul = createElement('ul');
  navItems.forEach(item => {
    const li = createElement('li', '', { 
      'data-view': item.id,
      textContent: `${item.icon} ${item.label}`
    });
    li.classList.add('sidebar-text-label');
    li.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('navigate', { detail: { view: item.id } }));
    });
    ul.appendChild(li);
  });
  appendChildren(nav, [ul]);

  const profile = createElement('div', 'user-profile');
  const avatar = createElement('div', 'avatar', { textContent: firstName.charAt(0).toUpperCase() });
  const nameSpan = createElement('span', '', { textContent: firstName });
  appendChildren(profile, [avatar, nameSpan]);

  appendChildren(container, [logo, nav, profile]);

  document.addEventListener('view-changed', (e) => {
    const activeView = e.detail.view;
    const items = container.querySelectorAll('nav ul li');
    items.forEach(li => {
      li.classList.toggle('active', li.dataset.view === activeView);
    });
  });
}
