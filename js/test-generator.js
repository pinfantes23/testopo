(() => {


    /* =========================================================
       BLOQUES DE TEMAS
       ========================================================= */

    const BLOQUES = {

        juridicas: {
            nombre: "Jurídicas",
            icono: "⚖️",
            desde: 1,
            hasta: 26
        },

        cientificas: {
            nombre: "Científicas",
            icono: "🔬",
            desde: 38,
            hasta: 45
        },

        tecnologicas: {
            nombre: "Tecnológicas",
            icono: "💻",
            desde: 27,
            hasta: 37
        }

    };


    const CANTIDADES = [
        10,
        20,
        30,
        50,
        70,
        100
    ];


    /* =========================================================
       ESTADO
       ========================================================= */

    let preguntas = [];

    let examen = [];

    let respuestas = {};

    let riesgos = {};

    let pagina = 0;

    let cantidad = 10;

    let temasSeleccionados = [];


    /* =========================================================
       TEST FALLADOS
       ========================================================= */

    let testFallados = [];


    /* =========================================================
       ESTADÍSTICAS
       ========================================================= */

    let estadisticas = {

        testsRealizados: 0,

        totalPreguntas: 0,

        respondidas: 0,

        aciertos: 0,

        fallos: 0,

        blancas: 0,

        aciertosRiesgo: 0,

        fallosRiesgo: 0,

        porTema: {}

    };


    /* =========================================================
       UTILIDADES
       ========================================================= */

    const porId = id =>
        document.getElementById(id);


    function mezclar(lista) {

        const resultado =
            [...lista];


        for (
            let i = resultado.length - 1;
            i > 0;
            i--
        ) {

            const j =
                Math.floor(
                    Math.random() *
                    (i + 1)
                );


            [
                resultado[i],
                resultado[j]
            ] = [
                resultado[j],
                resultado[i]
            ];

        }


        return resultado;

    }


    function escapar(texto) {

        return String(
            texto ?? ""
        ).replace(
            /[&<>"']/g,
            caracter => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[caracter]
        );

    }


    /* =========================================================
       ESTADÍSTICAS
       ========================================================= */

    function obtenerNombreTema(tema) {

        if (
            tema === undefined ||
            tema === null ||
            String(tema).trim() === ""
        ) {

            return "Sin tema";

        }


        return String(tema);

    }


    function crearEstadisticasTema() {

        return {

            total: 0,

            respondidas: 0,

            aciertos: 0,

            fallos: 0,

            blancas: 0,

            aciertosRiesgo: 0,

            fallosRiesgo: 0

        };

    }


    function registrarEstadisticaPregunta(
        item
    ) {

        if (
            !item ||
            !item.pregunta
        ) {

            return;

        }


        const respuesta =
            item.respuesta || null;


        const acertada =
            Boolean(
                respuesta
            ) &&
            Boolean(
                item.acertada
            );


        const riesgo =
            Boolean(
                item.riesgo
            );


        const tema =
            obtenerNombreTema(
                item.pregunta.tema
            );


        if (
            !estadisticas.porTema[tema]
        ) {

            estadisticas.porTema[tema] =
                crearEstadisticasTema();

        }


        const datosTema =
            estadisticas.porTema[tema];


        /*
         * Toda pregunta entra en el total.
         */

        estadisticas.totalPreguntas++;

        datosTema.total++;


        /*
         * En blanco.
         */

        if (!respuesta) {

            estadisticas.blancas++;

            datosTema.blancas++;

            return;

        }


        /*
         * Pregunta respondida.
         */

        estadisticas.respondidas++;

        datosTema.respondidas++;


        /*
         * Acierto / fallo.
         */

        if (acertada) {

            estadisticas.aciertos++;

            datosTema.aciertos++;


            if (riesgo) {

                estadisticas.aciertosRiesgo++;

                datosTema.aciertosRiesgo++;

            }

        } else {

            estadisticas.fallos++;

            datosTema.fallos++;


            if (riesgo) {

                estadisticas.fallosRiesgo++;

                datosTema.fallosRiesgo++;

            }

        }

    }


    function registrarEstadisticasTest(
        detalle
    ) {

        if (!Array.isArray(detalle)) {
            return;
        }


        estadisticas.testsRealizados++;


        detalle.forEach(
            registrarEstadisticaPregunta
        );

    }


    function obtenerEstadisticas() {

        return JSON.parse(
            JSON.stringify(
                estadisticas
            )
        );

    }


    /* =========================================================
       TEST FALLADOS
       ========================================================= */

    function normalizarId(id) {

        return String(id);

    }


    function registrarPreguntaFallada(id) {

        const clave =
            normalizarId(id);


        const existe =
            testFallados.some(
                item =>
                    normalizarId(item) ===
                    clave
            );


        if (!existe) {

            testFallados.push(id);

        }

    }


    function eliminarPreguntaFallada(id) {

        const clave =
            normalizarId(id);


        testFallados =
            testFallados.filter(
                item =>
                    normalizarId(item) !==
                    clave
            );

    }


    function moverPreguntaFalladaAlFinal(
        id
    ) {

        eliminarPreguntaFallada(id);

        testFallados.push(id);

    }


    function registrarResultadoPregunta({

    id,

    respuesta,

    acertada,

    tema = null,

    riesgo = false,

    registrarEstadistica = true

}) {

    if (!respuesta) {
        return;
    }


    /*
     * Actualizamos Test fallados.
     */

    if (acertada) {

        eliminarPreguntaFallada(id);

    } else {

        moverPreguntaFalladaAlFinal(id);

    }


    /*
     * También guardamos esta respuesta
     * en las estadísticas, salvo cuando
     * se indique que no debe registrarse.
     */

    if (registrarEstadistica) {

        registrarEstadisticaPregunta({

            pregunta: {
                id,
                tema
            },

            respuesta,

            acertada,

            riesgo

        });

    }

}


    function actualizarTestFallados(
        detalle
    ) {

        detalle.forEach(
            item => {

                /*
                 * En blanco no modifica
                 * Test fallados.
                 */

                if (!item.respuesta) {
                    return;
                }


                if (item.acertada) {

                    eliminarPreguntaFallada(
                        item.pregunta.id
                    );

                } else {

                    registrarPreguntaFallada(
                        item.pregunta.id
                    );

                }

            }
        );

    }


    /* =========================================================
       CONTENEDOR
       ========================================================= */

    function crearContenedor() {

        let contenedor =
            porId(
                "test-generator-screen"
            );


        if (!contenedor) {

            contenedor =
                document.createElement(
                    "div"
                );


            contenedor.id =
                "test-generator-screen";


            document.body.appendChild(
                contenedor
            );

        }


        contenedor.className =
            "test-overlay";


        return contenedor;

    }


    function mostrar(html) {

        crearContenedor().innerHTML =
            html;

    }


    /* =========================================================
       ABRIR TEST A LA CARTA
       ========================================================= */

    async function abrir() {

        preguntas =
            await TestAppDB.getAllQuestions();


        if (!preguntas.length) {

            alert(
                "Todavía no hay preguntas importadas."
            );

            return;

        }


        document.body.classList.add(
            "test-generator-active"
        );


        mostrarConfiguracion();

    }


    /* =========================================================
       CONFIGURACIÓN
       ========================================================= */

    function mostrarConfiguracion() {

        const bloquesHTML =
            Object.entries(BLOQUES)
                .map(
                    ([clave, bloque]) =>
                        crearBloqueTema(
                            clave,
                            bloque
                        )
                )
                .join("");


        mostrar(`

            <div class="test-config">

                <div class="test-config-header">

                    <div>

                        <div class="test-config-kicker">
                            TEST A LA CARTA
                        </div>

                        <h2>
                            Configura tu test
                        </h2>

                        <p>
                            Selecciona los temas que quieras practicar.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="test-close-button"
                        id="cerrar-test-config">

                        ✕

                    </button>

                </div>


                <section class="test-config-section">

                    <div class="test-section-title">

                        <h3>
                            Temas
                        </h3>

                        <p>
                            Abre un bloque para seleccionar sus temas.
                        </p>

                    </div>


                    <div class="temas-container">

                        ${bloquesHTML}

                    </div>

                </section>


                <section class="test-config-section">

                    <div class="test-section-title">

                        <h3>
                            Número de preguntas
                        </h3>

                    </div>


                    <div class="cantidad-grid">

                        ${CANTIDADES.map(
                            numero => `

                            <button
                                type="button"
                                class="cantidad-button ${
                                    numero === cantidad
                                        ? "selected"
                                        : ""
                                }"
                                data-cantidad="${numero}">

                                ${numero}

                            </button>

                        `
                        ).join("")}

                    </div>


                    <div class="cantidad-info">

                        <span id="cantidad-seleccionada">

                            ${cantidad} preguntas

                        </span>

                    </div>

                </section>


                <div class="test-config-footer">

                    <button
                        type="button"
                        class="test-primary-button"
                        id="crear-test">

                        Crear test

                    </button>

                </div>

            </div>

        `);


        prepararEventosConfiguracion();

        actualizarConfiguracion();

    }


    /* =========================================================
       CREAR BLOQUE
       ========================================================= */

    function crearBloqueTema(
        id,
        bloque
    ) {

        const temas =
            obtenerTemasDelBloque(
                bloque
            );


        return `

            <div
                class="tema-bloque"
                data-bloque="${id}">


                <button
                    type="button"
                    class="tema-bloque-header"
                    data-toggle-bloque="${id}"
                    aria-expanded="false">

                    <span>

                        ${bloque.icono}

                        ${escapar(
                            bloque.nombre
                        )}

                    </span>

                </button>


                <div
                    class="tema-bloque-contenido"
                    data-contenido-bloque="${id}"
                    style="display:none;">


                    <div class="tema-bloque-actions">

                        <button
                            type="button"
                            class="test-secondary-button"
                            data-marcar-bloque="${id}">

                            Marcar todos

                        </button>

                    </div>


                    <div class="tema-grid">

                        ${temas.map(
                            tema => `

                            <label
                                class="tema-card"
                                data-tarjeta-tema="${tema}">


                                <input
                                    type="checkbox"
                                    class="tema-checkbox"
                                    data-tema="${tema}"
                                    value="${tema}">


                                <span class="tema-card-content">

                                    <span class="tema-number">

                                        ${tema}

                                    </span>


                                    <span class="tema-text">

                                        <strong>
                                            Tema ${tema}
                                        </strong>

                                        <small>
                                            ${contarPreguntasTema(tema)}
                                            preguntas
                                        </small>

                                    </span>


                                    <span class="tema-check">

                                        ✓

                                    </span>

                                </span>

                            </label>

                        `).join("")}

                    </div>

                </div>

            </div>

        `;

    }


    /* =========================================================
       CONTAR PREGUNTAS DE UN TEMA
       ========================================================= */

    function contarPreguntasTema(
        tema
    ) {

        return preguntas.filter(
            pregunta =>
                String(
                    pregunta.tema
                ) ===
                String(tema)
        ).length;

    }


    /* =========================================================
       OBTENER TEMAS
       ========================================================= */

    function obtenerTemasDelBloque(
        bloque
    ) {

        const temas =
            new Set();


        for (
            let i = bloque.desde;
            i <= bloque.hasta;
            i++
        ) {

            temas.add(
                String(i)
            );

        }


        preguntas.forEach(
            pregunta => {

                if (
                    pregunta.tema === undefined ||
                    pregunta.tema === null
                ) {

                    return;

                }


                const numero =
                    parseInt(
                        pregunta.tema,
                        10
                    );


                if (
                    Number.isInteger(numero) &&
                    numero >= bloque.desde &&
                    numero <= bloque.hasta
                ) {

                    temas.add(
                        String(numero)
                    );

                }

            }
        );


        return [
            ...temas
        ].sort(
            (a, b) =>
                Number(a) -
                Number(b)
        );

    }


    /* =========================================================
       EVENTOS CONFIGURACIÓN
       ========================================================= */

    function prepararEventosConfiguracion() {

        const cerrar =
            porId(
                "cerrar-test-config"
            );


        if (cerrar) {

            cerrar.addEventListener(
                "click",
                cerrarConfiguracion
            );

        }


        document
            .querySelectorAll(
                "[data-toggle-bloque]"
            )
            .forEach(
                boton => {

                    boton.addEventListener(
                        "click",
                        evento => {

                            evento.preventDefault();

                            alternarBloque(
                                boton.dataset
                                    .toggleBloque
                            );

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                "[data-marcar-bloque]"
            )
            .forEach(
                boton => {

                    boton.addEventListener(
                        "click",
                        evento => {

                            evento.preventDefault();

                            evento.stopPropagation();


                            const clave =
                                boton.dataset
                                    .marcarBloque;


                            const bloque =
                                BLOQUES[clave];


                            if (!bloque) {
                                return;
                            }


                            const checkboxes =
                                [
                                    ...document.querySelectorAll(
                                        `[data-contenido-bloque="${clave}"] .tema-checkbox`
                                    )
                                ];


                            const todosMarcados =
                                checkboxes.length > 0 &&
                                checkboxes.every(
                                    checkbox =>
                                        checkbox.checked
                                );


                            checkboxes.forEach(
                                checkbox => {

                                    checkbox.checked =
                                        !todosMarcados;

                                    actualizarAspectoTema(
                                        checkbox
                                    );

                                }
                            );


                            boton.textContent =
                                todosMarcados
                                    ? "Marcar todos"
                                    : "Desmarcar todos";


                            actualizarConfiguracion();

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                ".tema-checkbox"
            )
            .forEach(
                checkbox => {

                    checkbox.addEventListener(
                        "change",
                        () => {

                            actualizarAspectoTema(
                                checkbox
                            );

                            actualizarConfiguracion();

                        }
                    );


                    actualizarAspectoTema(
                        checkbox
                    );

                }
            );


        document
            .querySelectorAll(
                "[data-cantidad]"
            )
            .forEach(
                boton => {

                    boton.addEventListener(
                        "click",
                        () => {

                            cantidad =
                                Number(
                                    boton.dataset
                                        .cantidad
                                );


                            document
                                .querySelectorAll(
                                    "[data-cantidad]"
                                )
                                .forEach(
                                    item =>
                                        item.classList.remove(
                                            "selected"
                                        )
                                );


                            boton.classList.add(
                                "selected"
                            );


                            const info =
                                porId(
                                    "cantidad-seleccionada"
                                );


                            if (info) {

                                info.textContent =
                                    `${cantidad} preguntas`;

                            }

                        }
                    );

                }
            );


        const crear =
            porId(
                "crear-test"
            );


        if (crear) {

            crear.addEventListener(
                "click",
                comenzarTest
            );

        }

    }


    /* =========================================================
       ASPECTO TEMA
       ========================================================= */

    function actualizarAspectoTema(
        checkbox
    ) {

        if (!checkbox) {
            return;
        }


        const tarjeta =
            checkbox.closest(
                ".tema-card"
            );


        if (!tarjeta) {
            return;
        }


        tarjeta.classList.toggle(
            "selected",
            checkbox.checked
        );


        tarjeta.classList.toggle(
            "is-selected",
            checkbox.checked
        );


        tarjeta.setAttribute(
            "aria-checked",
            checkbox.checked
                ? "true"
                : "false"
        );

    }


    /* =========================================================
       ABRIR / CERRAR BLOQUE
       ========================================================= */

    function alternarBloque(
        id
    ) {

        const bloque =
            document.querySelector(
                `[data-bloque="${id}"]`
            );


        if (!bloque) {
            return;
        }


        const cabecera =
            bloque.querySelector(
                "[data-toggle-bloque]"
            );


        const contenido =
            bloque.querySelector(
                `[data-contenido-bloque="${id}"]`
            );


        if (
            !cabecera ||
            !contenido
        ) {

            return;
        }


        const abierto =
            cabecera.getAttribute(
                "aria-expanded"
            ) ===
            "true";


        const nuevoEstado =
            !abierto;


        cabecera.setAttribute(
            "aria-expanded",
            String(nuevoEstado)
        );


        contenido.style.display =
            nuevoEstado
                ? "block"
                : "none";

    }


    /* =========================================================
       ACTUALIZAR CONFIGURACIÓN
       ========================================================= */

    function actualizarConfiguracion() {

        temasSeleccionados =
            [
                ...document.querySelectorAll(
                    ".tema-checkbox:checked"
                )
            ].map(
                checkbox =>
                    String(
                        checkbox.dataset.tema
                    )
            );


        document
            .querySelectorAll(
                ".tema-checkbox"
            )
            .forEach(
                actualizarAspectoTema
            );


        const disponibles =
            temasSeleccionados.length
                ? preguntas.filter(
                    pregunta =>
                        temasSeleccionados.includes(
                            String(
                                pregunta.tema
                            )
                        )
                ).length
                : preguntas.length;


        const cantidadReal =
            Math.min(
                cantidad,
                disponibles
            );


        const cantidadInfo =
            porId(
                "cantidad-seleccionada"
            );


        if (cantidadInfo) {

            cantidadInfo.textContent =
                disponibles
                    ? `${cantidadReal} preguntas`
                    : "0 preguntas";

        }


        document
            .querySelectorAll(
                "[data-marcar-bloque]"
            )
            .forEach(
                boton => {

                    const clave =
                        boton.dataset
                            .marcarBloque;


                    const checkboxes =
                        [
                            ...document.querySelectorAll(
                                `[data-contenido-bloque="${clave}"] .tema-checkbox`
                            )
                        ];


                    const todos =
                        checkboxes.length > 0 &&
                        checkboxes.every(
                            checkbox =>
                                checkbox.checked
                        );


                    boton.textContent =
                        todos
                            ? "Desmarcar todos"
                            : "Marcar todos";

                }
            );

    }


    /* =========================================================
       COMENZAR TEST
       ========================================================= */

    function comenzarTest() {

        let disponibles;


        if (
            temasSeleccionados.length
        ) {

            disponibles =
                preguntas.filter(
                    pregunta =>
                        temasSeleccionados.includes(
                            String(
                                pregunta.tema
                            )
                        )
                );

        } else {

            disponibles =
                [...preguntas];

        }


        if (!disponibles.length) {

            alert(
                "No hay preguntas disponibles para los temas seleccionados."
            );

            return;
        }


        const cantidadReal =
            Math.min(
                cantidad,
                disponibles.length
            );


        examen =
            mezclar(
                disponibles
            ).slice(
                0,
                cantidadReal
            );


        respuestas = {};

        riesgos = {};

        pagina = 0;


        mostrarPregunta();

    }


    /* =========================================================
       MOSTRAR PREGUNTA
       ========================================================= */

    function mostrarPregunta() {

        const pregunta =
            examen[pagina];


        if (!pregunta) {
            return;
        }


        const respuesta =
            respuestas[
                pregunta.id
            ] ?? null;


        const porcentaje =
            (
                (pagina + 1) /
                examen.length
            ) * 100;


        const opciones = [

            {
                letra: "A",
                texto:
                    pregunta.respuesta_a
            },

            {
                letra: "B",
                texto:
                    pregunta.respuesta_b
            },

            {
                letra: "C",
                texto:
                    pregunta.respuesta_c
            }

        ];


        mostrar(`

            <div class="test-running">

                <div class="test-running-header">

                    <button
                        type="button"
                        class="test-icon-button"
                        id="cerrar-test-running">

                        ←

                    </button>


                    <div class="test-running-progress">

                        <span>
                            Pregunta
                            ${pagina + 1}
                            de
                            ${examen.length}
                        </span>


                        <div class="progress-track">

                            <div
                                class="progress-value"
                                style="width:${porcentaje}%">
                            </div>

                        </div>

                    </div>

                </div>


                <div class="question-container">

                    <div class="question-meta">

                        <span>
                            Tema
                            ${escapar(
                                pregunta.tema
                            )}
                        </span>

                    </div>


                    <div class="question-card">

                        <h2>
                            ${escapar(
                                pregunta.enunciado
                            )}
                        </h2>

                    </div>


                    <div class="answers-container">

                        ${opciones.map(
                            opcion => `

                            <button
                                type="button"
                                class="answer-button ${
                                    respuesta === opcion.letra
                                        ? "selected"
                                        : ""
                                }"
                                data-respuesta="${opcion.letra}">

                                <span class="answer-letter">
                                    ${opcion.letra}
                                </span>

                                <span class="answer-text">
                                    ${escapar(
                                        opcion.texto
                                    )}
                                </span>

                            </button>

                        `
                        ).join("")}

                    </div>


                    <div
                        class="risk-container ${
                            respuesta
                                ? "visible"
                                : ""
                        }">

                        ${
                            respuesta
                                ? `

                                    <button
                                        type="button"
                                        class="risk-button ${
                                            riesgos[
                                                pregunta.id
                                            ]
                                                ? "active"
                                                : ""
                                        }"
                                        id="marcar-riesgo">

                                        ⚠️

                                        ${
                                            riesgos[
                                                pregunta.id
                                            ]
                                                ? "Marcada como riesgo"
                                                : "Marcar como riesgo"
                                        }

                                    </button>

                                `
                                : ""
                        }

                    </div>

                </div>


                <div class="test-navigation">

                    <button
                        type="button"
                        class="navigation-button secondary"
                        id="pregunta-anterior"
                        ${
                            pagina === 0
                                ? "disabled"
                                : ""
                        }>

                        Anterior

                    </button>


                    <button
                        type="button"
                        class="navigation-button primary"
                        id="pregunta-siguiente">

                        ${
                            pagina ===
                            examen.length - 1
                                ? "Finalizar"
                                : "Siguiente"
                        }

                    </button>

                </div>

            </div>

        `);


        document
            .querySelectorAll(
                "[data-respuesta]"
            )
            .forEach(
                boton => {

                    boton.addEventListener(
                        "click",
                        () => {

                            const nuevaRespuesta =
                                boton.dataset
                                    .respuesta;


                            if (
                                respuestas[
                                    pregunta.id
                                ] ===
                                nuevaRespuesta
                            ) {

                                delete respuestas[
                                    pregunta.id
                                ];

                                delete riesgos[
                                    pregunta.id
                                ];

                            } else {

                                respuestas[
                                    pregunta.id
                                ] =
                                    nuevaRespuesta;

                            }


                            mostrarPregunta();

                        }
                    );

                }
            );


        const riesgo =
            porId(
                "marcar-riesgo"
            );


        if (riesgo) {

            riesgo.addEventListener(
                "click",
                () => {

                    if (
                        !respuestas[
                            pregunta.id
                        ]
                    ) {

                        return;
                    }


                    riesgos[
                        pregunta.id
                    ] =
                        !riesgos[
                            pregunta.id
                        ];


                    mostrarPregunta();

                }
            );

        }


        const anterior =
            porId(
                "pregunta-anterior"
            );


        if (anterior) {

            anterior.addEventListener(
                "click",
                () => {

                    if (pagina > 0) {

                        pagina--;

                        mostrarPregunta();

                    }

                }
            );

        }


        const siguiente =
            porId(
                "pregunta-siguiente"
            );


        if (siguiente) {

            siguiente.addEventListener(
                "click",
                () => {

                    if (
                        pagina ===
                        examen.length - 1
                    ) {

                        finalizar();

                    } else {

                        pagina++;

                        mostrarPregunta();

                    }

                }
            );

        }


        const cerrarTest =
            porId(
                "cerrar-test-running"
            );


        if (cerrarTest) {

            cerrarTest.addEventListener(
                "click",
                cerrar
            );

        }

    }


    /* =========================================================
       NOTA
       ========================================================= */
function calcularNota(
    aciertos,
    fallos,
    total
) {

    if (!total) {
        return 0;
    }

    const nota =
        (
            (
                aciertos -
                (fallos / 2)
            ) /
            total
        ) *
        10;

    return Math.max(
        0,
        nota
    );

}


    /* =========================================================
       FINALIZAR
       ========================================================= */

    function finalizar() {

        const detalle =
            examen.map(
                pregunta => {

                    const respuesta =
                        respuestas[
                            pregunta.id
                        ] ?? null;


                    const correcta =
                        pregunta.respuesta_correcta;


                    const acertada =
                        Boolean(
                            respuesta
                        ) &&
                        String(
                            respuesta
                        ).toUpperCase() ===
                        String(
                            correcta
                        ).toUpperCase();


                    return {

                        pregunta,

                        respuesta,

                        correcta,

                        acertada,

                        riesgo:
                            Boolean(
                                riesgos[
                                    pregunta.id
                                ]
                            )

                    };

                }
            );


        /*
         * Test fallados.
         */

        actualizarTestFallados(
            detalle
        );


        /*
         * Estadísticas acumuladas.
         */

        registrarEstadisticasTest(
            detalle
        );


        const respondidas =
            detalle.filter(
                item =>
                    Boolean(
                        item.respuesta
                    )
            );


        const aciertos =
            respondidas.filter(
                item =>
                    item.acertada
            ).length;


        const fallos =
            respondidas.filter(
                item =>
                    !item.acertada
            ).length;


        const blancas =
            detalle.filter(
                item =>
                    !item.respuesta
            ).length;


        const aciertosRiesgo =
            detalle.filter(
                item =>
                    item.riesgo &&
                    item.acertada
            ).length;


        const fallosRiesgo =
            detalle.filter(
                item =>
                    item.riesgo &&
                    item.respuesta &&
                    !item.acertada
            ).length;


        const nota = 
            calcularNota( 
                aciertos, 
                fallos, 
                detalle.length 
            ); 


        const aciertosSinRiesgo =
            aciertos -
            aciertosRiesgo;


        const fallosSinRiesgo =
            fallos -
            fallosRiesgo;


       const notaConRiesgo =
            calcularNota(
                aciertosSinRiesgo,
                fallosSinRiesgo,
                detalle.length
            );

        mostrarResultados({

            detalle,

            aciertos,

            fallos,

            blancas,

            aciertosRiesgo,

            fallosRiesgo,

            nota,

            notaConRiesgo

        });

    }


    /* =========================================================
       RESULTADOS
       ========================================================= */

    function mostrarResultados(
        resultado
    ) {

        const {

            detalle,

            aciertos,

            fallos,

            blancas,

            aciertosRiesgo,

            fallosRiesgo,

            nota,

            notaConRiesgo

        } = resultado;


        mostrar(`

            <div class="test-results">

                <div class="results-header">

                    <div class="results-title">

                        <span class="test-config-kicker">
                            TEST FINALIZADO
                        </span>

                        <h2>
                            Resultado
                        </h2>

                        <p>
                            Revisa tus respuestas y comprueba tu rendimiento.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="test-close-button"
                        id="cerrar-test-resultados">

                        ×

                    </button>

                </div>


                <div class="results-score-card">

                    <div class="results-score-main">

                        <span>
                            NOTA
                        </span>

                        <strong>
                            ${notaConRiesgo.toFixed(2)}
                        </strong>

                        <small>
                            sobre 10
                        </small>

                    </div>


                    <div class="results-stat-grid">

                        <div class="result-stat correct">

                            <strong>
                                ${aciertos}
                            </strong>

                            <span>
                                Aciertos
                            </span>

                        </div>


                        <div class="result-stat incorrect">

                            <strong>
                                ${fallos}
                            </strong>

                            <span>
                                Fallos
                            </span>

                        </div>


                        <div class="result-stat blank">

                            <strong>
                                ${blancas}
                            </strong>

                            <span>
                                En blanco
                            </span>

                        </div>


                        <div class="result-stat risk-correct">

                            <strong>
                                ${aciertosRiesgo}
                            </strong>

                            <span>
                                Aciertos con riesgo
                            </span>

                        </div>


                        <div class="result-stat risk-incorrect">

                            <strong>
                                ${fallosRiesgo}
                            </strong>

                            <span>
                                Fallos con riesgo
                            </span>

                        </div>


                        <div class="result-stat">

                            <strong>
                               ${nota.toFixed(2)}
                            </strong>

                            <span>
                                Nota sin riesgos
                            </span>

                        </div>

                    </div>

                </div>


                <div class="results-questions">

                    <div class="results-section-heading">

                        <div>

                            <span>
                                RESUMEN
                            </span>

                            <h3>
                                Preguntas
                            </h3>

                            <p>
                                Pulsa sobre una pregunta para revisarla.
                            </p>

                        </div>

                    </div>


                    <div class="results-grid">

                        ${detalle.map(
                            (item, indice) => {

                                let clase =
                                    "result-question ";

                                if (!item.respuesta) {

                                    clase +=
                                        "blank";

                                } else if (
                                    item.acertada
                                ) {

                                    clase +=
                                        "correct";

                                } else {

                                    clase +=
                                        "incorrect";

                                }


                                return `

                                    <button
                                        type="button"
                                        class="${clase}"
                                        data-revision="${indice}">

                                        ${indice + 1}

                                        ${
                                            item.riesgo
                                                ? "<b>!</b>"
                                                : ""
                                        }

                                    </button>

                                `;

                            }
                        ).join("")}

                    </div>


                    <div class="results-legend">

                        <span class="legend-correct">

                            <i></i>

                            Acierto

                        </span>


                        <span class="legend-incorrect">

                            <i></i>

                            Fallo

                        </span>


                        <span class="legend-blank">

                            <i></i>

                            En blanco

                        </span>


                        <span class="legend-risk">

                            ⚠ Riesgo

                        </span>

                    </div>

                </div>


                <div class="results-review">

                    <div
                        id="revision-container"
                        class="results-review-card">
                    </div>

                </div>


                <div class="results-navigation">

                    <button
                        type="button"
                        class="navigation-button secondary"
                        id="revision-anterior"
                        disabled>

                        Anterior

                    </button>


                    <span id="contador-revision">

                        Pregunta 1 de ${detalle.length}

                    </span>


                    <button
                        type="button"
                        class="navigation-button primary"
                        id="revision-siguiente"
                        ${
                            detalle.length <= 1
                                ? "disabled"
                                : ""
                        }>

                        Siguiente

                    </button>

                </div>


                <div class="results-footer">

                    <button
                        type="button"
                        class="navigation-button primary"
                        id="volver-inicio-test">

                        Volver al inicio

                    </button>

                </div>

            </div>

        `);


        let indiceRevision = 0;


        function actualizarRevision() {

            const revision =
                porId(
                    "revision-container"
                );


            if (!revision) {
                return;
            }


            revision.innerHTML =
                renderRevision(
                    detalle,
                    indiceRevision
                );


            const contador =
                porId(
                    "contador-revision"
                );


            if (contador) {

                contador.textContent =
                    `Pregunta ${
                        indiceRevision + 1
                    } de ${detalle.length}`;

            }


            const anterior =
                porId(
                    "revision-anterior"
                );


            const siguiente =
                porId(
                    "revision-siguiente"
                );


            if (anterior) {

                anterior.disabled =
                    indiceRevision === 0;

            }


            if (siguiente) {

                siguiente.disabled =
                    indiceRevision ===
                    detalle.length - 1;

            }


            document
                .querySelectorAll(
                    "[data-revision]"
                )
                .forEach(
                    boton => {

                        boton.addEventListener(
                            "click",
                            () => {

                                indiceRevision =
                                    Number(
                                        boton.dataset
                                            .revision
                                    );

                                actualizarRevision();

                            }
                        );

                    }
                );

        }


        const revisionAnterior =
            porId(
                "revision-anterior"
            );


        if (revisionAnterior) {

            revisionAnterior.addEventListener(
                "click",
                () => {

                    if (
                        indiceRevision > 0
                    ) {

                        indiceRevision--;

                        actualizarRevision();

                    }

                }
            );

        }


        const revisionSiguiente =
            porId(
                "revision-siguiente"
            );


        if (revisionSiguiente) {

            revisionSiguiente.addEventListener(
                "click",
                () => {

                    if (
                        indiceRevision <
                        detalle.length - 1
                    ) {

                        indiceRevision++;

                        actualizarRevision();

                    }

                }
            );

        }


        const volver =
            porId(
                "volver-inicio-test"
            );


        if (volver) {

            volver.addEventListener(
                "click",
                cerrar
            );

        }


        const cerrarResultados =
            porId(
                "cerrar-test-resultados"
            );


        if (cerrarResultados) {

            cerrarResultados.addEventListener(
                "click",
                cerrar
            );

        }


        actualizarRevision();

    }


    /* =========================================================
       REVISIÓN
       ========================================================= */

    function renderRevision(
        detalle,
        indice
    ) {

        const item =
            detalle[indice];


        if (!item) {
            return "";
        }


        let claseEstado =
            "blank";


        let estadoTexto =
            "En blanco";


        if (item.respuesta) {

            if (item.acertada) {

                claseEstado =
                    "correct";

                estadoTexto =
                    "Correcta";

            } else {

                claseEstado =
                    "incorrect";

                estadoTexto =
                    "Incorrecta";

            }

        }


        const opciones = [

            {
                letra: "A",
                texto:
                    item.pregunta.respuesta_a
            },

            {
                letra: "B",
                texto:
                    item.pregunta.respuesta_b
            },

            {
                letra: "C",
                texto:
                    item.pregunta.respuesta_c
            }

        ];


        return `

            <div class="review-top">

                <div>

                    <span class="review-kicker">
                        PREGUNTA ${indice + 1}
                    </span>

                    <span class="review-topic">
                        Tema ${escapar(
                            item.pregunta.tema
                        )}
                    </span>

                </div>


                <span
                    class="review-status ${claseEstado}">

                    ${estadoTexto}

                </span>

            </div>


            <h3>
                ${escapar(
                    item.pregunta.enunciado
                )}
            </h3>


            <div class="review-options">

                ${opciones.map(
                    opcion => {

                        const esCorrecta =
                            opcion.letra ===
                            item.correcta;


                        const esRespuesta =
                            opcion.letra ===
                            item.respuesta;


                        let clase =
                            "review-option";


                        let etiqueta =
                            "";


                        if (esCorrecta) {

                            clase +=
                                " correct-answer";

                            etiqueta =
                                "CORRECTA";

                        } else if (
                            esRespuesta
                        ) {

                            clase +=
                                " wrong-answer";

                            etiqueta =
                                "TU RESPUESTA";

                        }


                        return `

                            <div
                                class="${clase}">

                                <strong>
                                    ${opcion.letra}
                                </strong>


                                <span>
                                    ${escapar(
                                        opcion.texto
                                    )}
                                </span>


                                ${
                                    etiqueta
                                        ? `

                                            <em>
                                                ${etiqueta}
                                            </em>

                                          `
                                        : ""
                                }

                            </div>

                        `;

                    }
                ).join("")}

            </div>

        `;

    }


    /* =========================================================
       CERRAR
       ========================================================= */

    function cerrarConfiguracion() {

        const contenedor =
            porId(
                "test-generator-screen"
            );


        if (contenedor) {
            contenedor.remove();
        }


        document.body.classList.remove(
            "test-generator-active"
        );

    }


    function cerrar() {

        const contenedor =
            porId(
                "test-generator-screen"
            );


        if (contenedor) {
            contenedor.remove();
        }


        document.body.classList.remove(
            "test-generator-active"
        );

    }


    /* =========================================================
       API TEST FALLADOS + ESTADÍSTICAS
       ========================================================= */

    window.TestAppTestData = {

    obtenerTestFallados() {
        return [
            ...testFallados
        ];
    },

    establecerTestFallados(lista) {

        testFallados = [];

        if (!Array.isArray(lista)) {
            return;
        }

        lista.forEach(id => {
            registrarPreguntaFallada(id);
        });
    },

    obtenerEstadisticas() {

        return JSON.parse(
            JSON.stringify(
                estadisticas
            )
        );
    },

    establecerEstadisticas(datos) {

        if (!datos || typeof datos !== "object") {
            throw new Error(
                "Las estadísticas importadas no son válidas."
            );
        }

        estadisticas =
            JSON.parse(
                JSON.stringify(datos)
            );
    },

    registrarResultadoPregunta

};

    /* =========================================================
       API TEST GENERATOR
       ========================================================= */

    window.TestAppTestGenerator = {

        abrir

    };


})();