const CHART_COLORS = ['#1a73e8','#34a853','#fbbc04','#ea4335','#9c27b0','#00bcd4','#ff9800'];

function buildChart(id, type, labels, data, label) {
  const ctx = document.getElementById(id).getContext('2d');
  new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: CHART_COLORS.slice(0, labels.length),
        borderColor: type === 'line' ? '#1a73e8' : undefined,
        borderWidth: type === 'line' ? 2 : 0,
        fill: type === 'line' ? false : undefined,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

async function loadStatistik() {
  try {
    const s = await apiFetch('/statistics');

    document.getElementById('stat-total-pickups').textContent = s.afhentningerTotal;
    document.getElementById('stat-total-bags').textContent = s.poserTotal;
    document.getElementById('stat-total-cost').textContent = (s.omkostningerTotal ?? 0).toFixed(2) + ' kr.';

    buildChart('chart-pickups', 'bar',
      s.afhentningerPerMaaned.map(x => x.label),
      s.afhentningerPerMaaned.map(x => x.value),
      'Afhentninger');

    buildChart('chart-bags', 'bar',
      s.poserPerRestaurant.map(x => x.label),
      s.poserPerRestaurant.map(x => x.value),
      'Poser');

    buildChart('chart-costs', 'line',
      s.omkostningerPerMaaned.map(x => x.label),
      s.omkostningerPerMaaned.map(x => x.value),
      'Kr.');

    buildChart('chart-chauffeurs', 'bar',
      s.chauffeurAktivitet.map(x => x.label),
      s.chauffeurAktivitet.map(x => x.value),
      'Afhentninger');

  } catch (err) {
    toast('Kunne ikke hente statistik', 'error');
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', loadStatistik);