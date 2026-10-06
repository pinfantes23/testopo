document.addEventListener("DOMContentLoaded", () => {

    console.log("Test App iniciada");

    registrarServiceWorker();

    actualizarEstadoConexion();

    prepararImportador();

    prepararTestALaCarta();

});


function registrarServiceWorker() {

    if ("serviceWorker" in navigator) {

        window.addEventListener("load", () => {

            navigator.serviceWorker
                .register("./sw.js")
                .then(() => {
                    console.log(
                        "Service Worker registrado correctamente."
                    );
                })
                .catch(error => {
                    console.error(
                        "Error registrando Service Worker:",
                        error
                    );
                });

        });

    }

}


function actualizarEstadoConexion() {

    const estado = document.getElementById("connection-status");

    if (!estado) {
        console.warn("No se encontró #connection-status.");
        return;
    }

    function actualizar() {

        if (navigator.onLine) {

            estado.textContent =
                "Conexión disponible. La aplicación también funciona offline.";

        } else {

            estado.textContent =
                "Modo offline. La aplicación funciona sin conexión.";

        }

    }

    actualizar();

    window.addEventListener("online", actualizar);

    window.addEventListener("offline", actualizar);
}


function prepararImportador() {

    const botonImportar =
        document.querySelector('[data-route="import"]');

    if (!botonImportar) {
        console.warn(
            "No se encontró el botón Importar test."
        );
        return;
    }

    botonImportar.addEventListener("click", () => {

        abrirSelectorArchivo();

    });

}


function abrirSelectorArchivo() {

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

            const resultado =
                await TestAppImporter.importarTestDesdeArchivo(
                    archivo
                );

            alert(
                "Importación completada.\n\n" +
                "Preguntas importadas: " +
                resultado.importadas +
                "\n" +
                "Preguntas disponibles: " +
                resultado.total
            );

            console.log(
                "Importación correcta:",
                resultado
            );

        } catch (error) {

            console.error(
                "Error importando test:",
                error
            );

            alert(
                "No se ha podido importar el test.\n\n" +
                error.message
            );

        } finally {

            input.remove();

        }

    });

    input.click();
}


function prepararTestALaCarta() {

    const boton =
        document.querySelector('[data-route="custom"]');

    if (!boton) {

        console.warn(
            "No se encontró el botón Test a la carta."
        );

        return;
    }

    boton.addEventListener("click", () => {

        console.log("Abriendo Test a la carta...");

        if (
            window.TestAppTestGenerator &&
            typeof window.TestAppTestGenerator.abrir === "function"
        ) {

            window.TestAppTestGenerator.abrir();

        } else {

            console.error(
                "test-generator.js no está cargado."
            );

            alert(
                "No se ha podido cargar el módulo de Test a la carta."
            );

        }

    });

}