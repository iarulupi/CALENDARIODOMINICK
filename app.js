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
const botonPdf = document.getElementById("descargarPdf");
const cargandoPdf = document.getElementById("cargandoPdf");

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

  const disponibilidad = document.createElement("div");
  disponibilidad.className = "disponibilidad-persona";
  disponibilidad.setAttribute("aria-label", "Días disponibles");

  const letras = ["L", "M", "X", "J", "V"];
  diasLaborales.forEach(({ js }, indice) => {
    const label = document.createElement("label");
    label.className = "dia-persona";
    label.title = diasLaborales[indice].nombre;

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "persona-dia-check";
    check.value = js;
    check.checked = true;

    const span = document.createElement("span");
    span.textContent = letras[indice];

    label.append(check, span);
    disponibilidad.appendChild(label);
  });

  const borrar = document.createElement("button");
  borrar.type = "button";
  borrar.className = "btn mini borrar-persona";
  borrar.textContent = "✕";
  borrar.title = "Eliminar persona";
  borrar.addEventListener("click", () => fila.remove());

  fila.append(input, disponibilidad, borrar);
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

function obtenerPersonasDatos() {
  return [...document.querySelectorAll(".persona-fila")]
    .map(fila => {
      const nombre = fila.querySelector(".persona-input").value.trim();
      const diasDisponibles = new Set(
        [...fila.querySelectorAll(".persona-dia-check:checked")].map(c => Number(c.value))
      );
      return { nombre, diasDisponibles };
    })
    .filter(p => p.nombre);
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

function elegirDosPersonas(personasDisponibles, estado, usadosMes) {
  const candidatos = personasDisponibles.map(nombre => ({
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

  return [candidatos[0].nombre, candidatos[1].nombre];
}

function generarAsignacion() {
  const personasDatos = obtenerPersonasDatos();
  const nombres = personasDatos.map(p => p.nombre);

  if (personasDatos.length < 2) {
    mensaje.textContent = "Cargá al menos 2 personas.";
    return;
  }

  if (new Set(nombres.map(n => n.toLocaleLowerCase("es"))).size !== nombres.length) {
    mensaje.textContent = "Hay nombres repetidos. Cada persona debe tener un nombre diferente.";
    return;
  }

  const sinDias = personasDatos.filter(p => p.diasDisponibles.size === 0);
  if (sinDias.length) {
    mensaje.textContent = `${sinDias.map(p => p.nombre).join(", ")} no tiene ningún día disponible tildado.`;
    return;
  }

  const fechas = obtenerFechasActivas();
  if (!fechas.length) {
    mensaje.textContent = "No hay días activos para repartir.";
    return;
  }

  const problemas = fechas.filter(fecha => {
    const disponibles = personasDatos.filter(p => p.diasDisponibles.has(fecha.getDay()));
    return disponibles.length < 2;
  });

  if (problemas.length) {
    const ejemplo = problemas[0];
    const nombreDia = diasLaborales.find(d => d.js === ejemplo.getDay())?.nombre || "Ese día";
    mensaje.textContent = `No hay al menos 2 personas disponibles los ${nombreDia.toLowerCase()}. Revisá los tildes L M X J V.`;
    return;
  }

  const estado = Object.fromEntries(nombres.map(n => [n, { total: 0, ultimoIndice: -9999 }]));
  const asignaciones = new Map();
  let mesActual = -1;
  let usadosMes = new Map();

  fechas.forEach((fecha, indice) => {
    if (fecha.getMonth() !== mesActual) {
      mesActual = fecha.getMonth();
      usadosMes = new Map();
    }

    const disponiblesHoy = personasDatos
      .filter(p => p.diasDisponibles.has(fecha.getDay()))
      .map(p => p.nombre);

    const elegidas = elegirDosPersonas(disponiblesHoy, estado, usadosMes);
    asignaciones.set(claveFecha(fecha), elegidas);

    elegidas.forEach(nombre => {
      estado[nombre].total++;
      estado[nombre].ultimoIndice = indice;
      usadosMes.set(nombre, (usadosMes.get(nombre) || 0) + 1);
    });
  });

  ultimaAsignacion = { asignaciones, estado, fechas };
  renderResultado();
  botonPdf.disabled = false;
  mensaje.textContent = "Calendario generado correctamente respetando la disponibilidad de cada persona.";
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


async function descargarPDF() {
  if (!ultimaAsignacion) {
    mensaje.textContent = "Primero generá el calendario.";
    return;
  }

  if (!window.html2canvas || !window.jspdf) {
    mensaje.textContent = "No se pudieron cargar las herramientas para crear el PDF. Revisá tu conexión a internet.";
    return;
  }

  const mesesRenderizados = [...calendariosResultado.querySelectorAll(".mes")];
  if (!mesesRenderizados.length) return;

  botonPdf.disabled = true;
  cargandoPdf.classList.remove("oculto");

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margen = 10;

    for (let i = 0; i < mesesRenderizados.length; i++) {
      const mes = mesesRenderizados[i];
      mes.classList.add("modo-pdf");

      const canvas = await html2canvas(mes, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false
      });

      mes.classList.remove("modo-pdf");
      const imgData = canvas.toDataURL("image/jpeg", 0.96);
      const maxW = pageW - margen * 2;
      const maxH = pageH - margen * 2;
      const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;
      const x = (pageW - imgW) / 2;
      const y = (pageH - imgH) / 2;

      if (i > 0) pdf.addPage("a4", "landscape");
      pdf.addImage(imgData, "JPEG", x, y, imgW, imgH, undefined, "FAST");
    }

    const anio = Number(document.getElementById("anio").value);
    pdf.save(`calendario-turnos-${anio}.pdf`);
    mensaje.textContent = "PDF descargado correctamente.";
  } catch (error) {
    console.error(error);
    document.querySelectorAll(".mes.modo-pdf").forEach(m => m.classList.remove("modo-pdf"));
    mensaje.textContent = "No se pudo generar el PDF. Probá nuevamente.";
  } finally {
    cargandoPdf.classList.add("oculto");
    botonPdf.disabled = false;
  }
}

document.getElementById("descargarPdf").addEventListener("click", descargarPDF);
