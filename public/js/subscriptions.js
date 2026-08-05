document.addEventListener('DOMContentLoaded', function() {
  // ===== Elementos =====
  const modal = document.getElementById('modal-suscripcion');
  const form = document.getElementById('form-suscripcion');
  const idInput = document.getElementById('suscripcion-id');
  const nombreInput = document.getElementById('nombre');
  const valorInput = document.getElementById('valor');
  const diaInput = document.getElementById('dia_pago');
  const modalTitle = document.getElementById('modal-suscripcion-title');
  const btnAgregar = document.getElementById('btn-agregar-suscripcion');

  // ===== Funciones auxiliares =====
  function showModal() {
    modal.classList.add('visible');
    modal.style.display = 'flex';
  }
  function hideModal() {
    modal.classList.remove('visible');
    modal.style.display = 'none';
  }
  function closeAllMenus() {
    document.querySelectorAll('.suscripcion-actions.open').forEach(el => {
      el.classList.remove('open');
    });
  }

  // Cerrar modal al hacer clic en la 'X' o fuera del contenido
  document.querySelector('#modal-suscripcion .close').addEventListener('click', hideModal);
  modal.addEventListener('click', function(e) {
    if (e.target === this) hideModal();
  });

  // ===== Menú de opciones (3 puntos) =====
  document.querySelectorAll('.menu-tres-puntos').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      const id = this.dataset.id;
      const actions = document.getElementById(`acciones-${id}`);
      if (actions) {
        closeAllMenus();
        actions.classList.toggle('open');
      }
    });
  });

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.suscripcion-item')) {
      closeAllMenus();
    }
  });

  // Acciones de los botones dentro del menú
  document.querySelectorAll('.suscripcion-actions .action-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const action = this.dataset.action;
      const id = this.dataset.id;
      const actionsContainer = this.closest('.suscripcion-actions');
      if (actionsContainer) actionsContainer.classList.remove('open');

      if (action === 'editar') editarSuscripcion(id);
      else if (action === 'borrar') borrarSuscripcion(id);
    });
  });

  // ===== Agregar nueva suscripción =====
  btnAgregar.addEventListener('click', function() {
    idInput.value = '';
    modalTitle.textContent = 'Agregar suscripción';
    form.reset();
    showModal();
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
      nombre: nombreInput.value.trim(),
      valor: valorInput.value,
      dia_pago: diaInput.value
    };
    const id = idInput.value;
    const url = id ? `/suscripciones/editar/${id}` : '/suscripciones/agregar';
    const method = id ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        location.reload();
      } else {
        alert('Error: ' + result.error);
      }
    })
    .catch(err => alert('Error de red'));
  });

  // ===== Editar suscripción =====
  function editarSuscripcion(id) {
    fetch(`/suscripciones/api/${id}`)
      .then(res => res.json())
      .then(s => {
        idInput.value = s.id;
        modalTitle.textContent = 'Editar suscripción';
        nombreInput.value = s.nombre;
        valorInput.value = s.valor;
        diaInput.value = s.dia_pago;
        showModal();
      })
      .catch(err => alert('Error al cargar datos: ' + err.message));
  }

  // ===== Borrar suscripción =====
  function borrarSuscripcion(id) {
    if (!confirm('¿Eliminar esta suscripción?')) return;
    fetch(`/suscripciones/borrar/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(result => {
        if (result.success) location.reload();
        else alert('Error: ' + result.error);
      });
  }
});
