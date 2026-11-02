function iniciarAplicacion() {

    console.log("Test App iniciada");

    registrarServiceWorker();
    actualizarEstadoConexion();
    prepararImportador();
    prepararTestALaCarta();
    prepararTestFallados();
    prepararEstadisticas();
    prepararFlashcards();

}

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarAplicacion
    );

} else {

    iniciarAplicacion();

}

/* =========================================================
   SERVICE WORKER
   ========================================================= */

function registrarServiceWorker() {

    if ("serviceWorker" in navigator) {

        navigator.serviceWorker
            .register("./sw.js")
            .then(registro => {

                console.log(
                    "Service Worker registrado:",
                    registro.scope
                );

            })
            .catch(error => {

                console.error(
                    "Error registrando Service Worker:",
                    error
                );

            });

    }

}


/* =========================================================
   ESTADO DE CONEXIÓN
   ========================================================= */

function actualizarEstadoConexion() {

    const actualizar = () => {

        document.body.classList.toggle(
            "offline",
            !navigator.onLine
        );

    };

    actualizar();

    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);

}


/* =========================================================
   IMPORTADOR
   ========================================================= */

function prepararImportador() {

    const boton = document.querySelector(
        '[data-route="import"]'
    );

    if (!boton) return;

    boton.addEventListener("click", () => {

        const input = document.createElement("input");

        input.type = "file";
        input.accept = ".json,application/json";

        input.addEventListener("change", async event => {

            const archivo = event.target.files[0];

            if (!archivo) return;

            try {

                await importarArchivo(archivo);

            } catch (error) {

                console.error(error);

                alert(
                    "No se ha podido importar el archivo."
                );

            }

        });

        input.click();

    });

}


/* =========================================================
   TEST A LA CARTA
   ========================================================= */

function prepararTestALaCarta() {

    const boton = document.querySelector(
        '[data-route="custom"]'
    );

    if (!boton) return;

    boton.addEventListener("click", () => {

        if (
            window.TestAppTestGenerator &&
            typeof window.TestAppTestGenerator.abrir === "function"
        ) {

            window.TestAppTestGenerator.abrir();

        }

    });

}


/* =========================================================
   TEST FALLADOS
   ========================================================= */

let colaTestFallados = [];
let indiceTestFallados = 0;
let respuestaFalladaSeleccionada = null;
let preguntaFalladaComprobada = false;


function prepararTestFallados() {

    const boton = document.querySelector(
        '[data-route="failed"]'
    );

    if (!boton) return;

    boton.addEventListener("click", abrirTestFallados);

}


async function abrirTestFallados() {

    if (
        !window.TestAppTestData ||
        typeof window.TestAppTestData.obtenerTestFallados !== "function"
    ) {

        alert("No se ha podido cargar Test fallados.");

        return;
    }

    const ids = window.TestAppTestData.obtenerTestFallados();

    if (!ids.length) {

        alert("No tienes preguntas falladas.");

        return;
    }

    try {

        const preguntas = await TestAppDB.getAllQuestions();

        const usadas = new Set();

        colaTestFallados = ids
            .map(id =>
                preguntas.find(
                    pregunta =>
                        String(pregunta.id) === String(id)
                )
            )
            .filter(pregunta => {

                if (!pregunta) return false;

                const id = String(pregunta.id);

                if (usadas.has(id)) return false;

                usadas.add(id);

                return true;

            });

        if (!colaTestFallados.length) {

            alert(
                "No se han encontrado las preguntas falladas."
            );

            return;
        }

        indiceTestFallados = 0;
        respuestaFalladaSeleccionada = null;
        preguntaFalladaComprobada = false;

        mostrarPantallaTestFallados();

    } catch (error) {

        console.error(error);

        alert(
            "No se han podido cargar los test fallados."
        );

    }

}


function mostrarPantallaTestFallados() {

    let pantalla = document.getElementById(
        "test-fallados-screen"
    );

    if (!pantalla) {

        pantalla = document.createElement("div");
        pantalla.id = "test-fallados-screen";

        document.body.appendChild(pantalla);

    }

    pantalla.className = "test-overlay";

    document.body.classList.add(
        "test-generator-active"
    );

    mostrarPreguntaFallada();

}


function mostrarPreguntaFallada() {

    const pantalla = document.getElementById(
        "test-fallados-screen"
    );

    if (!pantalla) return;

    if (colaTestFallados.length === 0) {

        mostrarFinalTestFallados();

        return;
    }

    if (indiceTestFallados >= colaTestFallados.length) {
        indiceTestFallados = 0;
    }

    const pregunta = colaTestFallados[indiceTestFallados];

    respuestaFalladaSeleccionada = null;
    preguntaFalladaComprobada = false;

    const opciones = ["A", "B", "C"];

    const textoPregunta =
        pregunta.pregunta ||
        pregunta.enunciado ||
        pregunta.texto ||
        "";

    const respuestas = {

        A:
            pregunta.respuesta_a ||
            pregunta.A ||
            "",

        B:
            pregunta.respuesta_b ||
            pregunta.B ||
            "",

        C:
            pregunta.respuesta_c ||
            pregunta.C ||
            ""

    };

    pantalla.innerHTML = `

        <div class="test-running">

            <div class="test-running-header">

                <div>

                    <div class="test-config-kicker">
                        TEST FALLADOS
                    </div>

                    <h2>
                        Pregunta
                        ${indiceTestFallados + 1}
                        de
                        ${colaTestFallados.length}
                    </h2>

                </div>

                <button
                    type="button"
                    class="test-close-button"
                    id="cerrar-test-fallados">

                    ✕

                </button>

            </div>

            <div class="question-container">

                <div class="question-meta">

                    <span>
                        Pregunta
                        ${indiceTestFallados + 1}
                        /
                        ${colaTestFallados.length}
                    </span>

                </div>

                <div class="question-card">

                    <h2>
                        ${escaparHTML(textoPregunta)}
                    </h2>

                    <div class="answers-container">

                        ${opciones.map(letra => `

                            <button
                                type="button"
                                class="answer-button"
                                data-respuesta-fallada="${letra}">

                                <span class="answer-letter">
                                    ${letra}
                                </span>

                                <span class="answer-text">
                                    ${escaparHTML(respuestas[letra])}
                                </span>

                            </button>

                        `).join("")}

                    </div>

                </div>

            </div>

            <div class="test-navigation">

                <button
                    type="button"
                    class="navigation-button"
                    id="comprobar-fallada"
                    disabled>

                    Comprobar

                </button>

                <button
                    type="button"
                    class="navigation-button"
                    id="siguiente-fallada"
                    style="display:none; margin:0 auto;">

                    Siguiente pregunta

                </button>

            </div>

        </div>

    `;

    const botonesRespuesta = pantalla.querySelectorAll(
        "[data-respuesta-fallada]"
    );

    botonesRespuesta.forEach(boton => {

        boton.addEventListener("click", () => {

            if (preguntaFalladaComprobada) return;

            seleccionarRespuestaFallada(
                boton.dataset.respuestaFallada
            );

        });

    });

    const comprobar = document.getElementById(
        "comprobar-fallada"
    );

    if (comprobar) {
        comprobar.addEventListener(
            "click",
            comprobarPreguntaFallada
        );
    }

    const siguiente = document.getElementById(
        "siguiente-fallada"
    );

    if (siguiente) {
        siguiente.addEventListener(
            "click",
            siguientePreguntaFallada
        );
    }

    const cerrar = document.getElementById(
        "cerrar-test-fallados"
    );

    if (cerrar) {
        cerrar.addEventListener(
            "click",
            cerrarTestFallados
        );
    }

}


function seleccionarRespuestaFallada(letra) {

    if (preguntaFalladaComprobada) return;

    respuestaFalladaSeleccionada = String(letra)
        .trim()
        .toUpperCase();

    const botones = document.querySelectorAll(
        "[data-respuesta-fallada]"
    );

    botones.forEach(boton => {

        boton.classList.remove("selected");
        boton.classList.remove("correct", "incorrect");

        boton.style.backgroundColor = "";
        boton.style.borderColor = "";
        boton.style.color = "";

        const valor = String(
            boton.dataset.respuestaFallada
        ).trim().toUpperCase();

        if (valor === respuestaFalladaSeleccionada) {
            boton.classList.add("selected");
        }

    });

    const comprobar = document.getElementById(
        "comprobar-fallada"
    );

    if (comprobar) comprobar.disabled = false;

}


function comprobarPreguntaFallada() {

    if (preguntaFalladaComprobada) return;
    if (!respuestaFalladaSeleccionada) return;

    const pregunta = colaTestFallados[indiceTestFallados];

    if (!pregunta) return;

    const correcta = String(
        pregunta.respuesta_correcta || ""
    ).trim().toUpperCase();

    const seleccionada = String(
        respuestaFalladaSeleccionada
    ).trim().toUpperCase();

    preguntaFalladaComprobada = true;

    const acertada = seleccionada === correcta;

    const botones = document.querySelectorAll(
        "[data-respuesta-fallada]"
    );

    botones.forEach(boton => {

        const letra = String(
            boton.dataset.respuestaFallada
        ).trim().toUpperCase();

        boton.classList.remove("selected");
        boton.classList.remove("correct", "incorrect");

        if (letra === correcta) {

            boton.classList.add("correct");

            boton.style.backgroundColor = "#dcfce7";
            boton.style.borderColor = "#86efac";
            boton.style.color = "#166534";

        }

        if (
            letra === seleccionada &&
            seleccionada !== correcta
        ) {

            boton.classList.add("incorrect");

            boton.style.backgroundColor = "#fee2e2";
            boton.style.borderColor = "#fca5a5";
            boton.style.color = "#991b1b";

        }

        boton.disabled = true;

    });

    if (
        window.TestAppTestData &&
        typeof window.TestAppTestData.registrarResultadoPregunta === "function"
    ) {

        window.TestAppTestData.registrarResultadoPregunta({

            id: pregunta.id,
            respuesta: seleccionada,
            acertada,
            tema: pregunta.tema,
            riesgo: false,
            registrarEstadistica: false

        });

    }

    if (acertada) {

        colaTestFallados.splice(indiceTestFallados, 1);

    } else {

        const preguntaMovida = colaTestFallados.splice(
            indiceTestFallados,
            1
        )[0];

        if (preguntaMovida) {
            colaTestFallados.push(preguntaMovida);
        }

    }

    const comprobar = document.getElementById(
        "comprobar-fallada"
    );

    const siguiente = document.getElementById(
        "siguiente-fallada"
    );

    if (comprobar) {

        comprobar.style.display = "none";
        comprobar.disabled = true;

    }

    if (siguiente) {
        siguiente.style.display = "inline-flex";
    }

}


function siguientePreguntaFallada() {

    if (colaTestFallados.length === 0) {

        mostrarFinalTestFallados();

        return;
    }

    if (indiceTestFallados >= colaTestFallados.length) {
        indiceTestFallados = 0;
    }

    mostrarPreguntaFallada();

}


function mostrarFinalTestFallados() {

    const pantalla = document.getElementById(
        "test-fallados-screen"
    );

    if (!pantalla) return;

    pantalla.innerHTML = `

        <div class="test-results">

            <div class="results-header">

                <div class="results-title">

                    <div class="test-config-kicker">
                        TEST FALLADOS
                    </div>

                    <h2>
                        ¡Has terminado!
                    </h2>

                </div>

            </div>

            <div class="results-score-card">

                <div class="results-score-main">
                    🎉
                </div>

                <p>
                    Has corregido todas las preguntas falladas.
                </p>

            </div>

            <div class="results-footer">

                <button
                    type="button"
                    class="test-primary-button"
                    id="volver-inicio-fallados">

                    Volver al inicio

                </button>

            </div>

        </div>

    `;

    const volver = document.getElementById(
        "volver-inicio-fallados"
    );

    if (volver) {
        volver.addEventListener(
            "click",
            cerrarTestFallados
        );
    }

}


function cerrarTestFallados() {

    const pantalla = document.getElementById(
        "test-fallados-screen"
    );

    if (pantalla) pantalla.remove();

    document.body.classList.remove(
        "test-generator-active"
    );

    colaTestFallados = [];
    indiceTestFallados = 0;
    respuestaFalladaSeleccionada = null;
    preguntaFalladaComprobada = false;

}


/* =========================================================
   ESTADÍSTICAS
   ========================================================= */

function prepararEstadisticas() {

    const boton = document.querySelector(
        '[data-route="statistics"]'
    );

    if (!boton) return;

    boton.addEventListener("click", abrirEstadisticas);

}


function abrirEstadisticas() {

    if (
        !window.TestAppTestData ||
        typeof window.TestAppTestData.obtenerEstadisticas !== "function"
    ) {

        alert(
            "Todavía no hay estadísticas disponibles."
        );

        return;
    }

    const estadisticas =
        window.TestAppTestData.obtenerEstadisticas();

    mostrarPantallaEstadisticas(estadisticas);

}


function mostrarPantallaEstadisticas(estadisticas) {

    const total = Number(estadisticas.totalPreguntas || 0);
    const respondidas = Number(estadisticas.respondidas || 0);
    const aciertos = Number(estadisticas.aciertos || 0);
    const fallos = Number(estadisticas.fallos || 0);
    const blancas = Number(estadisticas.blancas || 0);
    const aciertosRiesgo = Number(estadisticas.aciertosRiesgo || 0);
    const fallosRiesgo = Number(estadisticas.fallosRiesgo || 0);
    const testsRealizados = Number(estadisticas.testsRealizados || 0);

    const porcentajeAciertos = respondidas
        ? Math.round((aciertos / respondidas) * 100)
        : 0;

    const porcentajeFallos = respondidas
        ? Math.round((fallos / respondidas) * 100)
        : 0;

    const porcentajeBlancas = total
        ? Math.round((blancas / total) * 100)
        : 0;

    const totalRiesgos = aciertosRiesgo + fallosRiesgo;

    const porcentajeRiesgo = respondidas
        ? Math.round((totalRiesgos / respondidas) * 100)
        : 0;

    let pantalla = document.getElementById(
        "estadisticas-screen"
    );

    if (!pantalla) {

        pantalla = document.createElement("div");
        pantalla.id = "estadisticas-screen";

        document.body.appendChild(pantalla);

    }

    pantalla.className = "test-overlay";

    document.body.classList.add(
        "test-generator-active"
    );

    const temas =
        estadisticas.porTema &&
        typeof estadisticas.porTema === "object"
            ? estadisticas.porTema
            : {};

    const listaTemas = Object.entries(temas).sort(
        ([a], [b]) => {

            const na = parseInt(a, 10);
            const nb = parseInt(b, 10);

            if (
                Number.isInteger(na) &&
                Number.isInteger(nb)
            ) {
                return na - nb;
            }

            return String(a).localeCompare(String(b));

        }
    );

    const segmentos = total
        ? `conic-gradient(
            #22c55e 0 ${(aciertos / total * 100).toFixed(2)}%,
            #ef4444 ${(aciertos / total * 100).toFixed(2)}% ${((
                (aciertos + fallos) / total
            ) * 100).toFixed(2)}%,
            #cbd5e1 ${((
                (aciertos + fallos) / total
            ) * 100).toFixed(2)}% 100%
        )`
        : "#e5e7eb";

    pantalla.innerHTML = `

        <div
            class="test-results"
            style="
                max-width:1100px;
                width:calc(100% - 32px);
                margin:0 auto;
                box-sizing:border-box;
            ">

            <div class="results-header">

                <div class="results-title">

                    <span class="test-config-kicker">
                        ESTADÍSTICAS
                    </span>

                    <h2>Tu evolución</h2>

                    <p>
                        Consulta tus resultados y tu rendimiento por temas.
                    </p>

                </div>

                <button
                    type="button"
                    class="test-close-button"
                    id="cerrar-estadisticas">

                    ✕

                </button>

            </div>

            <div
                style="
                    display:grid;
                    grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
                    gap:14px;
                    margin-bottom:24px;
                ">

                <div style="padding:20px;border-radius:18px;background:#fff;border:1px solid #e2e8f0;box-sizing:border-box;">

                    <span style="display:block;font-size:12px;font-weight:700;letter-spacing:.05em;color:#64748b;margin-bottom:8px;">
                        PREGUNTAS
                    </span>

                    <strong style="display:block;font-size:32px;line-height:1;color:#0f172a;">
                        ${total}
                    </strong>

                    <small style="display:block;margin-top:7px;color:#64748b;">
                        ${testsRealizados}
                        ${testsRealizados === 1 ? "test realizado" : "tests realizados"}
                    </small>

                </div>

                <div style="padding:20px;border-radius:18px;background:#f0fdf4;border:1px solid #86efac;box-sizing:border-box;">

                    <span style="display:block;font-size:12px;font-weight:700;letter-spacing:.05em;color:#166534;margin-bottom:8px;">
                        ACIERTOS
                    </span>

                    <strong style="display:block;font-size:32px;line-height:1;color:#166534;">
                        ${aciertos}
                    </strong>

                    <small style="display:block;margin-top:7px;color:#166534;">
                        ${porcentajeAciertos}%
                    </small>

                </div>

                <div style="padding:20px;border-radius:18px;background:#fef2f2;border:1px solid #fca5a5;box-sizing:border-box;">

                    <span style="display:block;font-size:12px;font-weight:700;letter-spacing:.05em;color:#991b1b;margin-bottom:8px;">
                        FALLOS
                    </span>

                    <strong style="display:block;font-size:32px;line-height:1;color:#991b1b;">
                        ${fallos}
                    </strong>

                    <small style="display:block;margin-top:7px;color:#991b1b;">
                        ${porcentajeFallos}%
                    </small>

                </div>

                <div style="padding:20px;border-radius:18px;background:#f8fafc;border:1px solid #cbd5e1;box-sizing:border-box;">

                    <span style="display:block;font-size:12px;font-weight:700;letter-spacing:.05em;color:#475569;margin-bottom:8px;">
                        EN BLANCO
                    </span>

                    <strong style="display:block;font-size:32px;line-height:1;color:#334155;">
                        ${blancas}
                    </strong>

                    <small style="display:block;margin-top:7px;color:#64748b;">
                        ${porcentajeBlancas}%
                    </small>

                </div>

                <div style="padding:20px;border-radius:18px;background:#fff7ed;border:1px solid #fdba74;box-sizing:border-box;">

                    <span style="display:block;font-size:12px;font-weight:700;letter-spacing:.05em;color:#9a3412;margin-bottom:8px;">
                        RIESGO
                    </span>

                    <strong style="display:block;font-size:32px;line-height:1;color:#9a3412;">
                        ${totalRiesgos}
                    </strong>

                    <small style="display:block;margin-top:7px;color:#9a3412;">
                        ${aciertosRiesgo} aciertos · ${fallosRiesgo} fallos
                    </small>

                </div>

            </div>

            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:22px;padding:28px;margin-bottom:20px;box-sizing:border-box;">

                <div style="margin-bottom:24px;">

                    <span style="display:block;font-size:12px;font-weight:700;letter-spacing:.06em;color:#64748b;margin-bottom:7px;">
                        RENDIMIENTO
                    </span>

                    <h3 style="margin:0;font-size:22px;color:#0f172a;">
                        Resultado general
                    </h3>

                </div>

                <div style="display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);gap:35px;align-items:center;">

                    <div style="display:flex;justify-content:center;align-items:center;">

                        <div style="width:220px;height:220px;border-radius:50%;background:${segmentos};position:relative;display:flex;align-items:center;justify-content:center;">

                            <div style="width:130px;height:130px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(15,23,42,.08);">

                                <strong style="font-size:32px;color:#0f172a;line-height:1;">
                                    ${total}
                                </strong>

                                <span style="margin-top:7px;font-size:13px;color:#64748b;">
                                    preguntas
                                </span>

                            </div>

                        </div>

                    </div>

                    <div style="display:flex;flex-direction:column;gap:16px;">

                        <div style="display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 17px;border-radius:14px;background:#f8fafc;">

                            <div style="display:flex;align-items:center;gap:10px;">
                                <span style="width:12px;height:12px;border-radius:50%;background:#22c55e;"></span>
                                <span>Aciertos</span>
                            </div>

                            <strong>${aciertos} · ${porcentajeAciertos}%</strong>

                        </div>

                        <div style="display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 17px;border-radius:14px;background:#f8fafc;">

                            <div style="display:flex;align-items:center;gap:10px;">
                                <span style="width:12px;height:12px;border-radius:50%;background:#ef4444;"></span>
                                <span>Fallos</span>
                            </div>

                            <strong>${fallos} · ${porcentajeFallos}%</strong>

                        </div>

                        <div style="display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 17px;border-radius:14px;background:#f8fafc;">

                            <div style="display:flex;align-items:center;gap:10px;">
                                <span style="width:12px;height:12px;border-radius:50%;background:#cbd5e1;"></span>
                                <span>En blanco</span>
                            </div>

                            <strong>${blancas} · ${porcentajeBlancas}%</strong>

                        </div>

                        <div style="padding:16px 17px;border-radius:14px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;">

                            <strong>Riesgo:</strong>
                            ${totalRiesgos} preguntas
                            (${porcentajeRiesgo}% de las respondidas)

                        </div>

                    </div>

                </div>

            </div>

            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:22px;padding:28px;box-sizing:border-box;">

                <div style="margin-bottom:25px;">

                    <span style="display:block;font-size:12px;font-weight:700;letter-spacing:.06em;color:#64748b;margin-bottom:7px;">
                        POR TEMAS
                    </span>

                    <h3 style="margin:0 0 7px;font-size:22px;color:#0f172a;">
                        Rendimiento por tema
                    </h3>

                    <p style="margin:0;color:#64748b;">
                        Consulta tus aciertos, fallos y preguntas en blanco en cada tema.
                    </p>

                </div>

                <div style="display:flex;flex-direction:column;gap:12px;">

                    ${
                        listaTemas.length
                            ? listaTemas.map(([tema, datos]) => {

                                const temaTotal = Number(datos.total || 0);
                                const temaRespondidas = Number(datos.respondidas || 0);
                                const temaAciertos = Number(datos.aciertos || 0);
                                const temaFallos = Number(datos.fallos || 0);
                                const temaBlancas = Number(datos.blancas || 0);

                                const pctAciertos = temaTotal
                                    ? temaAciertos / temaTotal * 100
                                    : 0;

                                const pctFallos = temaTotal
                                    ? temaFallos / temaTotal * 100
                                    : 0;

                                const pctBlancas = temaTotal
                                    ? temaBlancas / temaTotal * 100
                                    : 0;

                                const precision = temaRespondidas
                                    ? Math.round(temaAciertos / temaRespondidas * 100)
                                    : 0;

                                return `

                                    <div style="border:1px solid #e2e8f0;border-radius:17px;padding:18px;box-sizing:border-box;">

                                        <div style="display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:12px;">

                                            <div>

                                                <strong style="display:block;color:#0f172a;font-size:16px;">
                                                    Tema ${escaparHTML(tema)}
                                                </strong>

                                                <span style="display:block;margin-top:4px;color:#64748b;font-size:13px;">
                                                    ${temaTotal} preguntas · ${temaRespondidas} respondidas
                                                </span>

                                            </div>

                                            <strong style="font-size:22px;color:#2563eb;white-space:nowrap;">
                                                ${precision}%
                                            </strong>

                                        </div>

                                        <div style="width:100%;height:10px;background:#e2e8f0;border-radius:99px;overflow:hidden;display:flex;">

                                            <span style="display:block;width:${pctAciertos}%;background:#22c55e;"></span>
                                            <span style="display:block;width:${pctFallos}%;background:#ef4444;"></span>
                                            <span style="display:block;width:${pctBlancas}%;background:#cbd5e1;"></span>

                                        </div>

                                        <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;font-size:13px;color:#475569;">

                                            <span>🟢 ${temaAciertos} aciertos</span>
                                            <span>🔴 ${temaFallos} fallos</span>
                                            <span>⚪ ${temaBlancas} blancas</span>

                                        </div>

                                    </div>

                                `;

                            }).join("")
                            : `

                                <div style="padding:35px 20px;text-align:center;border:1px dashed #cbd5e1;border-radius:17px;color:#64748b;">

                                    <div style="font-size:38px;margin-bottom:12px;">
                                        📊
                                    </div>

                                    <strong style="display:block;color:#334155;font-size:17px;margin-bottom:7px;">
                                        Todavía no hay estadísticas
                                    </strong>

                                    <span>
                                        Haz tu primer test para empezar a ver tu evolución.
                                    </span>

                                </div>

                            `
                    }

                </div>

            </div>

            <div class="results-footer">

                <button
                    type="button"
                    class="navigation-button primary"
                    id="volver-inicio-estadisticas">

                    Volver al inicio

                </button>

            </div>

        </div>

    `;

    const cerrar = document.getElementById(
        "cerrar-estadisticas"
    );

    if (cerrar) {
        cerrar.addEventListener("click", cerrarEstadisticas);
    }

    const volver = document.getElementById(
        "volver-inicio-estadisticas"
    );

    if (volver) {
        volver.addEventListener("click", cerrarEstadisticas);
    }

}


function cerrarEstadisticas() {

    const pantalla = document.getElementById(
        "estadisticas-screen"
    );

    if (pantalla) pantalla.remove();

    document.body.classList.remove(
        "test-generator-active"
    );

}


/* =========================================================
   FLASHCARDS
   ========================================================= */

let flashcardsActuales = [];
let flashcardTemaActual = null;
let flashcardIndiceActual = 0;
let flashcardMostrarParteB = false;


const GRUPOS_FLASHCARDS = [

    {
        nombre: "Ciencias Jurídicas",
        desde: 1,
        hasta: 26,
        icono: "⚖️"
    },

    {
        nombre: "Ciencias Sociales",
        desde: 27,
        hasta: 37,
        icono: "👥"
    },

    {
        nombre: "Materias Técnico-Científicas",
        desde: 38,
        hasta: 45,
        icono: "🔬"
    }

];


function prepararFlashcards() {

    console.log("PREPARANDO FLASHCARDS");

    const boton = document.querySelector('[data-route="flashcard"]');

    console.log("BOTÓN ENCONTRADO:", boton);

    if (!boton) return;

    boton.addEventListener("click", function () {

        alert("EL BOTÓN FLASHCARD FUNCIONA");

        abrirFlashcards();

    });

}

async function abrirFlashcards() {
    console.log("1. Clic detectado");

    try {
        await obtenerTodasLasFlashcards();
        console.log("2. Flashcards cargadas:", flashcardsActuales.length);

        mostrarMenuFlashcards();
        console.log("3. Menú mostrado");

    } catch (error) {
        console.error("ERROR FLASHCARDS:", error);
        alert("Error al cargar flashcards: " + error.message);
    }
}

async function obtenerTodasLasFlashcards() {

    const db = await TestAppDB.openDatabase();

    return new Promise((resolve, reject) => {

        let transaction;

        try {

            transaction = db.transaction(
                "flashcards",
                "readonly"
            );

            const request = transaction
                .objectStore("flashcards")
                .getAll();

            request.onsuccess = () => {
                flashcardsActuales = request.result || [];
            };

            request.onerror = () => {
                reject(request.error);
            };

            transaction.oncomplete = () => {

                db.close();

                resolve(flashcardsActuales);

            };

            transaction.onerror = () => {

                db.close();

                reject(transaction.error);

            };

        } catch (error) {

            db.close();

            reject(error);

        }

    });

}


function crearPantallaFlashcards() {

    let pantalla = document.getElementById(
        "flashcards-screen"
    );

    if (!pantalla) {

        pantalla = document.createElement("div");

        pantalla.id = "flashcards-screen";

        document.body.appendChild(pantalla);

    }

    pantalla.className = "test-overlay";

    document.body.classList.add(
        "test-generator-active"
    );

    return pantalla;

}


function mostrarMenuFlashcards() {

    const pantalla = crearPantallaFlashcards();

    pantalla.innerHTML = `

        <div class="test-results" style="max-width:1000px;width:calc(100% - 32px);margin:0 auto;">

            <div class="results-header">

                <div class="results-title">

                    <div class="test-config-kicker">
                        FLASHCARDS
                    </div>

                    <h2>Estudia y memoriza</h2>

                    <p>
                        Selecciona una materia para consultar tus tarjetas.
                    </p>

                </div>

                <button
                    type="button"
                    class="test-close-button"
                    id="cerrar-flashcards">

                    ✕

                </button>

            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">

                ${GRUPOS_FLASHCARDS.map((grupo, indice) => {

                    const cantidad = flashcardsActuales.filter(
                        tarjeta =>
                            Number(tarjeta.tema) >= grupo.desde &&
                            Number(tarjeta.tema) <= grupo.hasta
                    ).length;

                    return `

                        <button
                            type="button"
                            data-grupo-flashcards="${indice}"
                            style="
                                padding:24px;
                                border:1px solid #e2e8f0;
                                border-radius:18px;
                                background:#fff;
                                text-align:left;
                                cursor:pointer;
                                color:#0f172a;
                            ">

                            <span style="font-size:30px;">
                                ${grupo.icono}
                            </span>

                            <strong style="display:block;margin-top:12px;font-size:18px;">
                                ${grupo.nombre}
                            </strong>

                            <span style="display:block;margin-top:7px;color:#64748b;">
                                Temas ${grupo.desde}–${grupo.hasta}
                            </span>

                            <span style="display:block;margin-top:12px;font-weight:700;color:#2563eb;">
                                ${cantidad} tarjetas
                            </span>

                        </button>

                    `;

                }).join("")}

            </div>

        </div>

    `;

    document.getElementById(
        "cerrar-flashcards"
    ).addEventListener("click", cerrarFlashcards);

    pantalla.querySelectorAll(
        "[data-grupo-flashcards]"
    ).forEach(boton => {

        boton.addEventListener("click", () => {

            const grupo = GRUPOS_FLASHCARDS[
                Number(boton.dataset.grupoFlashcards)
            ];

            mostrarTemasFlashcards(grupo);

        });

    });

}


function mostrarTemasFlashcards(grupo) {

    const pantalla = crearPantallaFlashcards();

    const temas = [];

    for (
        let numero = grupo.desde;
        numero <= grupo.hasta;
        numero++
    ) {

        const cantidad = flashcardsActuales.filter(
            tarjeta => Number(tarjeta.tema) === numero
        ).length;

        temas.push({
            numero,
            cantidad
        });

    }

    pantalla.innerHTML = `

        <div class="test-results" style="max-width:1000px;width:calc(100% - 32px);margin:0 auto;">

            <div class="results-header">

                <div class="results-title">

                    <div class="test-config-kicker">
                        ${grupo.nombre}
                    </div>

                    <h2>Selecciona un tema</h2>

                    <p>
                        Elige el tema cuyas tarjetas quieres estudiar o administrar.
                    </p>

                </div>

                <button
                    type="button"
                    class="test-close-button"
                    id="cerrar-flashcards">

                    ✕

                </button>

            </div>

            <button
                type="button"
                class="navigation-button"
                id="volver-grupos-flashcards"
                style="margin-bottom:20px;">

                ← Volver a materias

            </button>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;">

                ${temas.map(tema => `

                    <button
                        type="button"
                        data-tema-flashcards="${tema.numero}"
                        style="
                            padding:20px 12px;
                            border:1px solid #e2e8f0;
                            border-radius:16px;
                            background:#fff;
                            cursor:pointer;
                            color:#0f172a;
                        ">

                        <strong style="display:block;font-size:18px;">
                            Tema ${tema.numero}
                        </strong>

                        <span style="display:block;margin-top:8px;color:#64748b;font-size:13px;">
                            ${tema.cantidad} tarjetas
                        </span>

                    </button>

                `).join("")}

            </div>

        </div>

    `;

    document.getElementById(
        "cerrar-flashcards"
    ).addEventListener("click", cerrarFlashcards);

    document.getElementById(
        "volver-grupos-flashcards"
    ).addEventListener("click", mostrarMenuFlashcards);

    pantalla.querySelectorAll(
        "[data-tema-flashcards]"
    ).forEach(boton => {

        boton.addEventListener("click", () => {

            abrirTemaFlashcards(
                Number(boton.dataset.temaFlashcards)
            );

        });

    });

}


async function abrirTemaFlashcards(tema) {

    flashcardTemaActual = tema;

    await obtenerTodasLasFlashcards();

    mostrarListaFlashcards(tema);

}


function mostrarListaFlashcards(tema) {

    const pantalla = crearPantallaFlashcards();

    const tarjetas = flashcardsActuales.filter(
        tarjeta => Number(tarjeta.tema) === Number(tema)
    );

    pantalla.innerHTML = `

        <div class="test-results" style="max-width:1000px;width:calc(100% - 32px);margin:0 auto;">

            <div class="results-header">

                <div class="results-title">

                    <div class="test-config-kicker">
                        FLASHCARDS
                    </div>

                    <h2>Tema ${tema}</h2>

                    <p>
                        ${tarjetas.length} tarjetas guardadas.
                    </p>

                </div>

                <button
                    type="button"
                    class="test-close-button"
                    id="cerrar-flashcards">

                    ✕

                </button>

            </div>

            <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:22px;">

                <button
                    type="button"
                    class="navigation-button"
                    id="volver-temas-flashcards">

                    ← Temas

                </button>

                <button
                    type="button"
                    class="navigation-button primary"
                    id="crear-flashcard">

                    + Crear flashcard

                </button>

                ${
                    tarjetas.length
                        ? `
                            <button
                                type="button"
                                class="navigation-button"
                                id="estudiar-flashcards">

                                🧠 Estudiar tarjetas

                            </button>
                        `
                        : ""
                }

            </div>

            ${
                tarjetas.length
                    ? `
                        <div style="display:flex;flex-direction:column;gap:12px;">

                            ${tarjetas.map((tarjeta, indice) => `

                                <div style="padding:18px;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">

                                    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px;">

                                        <strong>
                                            Tarjeta ${indice + 1}
                                        </strong>

                                        <span style="font-size:12px;color:#64748b;">
                                            Tema ${escaparHTML(tarjeta.tema)}
                                        </span>

                                    </div>

                                    <div style="margin-bottom:10px;white-space:pre-wrap;overflow-wrap:anywhere;">
                                        <strong>Parte A:</strong>
                                        ${escaparHTML(tarjeta.parteA)}
                                    </div>

                                    <div style="margin-bottom:15px;white-space:pre-wrap;overflow-wrap:anywhere;">
                                        <strong>Parte B:</strong>
                                        ${escaparHTML(tarjeta.parteB)}
                                    </div>

                                    <div style="display:flex;flex-wrap:wrap;gap:8px;">

                                        <button
                                            type="button"
                                            class="navigation-button"
                                            data-editar-flashcard="${escaparHTML(tarjeta.id)}">

                                            Editar

                                        </button>

                                        <button
                                            type="button"
                                            class="navigation-button"
                                            data-eliminar-flashcard="${escaparHTML(tarjeta.id)}">

                                            Eliminar

                                        </button>

                                    </div>

                                </div>

                            `).join("")}

                        </div>
                    `
                    : `
                        <div style="padding:40px 20px;text-align:center;border:1px dashed #cbd5e1;border-radius:18px;background:#fff;">

                            <div style="font-size:40px;margin-bottom:12px;">
                                🧠
                            </div>

                            <h3 style="margin:0 0 8px;">
                                Todavía no hay tarjetas
                            </h3>

                            <p style="color:#64748b;">
                                Crea tu primera flashcard para este tema.
                            </p>

                        </div>
                    `
            }

        </div>

    `;

    document.getElementById(
        "cerrar-flashcards"
    ).addEventListener("click", cerrarFlashcards);

    document.getElementById(
        "volver-temas-flashcards"
    ).addEventListener("click", () => {

        const grupo = GRUPOS_FLASHCARDS.find(
            item =>
                tema >= item.desde &&
                tema <= item.hasta
        );

        mostrarTemasFlashcards(grupo);

    });

    document.getElementById(
        "crear-flashcard"
    ).addEventListener("click", () => {

        mostrarFormularioFlashcard(null, tema);

    });

    const estudiar = document.getElementById(
        "estudiar-flashcards"
    );

    if (estudiar) {

        estudiar.addEventListener("click", () => {

            iniciarEstudioFlashcards(tarjetas);

        });

    }

    pantalla.querySelectorAll(
        "[data-editar-flashcard]"
    ).forEach(boton => {

        boton.addEventListener("click", () => {

            const tarjeta = tarjetas.find(
                item =>
                    String(item.id) ===
                    String(boton.dataset.editarFlashcard)
            );

            if (tarjeta) {
                mostrarFormularioFlashcard(tarjeta, tema);
            }

        });

    });

    pantalla.querySelectorAll(
        "[data-eliminar-flashcard]"
    ).forEach(boton => {

        boton.addEventListener("click", async () => {

            const id = boton.dataset.eliminarFlashcard;

            if (!confirm("¿Quieres eliminar esta flashcard?")) {
                return;
            }

            try {

                await eliminarFlashcardDB(id);

                await abrirTemaFlashcards(tema);

            } catch (error) {

                console.error(error);

                alert("No se ha podido eliminar la flashcard.");

            }

        });

    });

}


function mostrarFormularioFlashcard(tarjeta, temaInicial) {

    const pantalla = crearPantallaFlashcards();

    const editando = Boolean(tarjeta);

    const temaSeleccionado = editando
        ? Number(tarjeta.tema)
        : Number(temaInicial);

    pantalla.innerHTML = `

        <div class="test-results" style="max-width:750px;width:calc(100% - 32px);margin:0 auto;">

            <div class="results-header">

                <div class="results-title">

                    <div class="test-config-kicker">
                        FLASHCARDS
                    </div>

                    <h2>
                        ${editando ? "Editar tarjeta" : "Crear tarjeta"}
                    </h2>

                    <p>
                        Completa las dos partes de la tarjeta.
                    </p>

                </div>

                <button
                    type="button"
                    class="test-close-button"
                    id="cerrar-flashcards">

                    ✕

                </button>

            </div>

            <form id="form-flashcard" style="background:#fff;padding:22px;border:1px solid #e2e8f0;border-radius:18px;">

                <label for="flashcard-tema" style="display:block;font-weight:700;margin-bottom:8px;">
                    Tema
                </label>

                <select
                    id="flashcard-tema"
                    required
                    style="width:100%;padding:13px;border:1px solid #cbd5e1;border-radius:10px;margin-bottom:20px;font-size:16px;">

                    ${Array.from({length:45}, (_, indice) => indice + 1).map(numero => `

                        <option
                            value="${numero}"
                            ${numero === temaSeleccionado ? "selected" : ""}>

                            Tema ${numero}

                        </option>

                    `).join("")}

                </select>

                <label for="flashcard-parte-a" style="display:block;font-weight:700;margin-bottom:8px;">
                    Parte A
                </label>

                <textarea
                    id="flashcard-parte-a"
                    required
                    rows="4"
                    placeholder="Escribe aquí la primera parte..."
                    style="width:100%;box-sizing:border-box;padding:13px;border:1px solid #cbd5e1;border-radius:10px;margin-bottom:20px;font-size:16px;resize:vertical;">${escaparHTML(editando ? tarjeta.parteA : "")}</textarea>

                <label for="flashcard-parte-b" style="display:block;font-weight:700;margin-bottom:8px;">
                    Parte B
                </label>

                <textarea
                    id="flashcard-parte-b"
                    required
                    rows="5"
                    placeholder="Escribe aquí la segunda parte..."
                    style="width:100%;box-sizing:border-box;padding:13px;border:1px solid #cbd5e1;border-radius:10px;margin-bottom:22px;font-size:16px;resize:vertical;">${escaparHTML(editando ? tarjeta.parteB : "")}</textarea>

                <div style="display:flex;flex-wrap:wrap;gap:10px;">

                    <button
                        type="submit"
                        class="navigation-button primary">

                        ${editando ? "Guardar cambios" : "Crear flashcard"}

                    </button>

                    <button
                        type="button"
                        class="navigation-button"
                        id="cancelar-flashcard">

                        Cancelar

                    </button>

                </div>

            </form>

        </div>

    `;

    document.getElementById(
        "cerrar-flashcards"
    ).addEventListener("click", cerrarFlashcards);

    document.getElementById(
        "cancelar-flashcard"
    ).addEventListener("click", () => {

        mostrarListaFlashcards(temaInicial);

    });

    document.getElementById(
        "form-flashcard"
    ).addEventListener("submit", async event => {

        event.preventDefault();

        const temaNuevo = Number(
            document.getElementById("flashcard-tema").value
        );

        const parteA = document.getElementById(
            "flashcard-parte-a"
        ).value.trim();

        const parteB = document.getElementById(
            "flashcard-parte-b"
        ).value.trim();

        if (
            !Number.isInteger(temaNuevo) ||
            temaNuevo < 1 ||
            temaNuevo > 45 ||
            !parteA ||
            !parteB
        ) {

            alert("Completa el tema y las dos partes de la tarjeta.");

            return;
        }

        try {

            if (editando) {

                await guardarFlashcardEditada({
                    id: tarjeta.id,
                    tema: temaNuevo,
                    parteA,
                    parteB
                });

            } else {

                await guardarNuevaFlashcard({
                    tema: temaNuevo,
                    parteA,
                    parteB
                });

            }

            await abrirTemaFlashcards(temaNuevo);

        } catch (error) {

            console.error(error);

            alert(
                "No se ha podido guardar la flashcard.\n\n" +
                error.message
            );

        }

    });

}


async function guardarNuevaFlashcard(datos) {

    const db = await TestAppDB.openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            "flashcards",
            "readwrite"
        );

        const store = transaction.objectStore("flashcards");

        store.add({

            tema: Number(datos.tema),
            parteA: String(datos.parteA),
            parteB: String(datos.parteB)

        });

        transaction.oncomplete = () => {

            db.close();

            resolve();

        };

        transaction.onerror = () => {

            db.close();

            reject(transaction.error);

        };

        transaction.onabort = () => {

            db.close();

            reject(transaction.error);

        };

    });

}


async function guardarFlashcardEditada(datos) {

    const db = await TestAppDB.openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            "flashcards",
            "readwrite"
        );

        const store = transaction.objectStore("flashcards");

        store.put({

            id: Number(datos.id),
            tema: Number(datos.tema),
            parteA: String(datos.parteA),
            parteB: String(datos.parteB)

        });

        transaction.oncomplete = () => {

            db.close();

            resolve();

        };

        transaction.onerror = () => {

            db.close();

            reject(transaction.error);

        };

        transaction.onabort = () => {

            db.close();

            reject(transaction.error);

        };

    });

}


async function eliminarFlashcardDB(id) {

    const db = await TestAppDB.openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            "flashcards",
            "readwrite"
        );

        transaction.objectStore("flashcards").delete(Number(id));

        transaction.oncomplete = () => {

            db.close();

            resolve();

        };

        transaction.onerror = () => {

            db.close();

            reject(transaction.error);

        };

        transaction.onabort = () => {

            db.close();

            reject(transaction.error);

        };

    });

}


function iniciarEstudioFlashcards(tarjetas) {

    flashcardsActuales = tarjetas.slice();

    flashcardIndiceActual = 0;
    flashcardMostrarParteB = false;

    mostrarTarjetaEstudio();

}


function mostrarTarjetaEstudio() {

    const pantalla = crearPantallaFlashcards();

    if (!flashcardsActuales.length) {

        mostrarListaFlashcards(flashcardTemaActual);

        return;
    }

    if (flashcardIndiceActual < 0) {
        flashcardIndiceActual = 0;
    }

    if (flashcardIndiceActual >= flashcardsActuales.length) {
        flashcardIndiceActual = flashcardsActuales.length - 1;
    }

    const tarjeta = flashcardsActuales[flashcardIndiceActual];

    const contenido = flashcardMostrarParteB
        ? tarjeta.parteB
        : tarjeta.parteA;

    const etiqueta = flashcardMostrarParteB
        ? "PARTE B"
        : "PARTE A";

    pantalla.innerHTML = `

        <div class="test-results" style="max-width:800px;width:calc(100% - 32px);margin:0 auto;">

            <div class="results-header">

                <div class="results-title">

                    <div class="test-config-kicker">
                        ESTUDIO DE FLASHCARDS
                    </div>

                    <h2>
                        Tema ${escaparHTML(tarjeta.tema)}
                    </h2>

                    <p>
                        Tarjeta ${flashcardIndiceActual + 1}
                        de
                        ${flashcardsActuales.length}
                    </p>

                </div>

                <button
                    type="button"
                    class="test-close-button"
                    id="cerrar-flashcards">

                    ✕

                </button>

            </div>

            <div
                style="
                    min-height:300px;
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    justify-content:center;
                    padding:30px;
                    background:#fff;
                    border:1px solid #e2e8f0;
                    border-radius:22px;
                    text-align:center;
                    box-sizing:border-box;
                    cursor:pointer;
                "
                id="flashcard-voltear">

                <span style="font-size:12px;font-weight:800;letter-spacing:.1em;color:#2563eb;margin-bottom:25px;">
                    ${etiqueta}
                </span>

                <div style="font-size:22px;line-height:1.6;color:#0f172a;white-space:pre-wrap;overflow-wrap:anywhere;">
                    ${escaparHTML(contenido)}
                </div>

                <span style="margin-top:30px;color:#64748b;font-size:13px;">
                    Toca la tarjeta para ${flashcardMostrarParteB ? "volver a la pregunta" : "ver la respuesta"}
                </span>

            </div>

            <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:22px;">

                <button
                    type="button"
                    class="navigation-button"
                    id="flashcard-anterior"
                    ${flashcardIndiceActual === 0 ? "disabled" : ""}>

                    ← Anterior

                </button>

                <button
                    type="button"
                    class="navigation-button primary"
                    id="flashcard-voltear-boton">

                    ${flashcardMostrarParteB ? "Ver parte A" : "Ver respuesta"}

                </button>

                <button
                    type="button"
                    class="navigation-button"
                    id="flashcard-siguiente"
                    ${flashcardIndiceActual === flashcardsActuales.length - 1 ? "disabled" : ""}>

                    Siguiente →

                </button>

            </div>

            <div style="text-align:center;margin-top:20px;">

                <button
                    type="button"
                    class="navigation-button"
                    id="volver-lista-flashcards">

                    Volver a las tarjetas

                </button>

            </div>

        </div>

    `;

    document.getElementById(
        "cerrar-flashcards"
    ).addEventListener("click", cerrarFlashcards);

    const voltear = () => {

        flashcardMostrarParteB = !flashcardMostrarParteB;

        mostrarTarjetaEstudio();

    };

    document.getElementById(
        "flashcard-voltear"
    ).addEventListener("click", voltear);

    document.getElementById(
        "flashcard-voltear-boton"
    ).addEventListener("click", voltear);

    const anterior = document.getElementById(
        "flashcard-anterior"
    );

    if (anterior) {

        anterior.addEventListener("click", () => {

            if (flashcardIndiceActual > 0) {

                flashcardIndiceActual--;

                flashcardMostrarParteB = false;

                mostrarTarjetaEstudio();

            }

        });

    }

    const siguiente = document.getElementById(
        "flashcard-siguiente"
    );

    if (siguiente) {

        siguiente.addEventListener("click", () => {

            if (
                flashcardIndiceActual <
                flashcardsActuales.length - 1
            ) {

                flashcardIndiceActual++;

                flashcardMostrarParteB = false;

                mostrarTarjetaEstudio();

            }

        });

    }

    document.getElementById(
        "volver-lista-flashcards"
    ).addEventListener("click", () => {

        mostrarListaFlashcards(flashcardTemaActual);

    });

}


function cerrarFlashcards() {

    const pantalla = document.getElementById(
        "flashcards-screen"
    );

    if (pantalla) pantalla.remove();

    document.body.classList.remove(
        "test-generator-active"
    );

    flashcardsActuales = [];
    flashcardTemaActual = null;
    flashcardIndiceActual = 0;
    flashcardMostrarParteB = false;

}


/* =========================================================
   EXPORTAR / IMPORTAR DATOS COMPLETOS
   ========================================================= */

(() => {

    function prepararTransferenciaDatos() {

        prepararBotonImportarEstadisticas();
        prepararBotonExportarDatos();

    }


    function prepararBotonImportarEstadisticas() {

        const boton = document.querySelector(
            '[data-route="import-statistics"]'
        );

        if (!boton) return;

        boton.addEventListener(
            "click",
            abrirSelectorImportacionCompleta
        );

    }


    function abrirSelectorImportacionCompleta() {

        const input = document.createElement("input");

        input.type = "file";
        input.accept = ".json,application/json";
        input.style.display = "none";

        document.body.appendChild(input);

        input.addEventListener("change", async () => {

            const archivo = input.files[0];

            if (!archivo) {

                input.remove();

                return;
            }

            try {

                await importarDatosCompletos(archivo);

            } catch (error) {

                console.error(
                    "Error importando datos:",
                    error
                );

                alert(
                    "No se han podido importar los datos.\n\n" +
                    error.message
                );

            } finally {

                input.remove();

            }

        });

        input.click();

    }


    async function importarDatosCompletos(archivo) {

        if (!archivo) {

            throw new Error(
                "No se ha seleccionado ningún archivo."
            );

        }

        if (
            !archivo.name.toLowerCase().endsWith(".json") &&
            archivo.type !== "application/json"
        ) {

            throw new Error(
                "El archivo seleccionado no es un JSON."
            );

        }

        const texto = await archivo.text();

        let datos;

        try {

            datos = JSON.parse(texto);

        } catch (error) {

            throw new Error(
                "El archivo no contiene un JSON válido."
            );

        }

        if (!datos || typeof datos !== "object") {

            throw new Error(
                "El archivo no tiene un formato válido."
            );

        }


        /*
         * PREGUNTAS
         */

        let preguntasImportadas = 0;

        if (Array.isArray(datos.questions)) {

            await reemplazarPreguntas(datos.questions);

            preguntasImportadas = datos.questions.length;

        }


        /*
         * ESTADÍSTICAS
         */

        const estadisticasImportadas =
            datos.estadisticas ||
            datos.statistics ||
            null;

        if (estadisticasImportadas) {

            if (
                !window.TestAppTestData ||
                typeof window.TestAppTestData.establecerEstadisticas !== "function"
            ) {

                throw new Error(
                    "La aplicación no tiene disponible la función para restaurar las estadísticas."
                );

            }

            window.TestAppTestData.establecerEstadisticas(
                estadisticasImportadas
            );

        }


        /*
         * TEST FALLADOS
         */

        if (Array.isArray(datos.testFallados)) {

            if (
                window.TestAppTestData &&
                typeof window.TestAppTestData.establecerTestFallados === "function"
            ) {

                window.TestAppTestData.establecerTestFallados(
                    datos.testFallados
                );

            }

        }


        /*
         * FLASHCARDS
         *
         * Los backups antiguos no tendrán esta propiedad.
         * Solo se restauran cuando existe un array.
         */

        let flashcardsImportadas = null;

        if (Array.isArray(datos.flashcards)) {

            await reemplazarFlashcards(datos.flashcards);

            flashcardsImportadas = datos.flashcards.length;

        }


        /*
         * COMPROBACIÓN
         */

        const preguntasActuales =
            await TestAppDB.getAllQuestions();

        const falladas =
            window.TestAppTestData &&
            typeof window.TestAppTestData.obtenerTestFallados === "function"
                ? window.TestAppTestData.obtenerTestFallados().length
                : 0;

        let mensaje =
            "Importación completada correctamente.\n\n";

        if (Array.isArray(datos.questions)) {

            mensaje +=
                "Preguntas restauradas: " +
                preguntasImportadas +
                "\n";

            mensaje +=
                "Preguntas disponibles: " +
                preguntasActuales.length +
                "\n";

        }

        if (estadisticasImportadas) {

            mensaje +=
                "Estadísticas restauradas: sí\n";

        }

        if (Array.isArray(datos.testFallados)) {

            mensaje +=
                "Preguntas falladas restauradas: " +
                falladas +
                "\n";

        }

        if (flashcardsImportadas !== null) {

            mensaje +=
                "Flashcards restauradas: " +
                flashcardsImportadas +
                "\n";

        }

        alert(mensaje);

    }


    /*
     * REEMPLAZAR PREGUNTAS
     */

    async function reemplazarPreguntas(preguntas) {

        if (!Array.isArray(preguntas)) {

            throw new Error(
                "Las preguntas importadas no son válidas."
            );

        }

        const db = await TestAppDB.openDatabase();

        return new Promise((resolve, reject) => {

            let transaction;

            try {

                transaction = db.transaction(
                    "questions",
                    "readwrite"
                );

                const store = transaction.objectStore("questions");

                store.clear();

                preguntas.forEach(pregunta => {

                    if (
                        !pregunta ||
                        pregunta.id === undefined ||
                        pregunta.id === null
                    ) {

                        throw new Error(
                            "El backup contiene una pregunta sin ID."
                        );

                    }

                    store.put(pregunta);

                });

                transaction.oncomplete = () => {

                    db.close();

                    resolve();

                };

                transaction.onerror = () => {

                    db.close();

                    reject(
                        transaction.error ||
                        new Error(
                            "No se pudieron guardar las preguntas."
                        )
                    );

                };

                transaction.onabort = () => {

                    db.close();

                    reject(
                        transaction.error ||
                        new Error(
                            "La importación de preguntas fue cancelada."
                        )
                    );

                };

            } catch (error) {

                try {
                    transaction?.abort();
                } catch (_) {}

                db.close();

                reject(error);

            }

        });

    }


    /*
     * REEMPLAZAR FLASHCARDS
     */

    async function reemplazarFlashcards(flashcards) {

        if (!Array.isArray(flashcards)) {

            throw new Error(
                "Las flashcards importadas no son válidas."
            );

        }

        const db = await TestAppDB.openDatabase();

        return new Promise((resolve, reject) => {

            let transaction;

            try {

                transaction = db.transaction(
                    "flashcards",
                    "readwrite"
                );

                const store = transaction.objectStore("flashcards");

                store.clear();

                flashcards.forEach(flashcard => {

                    if (
                        !flashcard ||
                        !Number.isInteger(Number(flashcard.tema)) ||
                        Number(flashcard.tema) < 1 ||
                        Number(flashcard.tema) > 45 ||
                        typeof flashcard.parteA !== "string" ||
                        typeof flashcard.parteB !== "string"
                    ) {

                        throw new Error(
                            "El backup contiene una flashcard no válida."
                        );

                    }

                    const registro = {

                        tema: Number(flashcard.tema),
                        parteA: flashcard.parteA,
                        parteB: flashcard.parteB

                    };

                    if (
                        flashcard.id !== undefined &&
                        flashcard.id !== null
                    ) {

                        registro.id = Number(flashcard.id);

                    }

                    store.put(registro);

                });

                transaction.oncomplete = () => {

                    db.close();

                    resolve();

                };

                transaction.onerror = () => {

                    db.close();

                    reject(
                        transaction.error ||
                        new Error(
                            "No se pudieron guardar las flashcards."
                        )
                    );

                };

                transaction.onabort = () => {

                    db.close();

                    reject(
                        transaction.error ||
                        new Error(
                            "La importación de flashcards fue cancelada."
                        )
                    );

                };

            } catch (error) {

                try {
                    transaction?.abort();
                } catch (_) {}

                db.close();

                reject(error);

            }

        });

    }


    /*
     * BOTÓN EXPORTAR
     */

    function prepararBotonExportarDatos() {

        let boton = document.querySelector(
            '[data-route="export-data"]'
        );

        if (!boton) {

            const grid = document.querySelector(".tools-grid");

            if (!grid) return;

            boton = document.createElement("button");

            boton.type = "button";
            boton.className = "tool-button";
            boton.dataset.route = "export-data";

            boton.innerHTML = `
                <span>📤</span>
                <span>Exportar datos</span>
            `;

            grid.appendChild(boton);

        }

        boton.addEventListener(
            "click",
            exportarDatosCompletos
        );

    }


    /*
     * EXPORTAR COPIA COMPLETA
     */

    async function exportarDatosCompletos() {

        try {

            const preguntas =
                await TestAppDB.getAllQuestions();


            let estadisticas = null;

            if (
                window.TestAppTestData &&
                typeof window.TestAppTestData.obtenerEstadisticas === "function"
            ) {

                estadisticas =
                    window.TestAppTestData.obtenerEstadisticas();

            }


            let testFallados = [];

            if (
                window.TestAppTestData &&
                typeof window.TestAppTestData.obtenerTestFallados === "function"
            ) {

                testFallados =
                    window.TestAppTestData.obtenerTestFallados();

            }


            /*
             * FLASHCARDS
             */

            const db = await TestAppDB.openDatabase();

            const flashcards = await new Promise((resolve, reject) => {

                const transaction = db.transaction(
                    "flashcards",
                    "readonly"
                );

                const request = transaction
                    .objectStore("flashcards")
                    .getAll();

                request.onsuccess = () => {
                    resolve(request.result || []);
                };

                request.onerror = () => {
                    reject(request.error);
                };

                transaction.oncomplete = () => {
                    db.close();
                };

                transaction.onerror = () => {
                    db.close();
                };

            });


            const datos = {

                app: "OpoTest",

                version: 2,

                exportadoEn: new Date().toISOString(),

                questions: preguntas,

                estadisticas: estadisticas,

                testFallados: testFallados,

                flashcards: flashcards

            };


            const contenido = JSON.stringify(
                datos,
                null,
                2
            );

            const blob = new Blob(
                [contenido],
                {
                    type: "application/json"
                }
            );

            const url = URL.createObjectURL(blob);

            const enlace = document.createElement("a");

            const fecha = new Date();

            const año = fecha.getFullYear();

            const mes = String(
                fecha.getMonth() + 1
            ).padStart(2, "0");

            const dia = String(
                fecha.getDate()
            ).padStart(2, "0");

            const hora = String(
                fecha.getHours()
            ).padStart(2, "0");

            const minuto = String(
                fecha.getMinutes()
            ).padStart(2, "0");

            enlace.href = url;

            enlace.download =
                `opotest-backup-${año}-${mes}-${dia}-${hora}-${minuto}.json`;

            enlace.style.display = "none";

            document.body.appendChild(enlace);

            enlace.click();

            enlace.remove();

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

            alert(
                "Datos exportados correctamente.\n\n" +
                "Preguntas: " +
                preguntas.length +
                "\n" +
                "Preguntas falladas: " +
                testFallados.length +
                "\n" +
                "Flashcards: " +
                flashcards.length
            );

        } catch (error) {

            console.error(
                "Error exportando datos:",
                error
            );

            alert(
                "No se han podido exportar los datos.\n\n" +
                error.message
            );

        }

    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            prepararTransferenciaDatos
        );

    } else {

        prepararTransferenciaDatos();

    }

})();


/* =========================================================
   UTILIDAD HTML
   ========================================================= */

function escaparHTML(texto) {

    if (
        texto === null ||
        texto === undefined
    ) {

        return "";

    }

    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}