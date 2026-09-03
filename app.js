const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const diasLaborales = [
  { js: 1, nombre: "Lunes" },
  { js: 2, nombre: "Martes" },
  { js: 3, nombre: "Miércoles" },
  { js: 4, nombre: "Jueves" },
  { js: 5, nombre: "Viernes" }
];

const listaPersonas = document.getElementById("listaPersonas");
const selectorMeses = document.getElementById("selectorMeses");
const selectorDiasSemana = document.getElementById("selectorDiasSemana");
const calendariosSeleccion = document.getElementById("calendariosSeleccion");
const calendariosResultado = document.getElementById("calendariosResultado");
const panelDiasEspecificos = document.getElementById("panelDiasEspecificos");
const mensaje = document.getElementById("mensaje");
const resumen = document.getElementById("resumen");

let fechasDesactivadas = new Set();
let ultimaAsignacion = null;

function claveFecha(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function agregarFilaPersona(valor = "") {
  const fila = document.createElement("div");
  fila.className = "persona-fila";

  const input = document.createElement("input");
  input.className = "persona-input";
  input.type = "text";
  input.placeholder = "Nombre";
  input.value = valor;

  const borrar = document.createElement("button");
  borrar.type = "button";
  borrar.className = "btn mini";
  borrar.textContent = "✕";
  borrar.addEventListener("click", () => fila.remove());

  fila.append(input, borrar);
  listaPersonas.appendChild(fila);
}

function crearSelectores() {
  meses.forEach((mes, indice) => {
    const label = document.createElement("label");
    label.className = "check-card";
    label.innerHTML = `<input type="checkbox" class="mes-check" value="${indice}" checked> ${mes}`;
    selectorMeses.appendChild(label);
  });

  diasLaborales.forEach(({ js, nombre }) => {
    const label = document.createElement("label");
    label.className = "check-card";
    label.innerHTML = `<input type="checkbox" class="dia-semana-check" value="${js}" checked> ${nombre}`;
    selectorDiasSemana.appendChild(label);
  });
}

function obtenerPersonas() {
  return [...document.querySelectorAll(".persona-input")]
    .map(i => i.value.trim())
    .filter(Boolean);
}

function obtenerMesesActivos() {
  return new Set([...document.querySelectorAll(".mes-check:checked")].map(c => Number(c.value)));
}

function obtenerDiasSemanaActivos() {
  return new Set([...document.querySelectorAll(".dia-semana-check:checked")].map(c => Number(c.value)));
}

function obtenerFechasActivas() {
  const anio = Number(document.getElementById("anio").value);
  const mesesActivos = obtenerMesesActivos();
  const diasActivos = obtenerDiasSemanaActivos();
  const fechas = [];

  for (let mes = 0; mes < 12; mes++) {
    if (!mesesActivos.has(mes)) continue;
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const fecha = new Date(anio, mes, dia);
      if (!diasActivos.has(fecha.getDay())) continue;
      if (fechasDesactivadas.has(claveFecha(fecha))) continue;
      fechas.push(fecha);
    }
  }
  return fechas;
}

function construirCalendarioMes(anio, mes, modoSeleccion = false, asignaciones = new Map()) {
  const cont = document.createElement("article");
  cont.className = "mes";
  cont.innerHTML = `<h3>${meses[mes]} ${anio}</h3>`;

  const tabla = document.createElement("table");
  tabla.className = "tabla-calendario";
  tabla.innerHTML = `<thead><tr>${diasLaborales.map(d => `<th>${d.nombre}</th>`).join("")}</tr></thead>`;
  const tbody = document.createElement("tbody");

  const primerDiaMes = new Date(anio, mes, 1);
  const ultimoDiaMes = new Date(anio, mes + 1, 0);

  const inicio = new Date(primerDiaMes);
  const diaSemanaInicio = inicio.getDay();
  const retroceso = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1;
  inicio.setDate(inicio.getDate() - retroceso);

  const fin = new Date(ultimoDiaMes);
  const diaSemanaFin = fin.getDay();
  const avance = diaSemanaFin === 0 ? 0 : 7 - diaSemanaFin;
  fin.setDate(fin.getDate() + avance);

  const cursor = new Date(inicio);
  while (cursor <= fin) {
    const tr = document.createElement("tr");

    for (let col = 0; col < 5; col++) {
      const fecha = new Date(cursor);
      fecha.setDate(cursor.getDate() + col);
      const td = document.createElement("td");
      td.className = "celda-dia";

      if (fecha.getMonth() === mes) {
        const dia = fecha.getDate();
        const clave = claveFecha(fecha);
        const activoSemana = obtenerDiasSemanaActivos().has(fecha.getDay());
        const activo = activoSemana && !fechasDesactivadas.has(clave);

        td.innerHTML = `<div class="numero-dia">${dia}</div>`;

        if (modoSeleccion) {
          const label = document.createElement("label");
          label.className = "selector-fecha";
          const check = document.createElement("input");
          check.type = "checkbox";
          check.checked = activo;
          check.disabled = !activoSemana;
          check.addEventListener("change", () => {
            if (check.checked) fechasDesactivadas.delete(clave);
            else fechasDesactivadas.add(clave);
            td.classList.toggle("dia-inactivo", !check.checked);
          });
          label.append(check, document.createTextNode(check.disabled ? " No disponible" : " Usar este día"));
          td.appendChild(label);
          if (!activo) td.classList.add("dia-inactivo");
        } else {
          const nombres = asignaciones.get(clave) || [];
          if (!activo || nombres.length === 0) {
            td.classList.add("dia-inactivo");
          } else {
            nombres.forEach(nombre => {
              const span = document.createElement("span");
              span.className = "nombre-turno";
              span.textContent = nombre;
              td.appendChild(span);
            });
          }
        }
      }

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
    cursor.setDate(cursor.getDate() + 7);
  }

  tabla.appendChild(tbody);
  cont.appendChild(tabla);
  return cont;
}

function renderSeleccionDias() {
  const anio = Number(document.getElementById("anio").value);
  const mesesActivos = obtenerMesesActivos();
  calendariosSeleccion.innerHTML = "";
  mesesActivos.forEach(mes => {
    calendariosSeleccion.appendChild(construirCalendarioMes(anio, mes, true));
  });
}

function elegirDosPersonas(personas, estado, usadosMes, mesActual) {
  const candidatos = personas.map(nombre => ({
    nombre,
    total: estado[nombre].total,
    ultimoIndice: estado[nombre].ultimoIndice,
    usadosEsteMes: usadosMes.get(nombre) || 0,
    aleatorio: Math.random()
  }));

  candidatos.sort((a, b) => {
    if (a.usadosEsteMes !== b.usadosEsteMes) return a.usadosEsteMes - b.usadosEsteMes;
    if (a.total !== b.total) return a.total - b.total;
    if (a.ultimoIndice !== b.ultimoIndice) return a.ultimoIndice - b.ultimoIndice;
    return a.aleatorio - b.aleatorio;
  });

  const primera = candidatos[0].nombre;
  const segunda = candidatos.find(c => c.nombre !== primera).nombre;
  return [primera, segunda];
}

function generarAsignacion() {
  const personas = [...new Set(obtenerPersonas())];
  if (personas.length < 2) {
    mensaje.textContent = "Cargá al menos 2 personas.";
    return;
  }

  const fechas = obtenerFechasActivas();
  if (!fechas.length) {
    mensaje.textContent = "No hay días activos para repartir.";
    return;
  }

  const estado = Object.fromEntries(personas.map(n => [n, { total: 0, ultimoIndice: -9999 }]));
  const asignaciones = new Map();
  let mesActual = -1;
  let usadosMes = new Map();

  fechas.forEach((fecha, indice) => {
    if (fecha.getMonth() !== mesActual) {
      mesActual = fecha.getMonth();
      usadosMes = new Map();
    }

    const elegidas = elegirDosPersonas(personas, estado, usadosMes, mesActual);
    asignaciones.set(claveFecha(fecha), elegidas);

    elegidas.forEach(nombre => {
      estado[nombre].total++;
      estado[nombre].ultimoIndice = indice;
      usadosMes.set(nombre, (usadosMes.get(nombre) || 0) + 1);
    });
  });

  ultimaAsignacion = { asignaciones, estado, fechas };
  renderResultado();
  mensaje.textContent = "Calendario generado correctamente.";
}

function renderResultado() {
  if (!ultimaAsignacion) return;
  const anio = Number(document.getElementById("anio").value);
  const mesesActivos = obtenerMesesActivos();
  calendariosResultado.innerHTML = "";

  mesesActivos.forEach(mes => {
    calendariosResultado.appendChild(
      construirCalendarioMes(anio, mes, false, ultimaAsignacion.asignaciones)
    );
  });

  resumen.innerHTML = "";
  const totalDias = ultimaAsignacion.fechas.length;
  const totalAsignaciones = totalDias * 2;

  const generales = document.createElement("div");
  generales.className = "resumen-item";
  generales.textContent = `${totalDias} días activos · ${totalAsignaciones} asignaciones`;
  resumen.appendChild(generales);

  Object.entries(ultimaAsignacion.estado)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([nombre, data]) => {
      const item = document.createElement("div");
      item.className = "resumen-item";
      item.textContent = `${nombre}: ${data.total}`;
      resumen.appendChild(item);
    });
}

document.getElementById("agregarPersona").addEventListener("click", () => agregarFilaPersona());
document.getElementById("todosMeses").addEventListener("click", () => document.querySelectorAll(".mes-check").forEach(c => c.checked = true));
document.getElementById("ningunMes").addEventListener("click", () => document.querySelectorAll(".mes-check").forEach(c => c.checked = false));
document.getElementById("prepararDias").addEventListener("click", () => {
  panelDiasEspecificos.classList.remove("oculto");
  renderSeleccionDias();
  panelDiasEspecificos.scrollIntoView({ behavior: "smooth" });
});
document.getElementById("cerrarDias").addEventListener("click", () => panelDiasEspecificos.classList.add("oculto"));
document.getElementById("generar").addEventListener("click", generarAsignacion);
document.getElementById("regenerar").addEventListener("click", generarAsignacion);

document.getElementById("anio").addEventListener("change", () => {
  fechasDesactivadas = new Set();
  if (!panelDiasEspecificos.classList.contains("oculto")) renderSeleccionDias();
});

crearSelectores();
agregarFilaPersona("María");
agregarFilaPersona("Juan");
agregarFilaPersona("Pedro");
agregarFilaPersona("Sofía");
