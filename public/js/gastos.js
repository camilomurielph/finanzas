document.addEventListener('DOMContentLoaded', function() {
  // ===== DETECTAR SI ESTAMOS EN LA PÁGINA DE GASTOS =====
  const path = window.location.pathname;
  const isGastosPage = path === '/gastos' || path === '/gastos/' || path.includes('/gastos/detalle/');

  if (!isGastosPage) {
    console.log('gastos.js: No estamos en la página de gastos, saliendo.');
    return; // Salir si no estamos en gastos
  }

  console.log('gastos.js: Inicializando en página de gastos');

  // ===== Variables globales =====
  let currentGastoId = null;
  let editing = false;

  // ===== Elementos (con comprobación de existencia) =====
  const modalGasto = document.getElementById('modal-gasto');
  const modalCuentas = document.getElementById('modal-cuentas');
  const modalDividir = document.getElementById('modal-dividir');

  const formGasto = document.getElementById('form-gasto');
  const gastoIdInput = document.getElementById('gasto-id');
  const modalGastoTitle = document.getElementById('modal-gasto-title');

  const btnAgregarGasto = document.getElementById('btn-agregar-gasto');
  const btnGestionCuentas = document.getElementById('btn-gestion-cuentas');
  const btnAgregarCuota = document.getElementById('btn-agregar-cuota');
  const btnGuardarCuotas = document.getElementById('btn-guardar-cuotas');
  const cuotasContainer = document.getElementById('cuotas-container');
  
  const cuentasList = document.getElementById('cuentas-list');
  const formNuevaCuenta = document.getElementById('form-nueva-cuenta');
  const nuevaCuentaNombre = document.getElementById('nueva-cuenta-nombre');

  // ===== Funciones auxiliares =====
  function showModal(modal) {
    if (modal) {
      modal.classList.add('visible');
      modal.style.display = 'flex';
    }
  }
  function hideModal(modal) {
    if (modal) {
      modal.classList.remove('visible');
      modal.style.display = 'none';
    }
  }
  function closeAllModals() {
    [modalGasto, modalCuentas, modalDividir].forEach(hideModal);
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

  // ===== MENÚ DESPLEGABLE DE OPCIONES (3 puntos) =====
  function cerrarTodosMenus() {
    document.querySelectorAll('.gasto-actions.open').forEach(container => {
      container.classList.remove('open');
    });
  }

  // Asignar eventos a los 3 puntos (SIEMPRE que existan)
  document.querySelectorAll('.menu-tres-puntos').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      console.log('Click en 3 puntos, ID:', this.dataset.id);
      const gastoId = this.dataset.id;
      const actionsContainer = document.getElementById(`acciones-${gastoId}`);
      if (actionsContainer) {
        // Cerrar otros menús abiertos
        document.querySelectorAll('.gasto-actions.open').forEach(container => {
          if (container.id !== `acciones-${gastoId}`) {
            container.classList.remove('open');
          }
        });
        // Toggle del actual
        actionsContainer.classList.toggle('open');
        console.log('Menú toggled:', actionsContainer.classList.contains('open'));
      } else {
        console.warn('No se encontró contenedor de acciones para ID:', gastoId);
      }
    });
  });

  // Cerrar menús al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.gasto-item')) {
      cerrarTodosMenus();
    }
  });

  // Acciones de los botones dentro del menú
  document.querySelectorAll('.gasto-actions .action-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const action = this.dataset.action;
      const id = this.dataset.id;
      const archivado = this.dataset.archivado === '1';

      // Cerrar el menú
      const actionsContainer = this.closest('.gasto-actions');
      if (actionsContainer) actionsContainer.classList.remove('open');

      switch (action) {
        case 'editar':
          editarGasto(id);
          break;
        case 'dividir':
          abrirDividir(id);
          break;
        case 'archivar':
          if (archivado) {
            desarchivarGasto(id);
          } else {
            archivarGasto(id);
          }
          break;
        case 'borrar':
          borrarGasto(id);
          break;
      }
    });
  });

  // =============================================
  // El resto del código solo se ejecuta si estamos en el listado (no en detalle)
  // =============================================

  const isDetalle = path.includes('/gastos/detalle/');

  if (!isDetalle) {
    console.log('gastos.js: Configurando eventos del listado');

    // ===== Agregar / Editar gasto =====
    if (btnAgregarGasto) {
      btnAgregarGasto.addEventListener('click', function() {
        editing = false;
        gastoIdInput.value = '';
        modalGastoTitle.textContent = 'Agregar gasto';
        formGasto.reset();
        showModal(modalGasto);
      });
    }

    if (formGasto) {
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
    }

    // ===== GESTIÓN DE CUENTAS =====
    if (btnGestionCuentas) {
      btnGestionCuentas.addEventListener('click', function() {
        cargarCuentas();
        showModal(modalCuentas);
      });
    }

    if (formNuevaCuenta) {
      formNuevaCuenta.addEventListener('submit', function(e) {
        e.preventDefault();
        const nombre = nuevaCuentaNombre.value.trim();
        if (!nombre) return alert('Ingresa un nombre');
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
        });
      });
    }

    // ===== Filtro por cuenta =====
    document.querySelectorAll('.cuenta-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const cuenta = this.dataset.cuenta;
        const url = cuenta ? `/gastos?cuenta=${cuenta}` : '/gastos';
        window.location.href = url;
      });
    });

    // ===== Toggle de archivados =====
    const archivadosToggle = document.getElementById('archivados-toggle');
    const archivadosContent = document.getElementById('archivados-content');
    if (archivadosToggle) {
      archivadosToggle.addEventListener('click', function() {
        const isOpen = this.classList.toggle('open');
        archivadosContent.style.display = isOpen ? 'block' : 'none';
      });
    }

    // ===== Cerrar menús al cambiar de cuenta =====
    document.querySelectorAll('.cuenta-btn').forEach(btn => {
      btn.addEventListener('click', cerrarTodosMenus);
    });
  }

  // =============================================
  // Funciones compartidas (editar, dividir, etc.)
  // =============================================

  function cargarCuentas() {
    if (!cuentasList) return;
    fetch('/gastos/api/cuentas')
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar cuentas');
        return res.json();
      })
      .then(cuentas => {
        cuentasList.innerHTML = '';
        if (!cuentas || cuentas.length === 0) {
          cuentasList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px 0;">No hay cuentas creadas.</p>';
          return;
        }
        cuentas.forEach(c => {
          const div = document.createElement('div');
          div.className = 'cuenta-item-modal';
          div.innerHTML = `
            <span class="cuenta-nombre">${c.nombre}</span>
            <div class="cuenta-actions">
              <button class="btn-edit-cuenta" data-id="${c.id}" title="Editar nombre">✏️</button>
              <button class="btn-delete-cuenta" data-id="${c.id}" title="Eliminar cuenta">🗑️</button>
            </div>
          `;
          cuentasList.appendChild(div);
        });
        // Eventos para editar y borrar
        document.querySelectorAll('.btn-edit-cuenta').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            const nombreActual = this.closest('.cuenta-item-modal').querySelector('.cuenta-nombre').textContent;
            const nuevoNombre = prompt('Editar nombre de la cuenta:', nombreActual);
            if (nuevoNombre && nuevoNombre.trim() !== '') {
              fetch(`/gastos/tipos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nuevoNombre.trim() })
              })
              .then(res => res.json())
              .then(result => {
                if (result.success) {
                  location.reload();
                } else {
                  alert('Error: ' + result.error);
                }
              });
            }
          });
        });
        document.querySelectorAll('.btn-delete-cuenta').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            if (confirm('¿Eliminar esta cuenta? Se perderán todos los gastos asociados.')) {
              fetch(`/gastos/tipos/${id}`, {
                method: 'DELETE'
              })
              .then(res => res.json())
              .then(result => {
                if (result.success) {
                  location.reload();
                } else {
                  alert('Error: ' + result.error);
                }
              });
            }
          });
        });
      })
      .catch(err => {
        alert('Error al cargar cuentas: ' + err.message);
      });
  }

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

  if (btnAgregarCuota) {
    btnAgregarCuota.addEventListener('click', function() {
      agregarFilaCuota();
    });
  }

  if (btnGuardarCuotas) {
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
  }

  // ===== Archivar, Desarchivar y Borrar =====
  function archivarGasto(id) {
    if (!confirm('¿Archivar este gasto?')) return;
    fetch(`/gastos/archivar/${id}`, { method: 'PUT' })
      .then(res => res.json())
      .then(result => {
        if (result.success) location.reload();
        else alert('Error: ' + result.error);
      });
  }

  function desarchivarGasto(id) {
    if (!confirm('¿Restaurar este gasto? Dejará de estar archivado.')) return;
    fetch(`/gastos/desarchivar/${id}`, { method: 'PUT' })
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

  // ===== Checkbox de gasto =====
  document.querySelectorAll('.gasto-pagado').forEach(cb => {
    cb.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    cb.addEventListener('change', function(e) {
      e.stopPropagation();
      const gastoId = this.dataset.id;
      const pagado = this.checked;
      fetch(`/gastos/gasto/${gastoId}/pago`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagado })
      })
      .then(res => res.json())
      .then(result => {
        if (!result.success) {
          alert('Error: ' + result.error);
          this.checked = !pagado;
        }
      })
      .catch(err => {
        alert('Error al actualizar pago: ' + err.message);
        this.checked = !pagado;
      });
    });
  });

  // ===== Checkbox de cuotas =====
  document.querySelectorAll('.cuota-pagado').forEach(cb => {
    cb.addEventListener('change', function(e) {
      e.stopPropagation();
      const cuotaId = this.dataset.id;
      const pagado = this.checked;
      const fecha_pago = pagado ? new Date().toISOString().split('T')[0] : null;
      const cuotaItem = this.closest('.cuota-item');
      fetch(`/gastos/cuota/${cuotaId}/pago`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagado, fecha_pago })
      })
      .then(res => res.json())
      .then(result => {
        if (!result.success) {
          alert('Error al actualizar pago');
          this.checked = !pagado;
        } else {
          const fechaSpan = cuotaItem.querySelector('.fecha-pago');
          if (pagado) {
            if (!fechaSpan || fechaSpan.tagName !== 'INPUT') {
              const input = document.createElement('input');
              input.type = 'date';
              input.className = 'fecha-pago-input';
              input.value = fecha_pago;
              input.dataset.id = cuotaId;
              const old = cuotaItem.querySelector('.fecha-pago');
              if (old) old.replaceWith(input);
              else cuotaItem.appendChild(input);
              input.addEventListener('change', function(e) {
                e.stopPropagation();
                actualizarFechaCuota(cuotaId, this.value);
              });
            } else if (fechaSpan.tagName === 'INPUT') {
              fechaSpan.value = fecha_pago;
            }
          } else {
            const input = cuotaItem.querySelector('.fecha-pago-input');
            if (input) {
              const span = document.createElement('span');
              span.className = 'fecha-pago';
              input.replaceWith(span);
            }
          }
        }
      })
      .catch(err => alert('Error de red'));
    });
  });

  function actualizarFechaCuota(cuotaId, fecha) {
    if (!fecha) return;
    const cb = document.querySelector(`.cuota-pagado[data-id="${cuotaId}"]`);
    if (!cb || !cb.checked) return;
    fetch(`/gastos/cuota/${cuotaId}/pago`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagado: true, fecha_pago: fecha })
    })
    .then(res => res.json())
    .then(result => {
      if (!result.success) {
        alert('Error al actualizar fecha');
      }
    })
    .catch(err => alert('Error de red'));
  }

  document.querySelectorAll('.fecha-pago-input').forEach(input => {
    input.addEventListener('change', function(e) {
      e.stopPropagation();
      const cuotaId = this.dataset.id;
      actualizarFechaCuota(cuotaId, this.value);
    });
  });
});
