document.addEventListener('DOMContentLoaded', function() {
  // ===== MENÚ HAMBURGUESA =====
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('menu-overlay');
  const hamburger = document.getElementById('hamburger');
  const closeMenuBtn = document.getElementById('close-menu');

  function openMenu() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (hamburger) hamburger.classList.add('active');
  }

  function closeMenu() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    if (hamburger) hamburger.classList.remove('active');
  }

  if (hamburger) {
    hamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      if (sidebar.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', closeMenu);
  }

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  // Cerrar menú al hacer clic en un enlace (navegación)
  document.querySelectorAll('.sidebar nav a').forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth < 768) {
        closeMenu();
      }
    });
  });

  // ===== CIERRE AUTOMÁTICO AL REDIMENSIONAR A ESCRITORIO =====
  window.addEventListener('resize', function() {
    if (window.innerWidth >= 768 && sidebar.classList.contains('open')) {
      closeMenu();
    }
  });

  // ===== ANIMACIONES ADICIONALES =====
  // Efecto sutil al cargar elementos
  document.querySelectorAll('.gasto-item, .cuenta-btn, .btn-primary, .btn-secondary').forEach(el => {
    el.addEventListener('touchstart', function() {
      this.style.transition = 'transform 0.1s';
    }, { passive: true });
  });

  // ===== PREVENIR ZOOM EN INPUTS (mejora UX en móviles) =====
  document.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('focus', function() {
      if (window.innerWidth < 768) {
        // Pequeño retraso para evitar que el teclado tape el campo
        setTimeout(() => {
          this.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    });
  });
});
