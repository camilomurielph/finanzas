console.log('bolsillos.js cargado');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM listo - bolsillos');

  // ===== Variables =====
  let bolsilloId = null;
  const bolsilloIdFromUrl = window.location.pathname.split('/').pop();

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
    console.log('Página principal de bolsillos');

    const grid = document.getElementById('bolsillos-grid');
    const btnAgregarBolsillo = document.getElementById('btn-agregar-bolsillo');
    const modalBolsillo = document.getElementById('modal-bolsillo');
    const formBolsillo = document.getElementById('form-bolsillo');
    const nombreBolsilloInput = document.getElementById('nombre-bolsillo');

    // Drag & Drop
    if (grid) {
      let draggedItem = null;

      grid.addEventListener('dragstart', function(e) {
        const card = e.target.closest('.bolsillo-card');
        if (card) {
          draggedItem = card;
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', card.dataset.id);
          card.style.opacity = '0.5';
        }
      });

      grid.addEventListener('dragend', function(e) {
        const card = e.target.closest('.bolsillo-card');
        if (card) card.style.opacity = '1';
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

        const cards = Array.from(grid.querySelectorAll('.bolsillo-card'));
        const dragIndex = cards.indexOf(draggedItem);
        const targetIndex = cards.indexOf(targetCard);

        if (dragIndex < targetIndex) {
          targetCard.parentNode.insertBefore(draggedItem, targetCard.nextSibling);
        } else {
          targetCard.parentNode.insertBefore(draggedItem, targetCard);
        }

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
            location.reload();
          }
        })
        .catch(err => alert('Error de red: ' + err.message));

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
  // 2. PÁGINA DETALLE (con sub-bolsillos)
  // =============================================

  if (window.location.pathname.includes('/bolsillos/') && bolsilloIdFromUrl && !isNaN(bolsilloIdFromUrl)) {
    console.log('Página detalle de bolsillo');
    bolsilloId = parseInt(bolsilloIdFromUrl);

    // Elementos comunes
    const btnEditar = document.getElementById('btn-editar-bolsillo');
    const modalEditar = document.getElementById('modal-editar-bolsillo');
    const formEditar = document.getElementById('form-editar-bolsillo');

    // === EDITAR NOMBRE DEL BOLSILLO ===
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

    // === VERIFICAR SI TIENE SUB-BOLSILLOS ===
    const tieneSub = document.querySelector('.sub-bolsillos-container') !== null;

    if (!tieneSub) {
      // === MODO SIN SUB-BOLSILLOS (funcionalidad original) ===
      console.log('Bolsillo sin categorías');

      const btnIngreso = document.getElementById('btn-ingreso');
      const btnEgreso = document.getElementById('btn-egreso');
      const btnDividir = document.getElementById('btn-dividir-bolsillo');

      const modalIngreso = document.getElementById('modal-ingreso');
      const modalEgreso = document.getElementById('modal-egreso');
      const modalDividir = document.getElementById('modal-dividir');

      const formIngreso = document.getElementById('form-ingreso');
      const formEgreso = document.getElementById('form-egreso');
      const formDividir = document.getElementById('form-dividir');

      // Añadir dinero
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

      // Retirar dinero
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

      // Dividir en categorías
      if (btnDividir && modalDividir) {
        btnDividir.addEventListener('click', function(e) {
          e.preventDefault();
          if (formDividir) formDividir.reset();
          showModal(modalDividir);
        });
      }

      if (formDividir) {
        formDividir.addEventListener('submit', function(e) {
          e.preventDefault();
          const nombre = document.getElementById('nombre-categoria').value.trim();
          if (!nombre) return alert('Ingresa un nombre');

          fetch(`/bolsillos/${bolsilloId}/sub`, {
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
    } else {
      // === MODO CON SUB-BOLSILLOS ===
      console.log('Bolsillo con categorías');

      const btnAgregarSub = document.getElementById('btn-agregar-sub');
      const modalAgregarSub = document.getElementById('modal-agregar-sub');
      const formAgregarSub = document.getElementById('form-agregar-sub');

      // Modales para sub-bolsillos
      const modalIngresoSub = document.getElementById('modal-ingreso-sub');
      const modalEgresoSub = document.getElementById('modal-egreso-sub');
      const modalEditarSub = document.getElementById('modal-editar-sub');

      const formIngresoSub = document.getElementById('form-ingreso-sub');
      const formEgresoSub = document.getElementById('form-egreso-sub');
      const formEditarSub = document.getElementById('form-editar-sub');

      // === Agregar sub-bolsillo ===
      if (btnAgregarSub && modalAgregarSub) {
        btnAgregarSub.addEventListener('click', function(e) {
          e.preventDefault();
          if (formAgregarSub) formAgregarSub.reset();
          showModal(modalAgregarSub);
        });
      }

      if (formAgregarSub) {
        formAgregarSub.addEventListener('submit', function(e) {
          e.preventDefault();
          const nombre = document.getElementById('nombre-sub').value.trim();
          if (!nombre) return alert('Ingresa un nombre');

          fetch(`/bolsillos/${bolsilloId}/sub`, {
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

      // === Eventos dinámicos para sub-bolsillos ===
      document.querySelectorAll('.btn-ingreso-sub').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          const subId = this.dataset.id;
          document.getElementById('sub-id-ingreso').value = subId;
          if (formIngresoSub) formIngresoSub.reset();
          showModal(modalIngresoSub);
        });
      });

      if (formIngresoSub) {
        formIngresoSub.addEventListener('submit', function(e) {
          e.preventDefault();
          const subId = document.getElementById('sub-id-ingreso').value;
          const monto = document.getElementById('monto-ingreso-sub').value;
          const descripcion = document.getElementById('desc-ingreso-sub').value.trim();
          if (!monto || parseFloat(monto) <= 0) return alert('Ingresa un monto válido');

          fetch(`/bolsillos/sub/${subId}/ingreso`, {
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

      document.querySelectorAll('.btn-egreso-sub').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          const subId = this.dataset.id;
          document.getElementById('sub-id-egreso').value = subId;
          if (formEgresoSub) formEgresoSub.reset();
          showModal(modalEgresoSub);
        });
      });

      if (formEgresoSub) {
        formEgresoSub.addEventListener('submit', function(e) {
          e.preventDefault();
          const subId = document.getElementById('sub-id-egreso').value;
          const monto = document.getElementById('monto-egreso-sub').value;
          const descripcion = document.getElementById('desc-egreso-sub').value.trim();
          if (!monto || parseFloat(monto) <= 0) return alert('Ingresa un monto válido');

          fetch(`/bolsillos/sub/${subId}/egreso`, {
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

      document.querySelectorAll('.btn-editar-sub').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          const subId = this.dataset.id;
          const subCard = this.closest('.sub-bolsillo-card');
          const nombreActual = subCard.querySelector('.sub-nombre').textContent;
          document.getElementById('sub-id-editar').value = subId;
          document.getElementById('nombre-sub-editar').value = nombreActual;
          showModal(modalEditarSub);
        });
      });

      if (formEditarSub) {
        formEditarSub.addEventListener('submit', function(e) {
          e.preventDefault();
          const subId = document.getElementById('sub-id-editar').value;
          const nombre = document.getElementById('nombre-sub-editar').value.trim();
          if (!nombre) return alert('Ingresa un nombre');

          fetch(`/bolsillos/sub/${subId}`, {
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

      document.querySelectorAll('.btn-eliminar-sub').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          const subId = this.dataset.id;
          const subCard = this.closest('.sub-bolsillo-card');
          const nombre = subCard.querySelector('.sub-nombre').textContent;
          if (!confirm(`¿Eliminar la categoría "${nombre}"? El saldo se transferirá al bolsillo principal.`)) return;

          fetch(`/bolsillos/sub/${subId}`, {
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
    }

    // =============================================
    // ===== ELIMINAR BOLSILLO (NUEVO) =====
    // =============================================
    const btnEliminar = document.getElementById('btn-eliminar-bolsillo');
    if (btnEliminar) {
      btnEliminar.addEventListener('click', function(e) {
        e.preventDefault();
        if (!confirm('¿Eliminar este bolsillo? Se perderán todos los datos asociados (movimientos, sub-bolsillos, etc.).')) return;

        fetch(`/bolsillos/${bolsilloId}`, {
          method: 'DELETE'
        })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            window.location.href = '/bolsillos';
          } else {
            alert('Error: ' + result.error);
          }
        })
        .catch(err => alert('Error de red: ' + err.message));
      });
    }
  }
});
