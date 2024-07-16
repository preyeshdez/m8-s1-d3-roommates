import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path, { parse } from 'path';
import * as url from 'url';
import getRandomUser from './getRandomUser.js';
// import enviarEmail from './nodemailer.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const app = express();
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`)
})

app.use(express.static("public"));
app.use(express.json());

app.post("/roommates", async (req, res) => {
    try {
        let roommateData = await getRandomUser()

        let nuevoRoommate = {
            id: uuidv4(),
            nombre: `${roommateData.name.first} ${roommateData.name.last}`,
            debe: 0,
            recibe: 0
        }

        let roommatesJson = fs.readFileSync(path.resolve(__dirname, "./data/roommates.json"), "utf-8");
        let dataRoommates = JSON.parse(roommatesJson);

        dataRoommates.roommates.push(nuevoRoommate);

        fs.writeFileSync(path.resolve(__dirname, "./data/roommates.json"), JSON.stringify(dataRoommates, null, 4), "utf8");

        // Reiniciar los valores de debe y recibe
        dataRoommates.roommates.forEach(r => {
            r.debe = 0;
            r.recibe = 0;
        });

        // Recalcular gastos para ajustar a los nuevos roommates
        let gastosJson = fs.readFileSync(path.resolve(__dirname, "./data/gastos.json"), "utf-8");
        let dataGastos = JSON.parse(gastosJson);

        dataGastos.gastos.forEach(gasto => {
            let cantidadRoommates = dataRoommates.roommates.length;
            let montoDividido = gasto.monto / cantidadRoommates;

            dataRoommates.roommates.forEach(r => {
                if (r.nombre === gasto.roommate) {
                    r.recibe += parseInt(montoDividido * (cantidadRoommates - 1));
                } else {
                    r.debe += parseInt(montoDividido);
                }
            });
        });

        fs.writeFileSync(path.resolve(__dirname, "./data/roommates.json"), JSON.stringify(dataRoommates, null, 4), "utf8");

        res.status(201).json(nuevoRoommate)
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al agregar un nuevo roommate."
        })
    }
})

app.get("/roommates", (req, res) => {
    try {
        let roommatesJson = fs.readFileSync(path.resolve(__dirname, "./data/roommates.json"), "utf-8");
        let dataRoommates = JSON.parse(roommatesJson);

        res.status(200).send(dataRoommates);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al obtener la lista de roommates."
        })
    }
})

app.get("/gastos", (req, res) => {
    try {
        let gastosJson = fs.readFileSync(path.resolve(__dirname, "./data/gastos.json"), "utf-8");
        let dataGastos = JSON.parse(gastosJson);

        res.status(200).send(dataGastos);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al obtener la lista de gastos."
        })
    }
})

app.post("/gastos", async (req, res) => {
    try {
        let { roommate, descripcion, monto } = req.body;
        let gastoId = uuidv4().slice(0, 6);

        if (!roommate || !descripcion || !monto) {
            return res.status(401).json({
                message: "Debe ingresar todos los datos."
            });
        }

        let nuevoGasto = {
            roommate,
            descripcion,
            monto,
            id: gastoId
        };

        let gastosJson = fs.readFileSync(path.resolve(__dirname, "./data/gastos.json"), "utf-8");
        let dataGastos = JSON.parse(gastosJson);

        dataGastos.gastos.push(nuevoGasto);

        fs.writeFileSync(path.resolve(__dirname, "./data/gastos.json"), JSON.stringify(dataGastos, null, 4), "utf8");

        // Calcular división del gasto entre los roommates
        let roommatesJson = fs.readFileSync(path.resolve(__dirname, "./data/roommates.json"), "utf-8");
        let dataRoommates = JSON.parse(roommatesJson);

        let cantidadRoommates = dataRoommates.roommates.length;
        let montoDividido = nuevoGasto.monto / cantidadRoommates;

        dataRoommates.roommates.forEach(r => {
            if (r.nombre === nuevoGasto.roommate) {
                r.recibe += parseInt(montoDividido * (cantidadRoommates - 1), 10);
            } else {
                r.debe += parseInt(montoDividido, 10);
            }
        });

        fs.writeFileSync(path.resolve(__dirname, "./data/roommates.json"), JSON.stringify(dataRoommates, null, 4), "utf8");

        res.status(201).json(nuevoGasto);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al agregar un nuevo gasto."
        });
    }
});

app.delete("/gasto", async (req, res) => {
    try {
        let { id } = req.query;

        let gastosJson = fs.readFileSync(path.resolve(__dirname, "./data/gastos.json"), "utf-8");
        let dataGastos = JSON.parse(gastosJson);

        let gastoEliminado = dataGastos.gastos.find(gasto => gasto.id == id);

        let gastoIndex = dataGastos.gastos.findIndex(gasto => gasto.id == id);

        dataGastos.gastos.splice(gastoIndex, 1)

        fs.writeFileSync(path.resolve(__dirname, "./data/gastos.json"), JSON.stringify(dataGastos, null, 4), "utf8");

        //Calcular eliminacion del gasto entre los roommates
        let roommatesJson = fs.readFileSync(path.resolve(__dirname, "./data/roommates.json"), "utf-8");
        let dataRoommates = JSON.parse(roommatesJson);

        let cantidadRoommates = dataRoommates.roommates.length;
        let montoDividido = gastoEliminado.monto / cantidadRoommates;

        dataRoommates.roommates.forEach(r => {
            if (r.nombre == gastoEliminado.roommate) {
                r.recibe -= parseInt(montoDividido * (cantidadRoommates - 1))
            } else {
                r.debe -= parseInt(montoDividido)
            }
        });

        fs.writeFileSync(path.resolve(__dirname, "./data/roommates.json"), JSON.stringify(dataRoommates, null, 4), "utf8");

        res.status(200).json({
            gastoEliminado,
            message: `Gasto de id [${id}] eliminado con exito.`
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al intentar eliminar el gasto indicado."
        })
    }
})

app.put("/gasto", (req, res) => {
    try {
        const { roommate, descripcion, monto } = req.body;
        const { id } = req.query;

        if (!id || !roommate || !descripcion || !monto) {
            return res.status(400).json({
                message: "Datos incompletos. Asegúrate de proporcionar id, roommate, descripcion y monto."
            });
        }

        let gastosJson = fs.readFileSync(path.resolve(__dirname, "./data/gastos.json"), "utf-8");
        let dataGastos = JSON.parse(gastosJson);

        let gastoIndex = dataGastos.gastos.findIndex(gasto => gasto.id == id);

        if (gastoIndex === -1) {
            return res.status(404).json({
                message: "Gasto no encontrado."
            });
        }

        let gastoOriginal = dataGastos.gastos[gastoIndex];

        //actualizar el gasto
        dataGastos.gastos[gastoIndex] = { id, roommate, descripcion, monto };

        fs.writeFileSync(path.resolve(__dirname, "./data/gastos.json"), JSON.stringify(dataGastos, null, 4), "utf8");

        //ajustar deudas y recibos de los roommates
        let roommatesJson = fs.readFileSync(path.resolve(__dirname, "./data/roommates.json"), "utf-8");
        let dataRoommates = JSON.parse(roommatesJson);

        //revertir los efectos del gasto original
        let cantidadRoommates = dataRoommates.roommates.length;
        let montoDivididoOriginal = gastoOriginal.monto / cantidadRoommates;

        dataRoommates.roommates.forEach(r => {
            if (r.nombre == gastoOriginal.roommate) {
                r.recibe -= parseInt(montoDivididoOriginal * (cantidadRoommates - 1))
            } else {
                r.debe -= parseInt(montoDivididoOriginal)
            }
        });

        //aplicar los efectos del gasto actualizado
        let montoDivididoNuevo = monto / cantidadRoommates;

        dataRoommates.roommates.forEach(r => {
            if (r.nombre == roommate) {
                r.recibe += parseInt(montoDivididoNuevo * (cantidadRoommates - 1))
            } else {
                r.debe += parseInt(montoDivididoNuevo)
            }
        });

        fs.writeFileSync(path.resolve(__dirname, "./data/roommates.json"), JSON.stringify(dataRoommates, null, 4), "utf8");

        res.status(200).json({
            message: "Gasto actualizado correctamente.",
            gasto: dataGastos.gastos[gastoIndex]
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al intentar editar el gasto indicado."
        });
    }
});