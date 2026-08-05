document.addEventListener('DOMContentLoaded', function() {
  // ===== Variables globales =====
  let currentGastoId = null;
  let editing = false;

  // ===== Elementos =====
  const modalGasto = document.getElementById('modal-gasto');
  const modalTipo = document.getElementById('modal-tipo');
  const modalDividir = document.getElementById('modal-dividir');
  const menuContextual = document.getElementById('menu-contextual');

  const formGasto = document.getElementById('form-gasto');
  const formTipo = document.getElementById('form-tipo');
  const gastoIdInput = document.getElementById('gasto-id');
  const modalGastoTitle = document.getElementById('modal-gasto-title');

  const btnAgregarGasto = document.getElementById('btn-agregar-gasto');
  const btnAgregarTipo = document.getElementById('btn-agregar-tipo');
  const btnAgregarCuota = document.getElementById('btn-agregar-cuota');
  const btnGuardarCuotas = document.getElementById('btn-guardar-cuotas');
  const cuotasContainer = document.getElementById('cuotas-container');

  // ===== Funciones auxiliares =====
  function showModal(modal) {
    modal.classList.add('visible');
    modal.style.display = 'flex';
  }
  function hideModal(modal) {
    modal.classList.remove('visible');
    modal.style.display = 'none';
  }
  function closeAllModals() {
    [modalGasto, modalTipo, modalDividir].forEach(hideModal);
    menuContextual.classList.add('hidden');
  }

  // Cerrar modales al hacer clic en la 'X' o fuera del contenido
  document.querySelectorAll('.modal .close').forEach(el => {
    el.addEventListener('click', closeAllModals);
  });
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) closeAllModals();
    });
  });

  // ===== Menú contextual (tres puntos) =====
  document.addEventListener('click', function(e) {
    const target = e.target.closest('.menu-tres-puntos');
    if (target) {
      e.stopPropagation();
      currentGastoId = target.dataset.id;
      const rect = target.getBoundingClientRect();
      menuContextual.style.top = rect.bottom + window.scrollY + 'px';
      menuContextual.style.left = rect.left + window.scrollX - 100 + 'px';
      menuContextual.classList.remove('hidden');
    } else {
      menuContextual.classList.add('hidden');
    }
  });

  // Acciones del menú contextual
  document.querySelectorAll('#menu-contextual ul li').forEach(item => {
    item.addEventListener('click', function() {
      const action = this.dataset.action;
      menuContextual.classList.add('hidden');
      if (!currentGastoId) return;

      switch (action) {
        case 'editar':
          editarGasto(currentGastoId);
          break;
        case 'dividir':
          abrirDividir(currentGastoId);
          break;
        case 'archivar':
          archivarGasto(currentGastoId);
          break;
        case 'borrar':
          borrarGasto(currentGastoId);
          break;
      }
    });
  });

  // ===== Agregar / Editar gasto =====
  btnAgregarGasto.addEventListener('click', function() {
    editing = false;
    gastoIdInput.value = '';
    modalGastoTitle.textContent = 'Agregar gasto';
    formGasto.reset();
    showModal(modalGasto);
  });

  formGasto.addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
      tipo_gasto_id: document.getElementById('tipo_gasto_id').value,
      nombre: document.getElementById('nombre').value,
      fecha: document.getElementById('fecha').value,
      valor_total: document.getElementById('valor_total').value
    };
    const id = gastoIdInput.value;
    const url = id ? `/gastos/editar/${id}` : '/gastos/agregar';
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

  // ===== Editar gasto (usando la API) =====
  function editarGasto(id) {
    fetch(`/gastos/api/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('No se pudo obtener el gasto');
        return res.json();
      })
      .then(gasto => {
        editing = true;
        gastoIdInput.value = gasto.id;
        modalGastoTitle.textContent = 'Editar gasto';
        document.getElementById('tipo_gasto_id').value = gasto.tipo_gasto_id;
        document.getElementById('nombre').value = gasto.nombre;
        document.getElementById('fecha').value = gasto.fecha;
        document.getElementById('valor_total').value = gasto.valor_total;
        showModal(modalGasto);
      })
      .catch(err => alert('Error al cargar datos: ' + err.message));
  }

  // ===== Tipos de gasto =====
  btnAgregarTipo.addEventListener('click', function() {
    showModal(modalTipo);
  });
  formTipo.addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre = document.getElementById('tipo-nombre').value;
    fetch('/gastos/tipos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre })
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

  // ===== Dividir en cuotas =====
  function abrirDividir(id) {
    currentGastoId = id;
    cuotasContainer.innerHTML = '';
    agregarFilaCuota();
    showModal(modalDividir);
  }

  function agregarFilaCuota(nombre = '', valor = '') {
    const div = document.createElement('div');
    div.className = 'cuota-input';
    div.innerHTML = `
      <input type="text" placeholder="Nombre cuota" class="cuota-nombre" value="${nombre}">
      <input type="number" step="0.01" placeholder="Valor" class="cuota-valor" value="${valor}">
      <button class="btn-remove-cuota">✕</button>
    `;
    div.querySelector('.btn-remove-cuota').addEventListener('click', function() {
      if (cuotasContainer.children.length > 1) {
        div.remove();
      } else {
        alert('Debe haber al menos una cuota');
      }
    });
    cuotasContainer.appendChild(div);
  }

  btnAgregarCuota.addEventListener('click', function() {
    agregarFilaCuota();
  });

  btnGuardarCuotas.addEventListener('click', function() {
    const cuotas = [];
    const filas = cuotasContainer.querySelectorAll('.cuota-input');
    filas.forEach(fila => {
      const nombre = fila.querySelector('.cuota-nombre').value.trim();
      const valor = fila.querySelector('.cuota-valor').value.trim();
      if (nombre && valor) {
        cuotas.push({ nombre, valor: parseFloat(valor) });
      }
    });
    if (cuotas.length === 0) {
      alert('Agrega al menos una cuota con nombre y valor');
      return;
    }
    fetch(`/gastos/dividir/${currentGastoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuotas })
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

  // ===== Archivar y Borrar =====
  function archivarGasto(id) {
    if (!confirm('¿Archivar este gasto?')) return;
    fetch(`/gastos/archivar/${id}`, { method: 'PUT' })
      .then(res => res.json())
      .then(result => {
        if (result.success) location.reload();
        else alert('Error: ' + result.error);
      });
  }

  function borrarGasto(id) {
    if (!confirm('¿Borrar este gasto? Esta acción no se puede deshacer.')) return;
    fetch(`/gastos/borrar/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(result => {
        if (result.success) location.reload();
        else alert('Error: ' + result.error);
      });
  }

  // ===== Checkbox de cuotas (marcar pagado) =====
  document.querySelectorAll('.cuota-item input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', function() {
      const cuotaId = this.closest('.cuota-item').dataset.id;
      const pagado = this.checked;
      const fecha_pago = pagado ? new Date().toISOString().split('T')[0] : null;
      fetch(`/gastos/cuota/${cuotaId}/pago`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagado, fecha_pago })
      })
      .then(res => res.json())
      .then(result => {
        if (!result.success) {
          alert('Error al actualizar pago');
          this.checked = !pagado; // revertir
        } else {
          // Actualizar fecha_pago visual
          const spanFecha = this.closest('.cuota-item').querySelector('.fecha-pago');
          if (spanFecha) {
            spanFecha.textContent = fecha_pago ? new Date(fecha_pago).toLocaleDateString() : '';
          }
        }
      })
      .catch(err => alert('Error de red'));
    });
  });
});