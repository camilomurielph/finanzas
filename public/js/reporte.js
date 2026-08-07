console.log('reporte.js cargado');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM listo - reporte');

  const modal = document.getElementById('modal-nombre');
  const form = document.getElementById('form-nombre');
  const btnGenerar = document.getElementById('btn-generar-pdf');

  function showModal() {
    if (modal) {
      modal.classList.add('visible');
      modal.style.display = 'flex';
    }
  }

  function hideModal() {
    if (modal) {
      modal.classList.remove('visible');
      modal.style.display = 'none';
    }
  }

  // Cerrar modal
  const closeBtn = document.querySelector('#modal-nombre .close');
  if (closeBtn) closeBtn.addEventListener('click', hideModal);
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) hideModal();
    });
  }

  // Abrir modal al hacer clic en "Descargar PDF"
  if (btnGenerar) {
    btnGenerar.addEventListener('click', function(e) {
      e.preventDefault();
      if (form) form.reset();
      showModal();
    });
  }

  // Enviar formulario
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const nombre = document.getElementById('nombre-usuario').value.trim();
      if (!nombre) return alert('Ingresa un nombre');

      // Redirigir a la generación del PDF con el nombre como parámetro
      window.location.href = `/reporte/pdf?nombre=${encodeURIComponent(nombre)}`;
      hideModal();
    });
  }
});
