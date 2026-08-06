console.log('deudas.js cargado');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM listo - deudas');

  // ===== Elementos comunes =====
  const modalDeuda = document.getElementById('modal-deuda');
  const formDeuda = document.getElementById('form-deuda');

  const btnAgregarDeuda = document.getElementById('btn-agregar-deuda');

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

  // Cerrar modales
  document.querySelectorAll('.modal .close').forEach(el => {
    el.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) hideModal(modal);
    });
  });
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) hideModal(this);
    });
  });

  // =============================================
  // 1. PÁGINA PRINCIPAL (Index)
  // =============================================

  if (window.location.pathname === '/deudas' || window.location.pathname === '/deudas/') {
    console.log('Página principal de deudas');

    // Agregar deuda
    if (btnAgregarDeuda && modalDeuda) {
      btnAgregarDeuda.addEventListener('click', function(e) {
        e.preventDefault();
        if (formDeuda) formDeuda.reset();
        showModal(modalDeuda);
      });
    }

    if (formDeuda) {
      formDeuda.addEventListener('submit', function(e) {
        e.preventDefault();
        const nombre = document.getElementById('nombre-deuda').value.trim();
        const valor_total = document.getElementById('valor-total').value;
        const cuota_minima = document.getElementById('cuota-minima').value;
        const numero_cuotas = document.getElementById('numero-cuotas').value;
        const dia_pago = document.getElementById('dia-pago').value;

        if (!nombre || !valor_total || !cuota_minima || !numero_cuotas || !dia_pago) {
          return alert('Todos los campos son obligatorios');
        }
        if (parseInt(dia_pago) < 1 || parseInt(dia_pago) > 31) {
          return alert('El día de pago debe ser entre 1 y 31');
        }

        fetch('/deudas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre,
            valor_total: parseFloat(valor_total),
            cuota_minima: parseFloat(cuota_minima),
            numero_cuotas: parseInt(numero_cuotas),
            dia_pago: parseInt(dia_pago)
          })
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

    // Eliminar deuda (desde el index)
    document.querySelectorAll('.btn-eliminar-deuda').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const id = this.dataset.id;
        if (!confirm('¿Eliminar esta deuda y todos sus pagos?')) return;

        fetch(`/deudas/${id}`, { method: 'DELETE' })
          .then(res => res.json())
          .then(result => {
            if (result.success) location.reload();
            else alert('Error: ' + result.error);
          })
          .catch(err => alert('Error de red: ' + err.message));
      });
    });

    // Desarchivar deuda
    document.querySelectorAll('.btn-desarchivar').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const id = this.dataset.id;
        if (!confirm('¿Restaurar esta deuda?')) return;

        fetch(`/deudas/${id}/desarchivar`, { method: 'PUT' })
          .then(res => res.json())
          .then(result => {
            if (result.success) location.reload();
            else alert('Error: ' + result.error);
          })
          .catch(err => alert('Error de red: ' + err.message));
      });
    });

    // Toggle archivados
    const toggleArchivados = document.getElementById('archivados-toggle-deudas');
    const contentArchivados = document.getElementById('archivados-content-deudas');
    if (toggleArchivados && contentArchivados) {
      toggleArchivados.addEventListener('click', function() {
        const isOpen = this.classList.toggle('open');
        contentArchivados.style.display = isOpen ? 'block' : 'none';
      });
    }
  }

  // =============================================
  // 2. PÁGINA DETALLE
  // =============================================

  if (window.location.pathname.includes('/deudas/') && !window.location.pathname.includes('/deudas/')) {
    console.log('Página detalle de deuda');

    const btnPagoMinimo = document.getElementById('btn-pago-minimo');
    const btnAbono = document.getElementById('btn-abono');
    const btnArchivar = document.getElementById('btn-archivar');
    const modalAbono = document.getElementById('modal-abono');
    const formAbono = document.getElementById('form-abono');

    // Obtener ID de la deuda desde la URL
    const deudaId = window.location.pathname.split('/').pop();

    // Pago mínimo
    if (btnPagoMinimo) {
      btnPagoMinimo.addEventListener('click', function(e) {
        e.preventDefault();
        if (!confirm('¿Registrar pago mínimo?')) return;

        fetch(`/deudas/${deudaId}/pago-minimo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
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

    // Abono
    if (btnAbono && modalAbono) {
      btnAbono.addEventListener('click', function(e) {
        e.preventDefault();
        if (formAbono) formAbono.reset();
        showModal(modalAbono);
      });
    }

    if (formAbono) {
      formAbono.addEventListener('submit', function(e) {
        e.preventDefault();
        const monto = document.getElementById('monto-abono').value;
        if (!monto || parseFloat(monto) <= 0) return alert('Ingresa un monto válido');

        fetch(`/deudas/${deudaId}/abono`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto: parseFloat(monto) })
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

    // Archivar deuda
    if (btnArchivar) {
      btnArchivar.addEventListener('click', function(e) {
        e.preventDefault();
        if (!confirm('¿Archivar esta deuda? Se moverá a la sección de archivadas.')) return;

        fetch(`/deudas/${deudaId}/archivar`, { method: 'PUT' })
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

    // Eliminar deuda (desde detalle)
    document.querySelectorAll('.btn-eliminar-deuda').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const id = this.dataset.id;
        if (!confirm('¿Eliminar esta deuda y todos sus pagos?')) return;

        fetch(`/deudas/${id}`, { method: 'DELETE' })
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              window.location.href = '/deudas';
            } else {
              alert('Error: ' + result.error);
            }
          })
          .catch(err => alert('Error de red: ' + err.message));
      });
    });

    // Eliminar pago
    document.querySelectorAll('.btn-eliminar-pago').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const id = this.dataset.id;
        if (!confirm('¿Eliminar este pago? Se restaurará el saldo a la deuda.')) return;

        fetch(`/deudas/pago/${id}`, { method: 'DELETE' })
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
    });
  }
});
