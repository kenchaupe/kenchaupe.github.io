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

                // CAMBIO CLAVE: Quitamos "me2" para evitar el error de "collector active"
                shipments: {
                    mode: "not_specified" 
                },
                back_urls: {
                    // Volvemos a tu página principal al terminar
                    success: "https://www.gruken.com/success.html", // Página de éxito
                    failure: "https://www.gruken.com/checkout.html", // Si falla, vuelve al checkout
                    pending: "https://www.gruken.com/pending.html"   // Pago pendiente (ej: Rapipago)
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