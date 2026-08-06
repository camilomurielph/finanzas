console.log('bolsillos.js cargado');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM listo');

  // ===== Variables =====
  let bolsilloId = null;
  const bolsilloIdFromUrl = window.location.pathname.split('/').pop();

  // ===== Elementos comunes =====
  const modalBolsillo = document.getElementById('modal-bolsillo');
  const formBolsillo = document.getElementById('form-bolsillo');
  const nombreBolsilloInput = document.getElementById('nombre-bolsillo');
  const btnAgregarBolsillo = document.getElementById('btn-agregar-bolsillo');

  // ===== Funciones auxiliares de modales =====
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

  // Cerrar modales al hacer clic en 'X' o fuera
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

  if (window.location.pathname === '/bolsillos' || window.location.pathname === '/bolsillos/') {
    // Drag & Drop
    let draggedItem = null;
    const grid = document.getElementById('bolsillos-grid');

    if (grid) {
      grid.addEventListener('dragstart', function(e) {
        const card = e.target.closest('.bolsillo-card');
        if (card) {
          draggedItem = card;
          e.dataTransfer.effectAllowed = 'move';
          // Guardar el ID
          e.dataTransfer.setData('text/plain', card.dataset.id);
          card.style.opacity = '0.5';
        }
      });

      grid.addEventListener('dragend', function(e) {
        const card = e.target.closest('.bolsillo-card');
        if (card) card.style.opacity = '1';
        // Eliminar clases de arrastre
        document.querySelectorAll('.bolsillo-card.drag-over').forEach(el => el.classList.remove('drag-over'));
      });

      grid.addEventListener('dragover', function(e) {
        e.preventDefault();
        const card = e.target.closest('.bolsillo-card');
        if (card && card !== draggedItem) {
          card.classList.add('drag-over');
        }
      });

      grid.addEventListener('dragleave', function(e) {
        const card = e.target.closest('.bolsillo-card');
        if (card) card.classList.remove('drag-over');
      });

      grid.addEventListener('drop', function(e) {
        e.preventDefault();
        const targetCard = e.target.closest('.bolsillo-card');
        if (!targetCard || !draggedItem || targetCard === draggedItem) return;

        const dragId = draggedItem.dataset.id;
        const targetId = targetCard.dataset.id;

        // Obtener todos los cards en orden actual
        const cards = Array.from(grid.querySelectorAll('.bolsillo-card'));
        const dragIndex = cards.indexOf(draggedItem);
        const targetIndex = cards.indexOf(targetCard);

        if (dragIndex < targetIndex) {
          targetCard.parentNode.insertBefore(draggedItem, targetCard.nextSibling);
        } else {
          targetCard.parentNode.insertBefore(draggedItem, targetCard);
        }

        // Actualizar órdenes en la base de datos
        const ordenes = Array.from(grid.querySelectorAll('.bolsillo-card')).map((card, index) => ({
          id: parseInt(card.dataset.id),
          orden: index + 1
        }));

        fetch('/bolsillos/orden', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordenes })
        })
        .then(res => res.json())
        .then(result => {
          if (!result.success) {
            alert('Error al guardar el orden: ' + result.error);
            location.reload(); // Recargar para restaurar orden
          }
        })
        .catch(err => alert('Error de red: ' + err.message));

        // Limpiar estilos
        document.querySelectorAll('.bolsillo-card.drag-over').forEach(el => el.classList.remove('drag-over'));
        draggedItem.style.opacity = '1';
        draggedItem = null;
      });
    }

    // Agregar bolsillo
    if (btnAgregarBolsillo) {
      btnAgregarBolsillo.addEventListener('click', function(e) {
        e.preventDefault();
        if (formBolsillo) formBolsillo.reset();
        showModal(modalBolsillo);
      });
    }

    if (formBolsillo) {
      formBolsillo.addEventListener('submit', function(e) {
        e.preventDefault();
        const nombre = nombreBolsilloInput ? nombreBolsilloInput.value.trim() : '';
        if (!nombre) return alert('Ingresa un nombre');

        fetch('/bolsillos', {
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
        .catch(err => alert('Error de red: ' + err.message));
      });
    }
  }

  // =============================================
  // 2. PÁGINA DETALLE (detalle)
  // =============================================

  if (window.location.pathname.includes('/bolsillos/') && bolsilloIdFromUrl && !isNaN(bolsilloIdFromUrl)) {
    bolsilloId = parseInt(bolsilloIdFromUrl);

    const btnIngreso = document.getElementById('btn-ingreso');
    const btnEgreso = document.getElementById('btn-egreso');
    const btnEditar = document.getElementById('btn-editar-bolsillo');

    const modalIngreso = document.getElementById('modal-ingreso');
    const modalEgreso = document.getElementById('modal-egreso');
    const modalEditar = document.getElementById('modal-editar-bolsillo');

    const formIngreso = document.getElementById('form-ingreso');
    const formEgreso = document.getElementById('form-egreso');
    const formEditar = document.getElementById('form-editar-bolsillo');

    // === Añadir dinero ===
    if (btnIngreso && modalIngreso) {
      btnIngreso.addEventListener('click', function(e) {
        e.preventDefault();
        if (formIngreso) formIngreso.reset();
        showModal(modalIngreso);
      });
    }

    if (formIngreso) {
      formIngreso.addEventListener('submit', function(e) {
        e.preventDefault();
        const monto = document.getElementById('monto-ingreso').value;
        const descripcion = document.getElementById('desc-ingreso').value.trim();
        if (!monto || parseFloat(monto) <= 0) return alert('Ingresa un monto válido');

        fetch(`/bolsillos/${bolsilloId}/ingreso`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto: parseFloat(monto), descripcion })
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

    // === Retirar dinero ===
    if (btnEgreso && modalEgreso) {
      btnEgreso.addEventListener('click', function(e) {
        e.preventDefault();
        if (formEgreso) formEgreso.reset();
        showModal(modalEgreso);
      });
    }

    if (formEgreso) {
      formEgreso.addEventListener('submit', function(e) {
        e.preventDefault();
        const monto = document.getElementById('monto-egreso').value;
        const descripcion = document.getElementById('desc-egreso').value.trim();
        if (!monto || parseFloat(monto) <= 0) return alert('Ingresa un monto válido');

        fetch(`/bolsillos/${bolsilloId}/egreso`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto: parseFloat(monto), descripcion })
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

    // === Editar nombre ===
    if (btnEditar && modalEditar) {
      btnEditar.addEventListener('click', function(e) {
        e.preventDefault();
        const nombreActual = document.querySelector('.detalle-header h2')?.textContent || '';
        document.getElementById('nombre-editar').value = nombreActual;
        showModal(modalEditar);
      });
    }

    if (formEditar) {
      formEditar.addEventListener('submit', function(e) {
        e.preventDefault();
        const nombre = document.getElementById('nombre-editar').value.trim();
        if (!nombre) return alert('Ingresa un nombre');

        fetch(`/bolsillos/${bolsilloId}`, {
          method: 'PUT',
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
        .catch(err => alert('Error de red: ' + err.message));
      });
    }
  }
});
