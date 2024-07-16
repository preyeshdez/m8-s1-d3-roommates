import nodemailer from 'nodemailer';

const enviarEmail = (gasto) => {
    return new Promise((resolve, reject) => {

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "prueba.nodemailer.22@gmail.com",
                pass: "mapu eqam ixax xhmq"
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        const mailOptions = {
            from: "prueba.nodemailer.22@gmail.com",
            to: "prueba.nodemailer.22@gmail.com",
            subject: "Nuevo gasto de roommate",
            html: `
                <header>
                    <h1>Roommate: ${gasto.roommate}</h1>
                </header>
                <div>
                    <h2>Hola Roommates! He hecho un gasto.</h2>
                    <p><strong>Monto gasto:</strong> ${gasto.monto}</p>
                    <p><strong>Detalle gasto:</strong> ${gasto.descripcion}</p>
                </div>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return reject("Error en envío de correo.");
            }
            resolve("Correo enviado correctamente.");
        });
    });
}

let nuevoGasto = {
    roommate: "Pedro",
    descripcion: "Compra de leña",
    monto: "300000",
    id: "asfsg343"
};

enviarEmail(nuevoGasto)

// export default enviarEmail;