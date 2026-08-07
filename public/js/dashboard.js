console.log('dashboard.js cargado');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM listo - dashboard');

  // =============================================
  // ===== GRÁFICO DE GASTOS POR CATEGORÍA =====
  // =============================================
  const gastosCtx = document.getElementById('gastosChart');
  if (gastosCtx) {
    // Obtener datos del backend desde el HTML (los pasamos como JSON)
    const gastosData = JSON.parse(document.getElementById('gastos-data')?.textContent || '[]');
    
    if (gastosData && gastosData.length > 0) {
      const labels = gastosData.map(item => item.categoria);
      const values = gastosData.map(item => item.total);
      const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
      ];

      new Chart(gastosCtx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: '#1a1a1a',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#e0e0e0',
                padding: 10,
                font: { size: 11 }
              }
            }
          },
          cutout: '65%'
        }
      });
    } else {
      gastosCtx.parentElement.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No hay datos de gastos para mostrar</p>';
    }
  }

  // =============================================
  // ===== GRÁFICO DE DISTRIBUCIÓN DE BOLSILLOS =====
  // =============================================
  const bolsillosCtx = document.getElementById('bolsillosChart');
  if (bolsillosCtx) {
    const bolsillosData = JSON.parse(document.getElementById('bolsillos-data')?.textContent || '[]');
    
    if (bolsillosData && bolsillosData.length > 0) {
      const labels = bolsillosData.map(item => item.nombre);
      const values = bolsillosData.map(item => item.saldo);
      const colors = [
        '#36A2EB', '#4BC0C0', '#FFCE56', '#FF6384', '#9966FF', '#FF9F40'
      ];

      new Chart(bolsillosCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Saldo',
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#888',
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              },
              grid: {
                color: '#2a2a2a'
              }
            },
            x: {
              ticks: {
                color: '#888'
              },
              grid: {
                display: false
              }
            }
          }
        }
      });
    } else {
      bolsillosCtx.parentElement.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No hay bolsillos creados</p>';
    }
  }
});
