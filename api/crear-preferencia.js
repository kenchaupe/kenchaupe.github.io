const { MercadoPagoConfig, Preference } = require('mercadopago');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Metodo no permitido');

    const client = new MercadoPagoConfig({ 
        accessToken: process.env.MP_ACCESS_TOKEN 
    });

    const preference = new Preference(client);
    const { items } = req.body;

    try {
        const result = await preference.create({
            body: {
                items: items.map(p => ({
                    title: `${p.titulo} | Color: ${p.color} | Talle: ${p.talla}`,
                    quantity: Number(p.cantidad),
                    unit_price: Number(p.precio),
                    currency_id: 'ARS'
                })),
                // CONFIGURACIÓN DE MERCADO ENVÍOS
                shipments: {
                    mode: "me2", // "me2" es Mercado Envíos estándar
                    local_pickup: true, // Ponelo en true si querés que puedan retirar por tu taller
                    dimensions: "30x20x10,500" // Opcional: alto x ancho x largo (cm) y peso (gramos)
                },
                back_urls: {
                    success: "https://www.gruken.com/success.html",
                    failure: "https://www.gruken.com/checkout.html",
                    pending: "https://www.gruken.com/pending.html"
                },
                auto_return: "approved",
            }
        });

        res.status(200).json({ id: result.id });
    } catch (error) {
        console.error("Error en Mercado Pago:", error);
        res.status(500).json({ error: error.message });
    }
}