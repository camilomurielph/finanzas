console.log('subscriptions.js cargado');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM listo');
  
  // ===== Elementos =====
  const modal = document.getElementById('modal-suscripcion');
  const form = document.getElementById('form-suscripcion');
  const idInput = document.getElementById('suscripcion-id');
  const frecuenciaSelect = document.getElementById('frecuencia');
  const nombreInput = document.getElementById('nombre');
  const valorInput = document.getElementById('valor');
  const labelValor = document.getElementById('label-valor');
  const campoMesPago = document.getElementById('campo-mes-pago');
  const mesSelect = document.getElementById('mes_pago');
  const diaInput = document.getElementById('dia_pago');
  const modalTitle = document.getElementById('modal-suscripcion-title');
  const btnAgregar = document.getElementById('btn-agregar-suscripcion');

  console.log('btnAgregar:', btnAgregar);

  // ===== Funciones auxiliares =====
  function actualizarCamposFrecuencia() {
    const esAnual = frecuenciaSelect && frecuenciaSelect.value === 'anual';
    if (campoMesPago) {
      campoMesPago.classList.toggle('hidden', !esAnual);
      campoMesPago.style.display = esAnual ? 'block' : 'none';
    }
    if (mesSelect) {
      mesSelect.required = esAnual;
      if (!esAnual) mesSelect.value = '';
    }
    if (labelValor && valorInput) {
      // Actualiza solo el nodo de texto de la etiqueta sin perder el input
      labelValor.firstChild.textContent = esAnual ? 'Valor anual (COP) ' : 'Valor mensual (COP) ';
    }
  }

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
  function closeAllMenus() {
    document.querySelectorAll('.suscripcion-actions.open').forEach(el => {
      el.classList.remove('open');
    });
  }

  if (frecuenciaSelect) {
    frecuenciaSelect.addEventListener('change', actualizarCamposFrecuencia);
  }

  // Cerrar modal al hacer clic en la 'X' o fuera del contenido
  const closeBtn = document.querySelector('#modal-suscripcion .close');
  if (closeBtn) closeBtn.addEventListener('click', hideModal);
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) hideModal();
    });
  }

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
  if (btnAgregar) {
    btnAgregar.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Click en Nueva suscripción');
      if (idInput) idInput.value = '';
      if (modalTitle) modalTitle.textContent = 'Agregar suscripción';
      if (form) form.reset();
      if (frecuenciaSelect) frecuenciaSelect.value = 'mensual';
      actualizarCamposFrecuencia();
      showModal();
    });
  } else {
    console.error('Botón btn-agregar-suscripcion no encontrado');
  }

  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const frecuencia = frecuenciaSelect ? frecuenciaSelect.value : 'mensual';
      const data = {
        nombre: nombreInput ? nombreInput.value.trim() : '',
        valor: valorInput ? valorInput.value : '',
        dia_pago: diaInput ? diaInput.value : '',
        frecuencia: frecuencia,
        mes_pago: frecuencia === 'anual' && mesSelect ? mesSelect.value : null
      };
      const id = idInput ? idInput.value : '';
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
      .catch(err => alert('Error de red: ' + err.message));
    });
  }

  // ===== Editar suscripción =====
  function editarSuscripcion(id) {
    fetch(`/suscripciones/api/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('No se pudo obtener la suscripción');
        return res.json();
      })
      .then(s => {
        if (idInput) idInput.value = s.id;
        if (modalTitle) modalTitle.textContent = 'Editar suscripción';
        if (frecuenciaSelect) frecuenciaSelect.value = s.frecuencia || 'mensual';
        actualizarCamposFrecuencia();
        if (nombreInput) nombreInput.value = s.nombre;
        if (valorInput) valorInput.value = s.valor;
        if (mesSelect && s.mes_pago) mesSelect.value = s.mes_pago;
        if (diaInput) diaInput.value = s.dia_pago;
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
