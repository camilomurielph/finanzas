console.log('salario.js cargado');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM listo - salario');

  // ===== Elementos =====
  const modalIniciar = document.getElementById('modal-iniciar');
  const modalGasto = document.getElementById('modal-gasto');
  const modalAhorroOtro = document.getElementById('modal-ahorro-otro');

  const formIniciar = document.getElementById('form-iniciar');
  const formGasto = document.getElementById('form-gasto');
  const formAhorroOtro = document.getElementById('form-ahorro-otro');

  const btnIniciar = document.getElementById('btn-iniciar-simulacro');
  const btnReiniciar = document.getElementById('btn-reiniciar');
  const btnAgregarGasto = document.getElementById('btn-agregar-gasto');
  const btnAhorro1_10 = document.getElementById('btn-ahorro-1-10');
  const btnAhorro50_50 = document.getElementById('btn-ahorro-50-50');
  const btnAhorroOtro = document.getElementById('btn-ahorro-otro');

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
  // 1. INICIAR SIMULACRO
  // =============================================
  if (btnIniciar && modalIniciar) {
    btnIniciar.addEventListener('click', function(e) {
      e.preventDefault();
      if (formIniciar) formIniciar.reset();
      showModal(modalIniciar);
    });
  }

  if (formIniciar) {
    formIniciar.addEventListener('submit', function(e) {
      e.preventDefault();
      const salario = document.getElementById('salario-inicial').value;
      if (!salario || parseFloat(salario) <= 0) return alert('Ingresa un monto válido');

      fetch('/salario/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salario: parseFloat(salario) })
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

  // =============================================
  // 2. REINICIAR
  // =============================================
  if (btnReiniciar) {
    btnReiniciar.addEventListener('click', function(e) {
      e.preventDefault();
      if (!confirm('¿Reiniciar el simulacro? Se perderán todos los datos del simulacro actual.')) return;

      fetch('/salario/reiniciar', {
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

  // =============================================
  // 3. AGREGAR GASTO
  // =============================================
  if (btnAgregarGasto && modalGasto) {
    btnAgregarGasto.addEventListener('click', function(e) {
      e.preventDefault();
      if (formGasto) formGasto.reset();
      showModal(modalGasto);
    });
  }

  if (formGasto) {
    formGasto.addEventListener('submit', function(e) {
      e.preventDefault();
      const nombre = document.getElementById('nombre-gasto').value.trim();
      const valor = document.getElementById('valor-gasto').value;
      if (!nombre) return alert('Ingresa un nombre');
      if (!valor || parseFloat(valor) <= 0) return alert('Ingresa un monto válido');

      fetch('/salario/gasto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, valor: parseFloat(valor) })
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

  // =============================================
  // 4. ELIMINAR GASTO
  // =============================================
  document.querySelectorAll('.btn-eliminar-gasto').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const id = this.dataset.id;
      if (!confirm('¿Eliminar este gasto?')) return;

      fetch(`/salario/gasto/${id}`, {
        method: 'DELETE'
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
  });

  // =============================================
  // 5. AHORRO 1/10
  // =============================================
  if (btnAhorro1_10) {
    btnAhorro1_10.addEventListener('click', function(e) {
      e.preventDefault();
      if (!confirm('¿Ahorrar 1/10 del disponible?')) return;

      fetch('/salario/ahorrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: '1/10' })
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

  // =============================================
  // 6. AHORRO 50/50
  // =============================================
  if (btnAhorro50_50) {
    btnAhorro50_50.addEventListener('click', function(e) {
      e.preventDefault();
      if (!confirm('¿Ahorrar la mitad del disponible?')) return;

      fetch('/salario/ahorrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: '50/50' })
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

  // =============================================
  // 7. AHORRO (OTRO) - personalizado
  // =============================================
  if (btnAhorroOtro && modalAhorroOtro) {
    btnAhorroOtro.addEventListener('click', function(e) {
      e.preventDefault();
      if (formAhorroOtro) formAhorroOtro.reset();
      showModal(modalAhorroOtro);
    });
  }

  if (formAhorroOtro) {
    formAhorroOtro.addEventListener('submit', function(e) {
      e.preventDefault();
      const monto = document.getElementById('monto-ahorro-otro').value;
      if (!monto || parseFloat(monto) <= 0) return alert('Ingresa un monto válido');

      fetch('/salario/ahorrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'otro', monto: parseFloat(monto) })
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
});
