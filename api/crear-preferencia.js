const { MercadoPagoConfig, Preference } = require('mercadopago');

export default async function handler(req, res) {
    // Solo permitimos peticiones POST
    if (req.method !== 'POST') return res.status(405).send('Metodo no permitido');

    // Configuración del cliente con tu Token de Vercel
    const client = new MercadoPagoConfig({ 
        accessToken: process.env.MP_ACCESS_TOKEN 
    });

    const preference = new Preference(client);
    const { items } = req.body;

    try {
        const result = await preference.create({
            body: {
                items: items.map(p => ({
                    title: `${p.titulo} | Color: ${p.color} | Talle: ${p.talla} | Cantidad: ${p.cantidad}`,
                    quantity: Number(p.cantidad),
                    unit_price: Number(p.precio),
                    currency_id: 'ARS'
                })),

                // AGREGADO: Datos del comprador (obligatorios para aprobar calidad)
                payer: {
                    name: "Test",
                    surname: "User",
                    email: "TESTUSER1859857347057195126@testuser.com",
                    identification: {
                        type: "DNI",
                        number: "12345678"
                    },
                    address: {
                        street_name: "Calle Falsa",
                        street_number: 123,
                        zip_code: "1424"
                    }
                },

                // AGREGADO: Dirección de envío (necesaria para validar logística)
                shipments: {
                    mode: "not_specified", 
                    receiver_address: {
                        zip_code: "1424",
                        street_number: 123,
                        street_name: "Calle Falsa",
                        floor: "1",
                        apartment: "A"
                    }
                },

                back_urls: {
                    success: "https://www.gruken.com/success.html",
                    failure: "https://www.gruken.com/checkout.html",
                    pending: "https://www.gruken.com/pending.html"
                },
                auto_return: "approved",
            }
        });

        // Enviamos el ID de la preferencia al frontend
        res.status(200).json({ id: result.id });
    } catch (error) {
        console.error("Error en Mercado Pago:", error);
        res.status(500).json({ error: error.message });
    }
}