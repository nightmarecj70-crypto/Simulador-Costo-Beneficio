// Elementos DOM de interacción
const kmAnualesRange = document.getElementById('kmAnuales');
const kmAnualesNum = document.getElementById('kmAnualesNum');
const anosRange = document.getElementById('anos');
const anosVal = document.getElementById('anosVal');

const inputsDinámicos = ['precioEPower', 'precioGas', 'rendEPower', 'rendGas', 'precioCombustible'];

let chartFinanzas, chartAmbiente;

// Factor estequiométrico fijo: kg de CO2 generados por litro de gasolina consumido
const FACTOR_CO2_LITRO = 2.31; 

// Estructura de valores por defecto
const DEFAULTS = {
    kmAnuales: 15000,
    precioEPower: 510000,
    precioGas: 465000,
    rendEPower: 19.0,
    rendGas: 12.5,
    precioCombustible: 23.80,
    anos: 10
};

// Función para establecer el estado inicial de los datos
function setInitialValues(data) {
    kmAnualesRange.value = data.kmAnuales;
    kmAnualesNum.value = data.kmAnuales;
    anosRange.value = data.anos;
    anosVal.innerText = `${data.anos} años`;
    
    document.getElementById('precioEPower').value = data.precioEPower;
    document.getElementById('precioGas').value = data.precioGas;
    document.getElementById('rendEPower').value = data.rendEPower;
    document.getElementById('rendGas').value = data.rendGas;
    document.getElementById('precioCombustible').value = data.precioCombustible;
}

// Restablecer el panel a su configuración de fábrica
function resetDefaults() {
    setInitialValues(DEFAULTS);
    calcularYActualizar();
}

// Sincronización del deslizador y el campo numérico (Kilómetros)
kmAnualesRange.addEventListener('input', (e) => {
    kmAnualesNum.value = e.target.value;
    calcularYActualizar();
});

kmAnualesNum.addEventListener('input', (e) => {
    let val = parseInt(e.target.value) || 0;
    if(val > 40000) val = 40000;
    kmAnualesRange.value = val;
    calcularYActualizar();
});

// Listener para el rango de años
anosRange.addEventListener('input', (e) => {
    anosVal.innerText = `${e.target.value} años`;
    calcularYActualizar();
});

// Añadir disparadores a los inputs numéricos directos
inputsDinámicos.forEach(id => {
    document.getElementById(id).addEventListener('input', calcularYActualizar);
});

// Motor de cálculo principal (Químico y Financiero)
function calcularYActualizar() {
    const km = parseFloat(kmAnualesNum.value) || 0;
    const anos = parseInt(anosRange.value) || 10;
    const pEPower = parseFloat(document.getElementById('precioEPower').value) || 0;
    const pGas = parseFloat(document.getElementById('precioGas').value) || 0;
    const rEPower = parseFloat(document.getElementById('rendEPower').value) || 1;
    const rGas = parseFloat(document.getElementById('rendGas').value) || 1;
    const pLitro = parseFloat(document.getElementById('precioCombustible').value) || 0;

    // Fórmulas financieras base
    const diffInicial = pEPower - pGas;
    const litrosAnualesEPower = km / rEPower;
    const litrosAnualesGas = km / rGas;

    const costoGasolinaAnualEPower = litrosAnualesEPower * pLitro;
    const costoGasolinaAnualGas = litrosAnualesGas * pLitro;
    const ahorroAnualDinero = costoGasolinaAnualGas - costoGasolinaAnualEPower;

    const tiempoRetornoAnos = ahorroAnualDinero > 0 ? (diffInicial / ahorroAnualDinero) : Infinity;

    // Fórmulas de impacto ambiental estequiométrico
    const co2AnualEPower = litrosAnualesEPower * FACTOR_CO2_LITRO;
    const co2AnualGas = litrosAnualesGas * FACTOR_CO2_LITRO;
    const ahorroAnualCO2Kg = co2AnualGas - co2AnualEPower;
    const ahorroTotalCO2Ton = (ahorroAnualCO2Kg * anos) / 1000;
    const arbolesEquivalentes = (ahorroAnualCO2Kg / 20); 

    // Actualizar paneles visuales superiores (KPIs)
    document.getElementById('diffPrecio').innerText = `$${diffInicial.toLocaleString('es-MX', {maximumFractionDigits:0})}`;
    document.getElementById('ahorroAnualEcon').innerText = `$${ahorroAnualDinero.toLocaleString('es-MX', {maximumFractionDigits:0})}`;
    
    const txtRetorno = document.getElementById('tiempoRetorno');
    if(tiempoRetornoAnos === Infinity || tiempoRetornoAnos < 0) {
        txtRetorno.innerText = "No recuperable";
        txtRetorno.className = "text-xl font-extrabold text-rose-400";
    } else {
        txtRetorno.innerText = `${tiempoRetornoAnos.toFixed(1)} años`;
        txtRetorno.className = "text-xl font-extrabold text-emerald-400";
    }

    document.getElementById('ahorroAnualCO2').innerText = `${ahorroAnualCO2Kg.toLocaleString('es-MX', {maximumFractionDigits:1})} kg`;
    document.getElementById('ahorroTotalCO2').innerText = `${ahorroTotalCO2Ton.toFixed(1)} Toneladas`;
    document.getElementById('arbolesEquiv').innerText = Math.round(arbolesEquivalentes * anos).toLocaleString('es-MX');

    // Bucles para cálculo de matriz y gráficas (proyecciones futuras fijas en base a 10 años mínimo)
    let labelsAnos = [];
    let datosAcumuladosEPower = [];
    let datosAcumuladosGas = [];
    let tablaHtml = "";

    for (let i = 1; i <= Math.max(anos, 10); i++) {
        labelsAnos.push(`Año ${i}`);
        
        let costoInversionEPower = pEPower + (costoGasolinaAnualEPower * i);
        let costoInversionGas = pGas + (costoGasolinaAnualGas * i);
        let balanceFinanciero = costoInversionGas - costoInversionEPower;
        let co2AhorradoAcum = ahorroAnualCO2Kg * i;

        datosAcumuladosEPower.push(costoInversionEPower);
        datosAcumuladosGas.push(costoInversionGas);

        if(i <= anos) {
            let colorBalance = balanceFinanciero >= 0 ? "text-emerald-400" : "text-rose-400";
            let sign = balanceFinanciero >= 0 ? "Ahorro: +$" : "Déficit: -$";
            
            tablaHtml += `
                <tr class="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                    <td class="py-2.5 px-4 font-bold text-slate-300">${i}</td>
                    <td class="py-2.5 px-4 text-slate-400">$${costoInversionEPower.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td class="py-2.5 px-4 text-slate-400">$${costoInversionGas.toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td class="py-2.5 px-4 font-semibold ${colorBalance}">${sign}${Math.abs(balanceFinanciero).toLocaleString('es-MX', {maximumFractionDigits:0})}</td>
                    <td class="py-2.5 px-4 text-teal-400 font-bold">${co2AhorradoAcum.toLocaleString('es-MX', {maximumFractionDigits:0})} kg</td>
                </tr>
            `;
        }
    }
    document.getElementById('tablaProyeccion').innerHTML = tablaHtml;

    // Invocar actualización de gráficos
    renderCharts(labelsAnos, datosAcumuladosEPower, datosAcumuladosGas, co2AnualGas, co2AnualEPower);
}

// Renderización reactiva de las librerías de Chart.js
function renderCharts(labels, dataEPower, dataGas, co2Gas, co2EPower) {
    if (chartFinanzas) chartFinanzas.destroy();
    if (chartAmbiente) chartAmbiente.destroy();

    const ctxFin = document.getElementById('chartFinanciero').getContext('2d');
    chartFinanzas = new Chart(ctxFin, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Costo Total Acumulado Kicks e-POWER',
                    data: dataEPower,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2.5,
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Costo Total Acumulado Kicks Gasolina',
                    data: dataGas,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderWidth: 2.5,
                    borderDash: [5, 5],
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } },
            scales: {
                x: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#64748b' } },
                y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#64748b' } }
            }
        }
    });

    const ctxAmb = document.getElementById('chartAmbiental').getContext('2d');
    chartAmbiente = new Chart(ctxAmb, {
        type: 'bar',
        data: {
            labels: ['Gasolina Convencional', 'e-POWER Tecnológico'],
            datasets: [{
                label: 'Emisiones Mensuales de CO₂ (kg)',
                data: [(co2Gas / 12), (co2EPower / 12)],
                backgroundColor: ['rgba(239, 68, 68, 0.65)', 'rgba(16, 185, 129, 0.65)'],
                borderColor: ['#ef4444', '#10b981'],
                borderWidth: 1.5,
                borderRadius: 6
            }]
                },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#64748b' } },
                y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#64748b' } }
            }
        }
    });
}

// Carga inicial al inicializar ventana
document.addEventListener('DOMContentLoaded', () => {
    setInitialValues(DEFAULTS);
    calcularYActualizar();
});
