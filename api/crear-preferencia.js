const { MercadoPagoConfig, Preference } = require('mercadopago');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Metodo no permitido');

    // Aquí usamos tu Access Token (lo configuraremos en Vercel luego)
    const client = new MercadoPagoConfig({ 
        accessToken: process.env.MP_ACCESS_TOKEN 
    });

    const preference = new Preference(client);
    const { items, envio } = req.body;

    try {
        const result = await preference.create({
            body: {
                items: items.map(p => ({
                    title: `${p.titulo} (Talle: ${p.talla})`,
                    quantity: parseInt(p.cantidad),
                    unit_price: parseFloat(p.precio),
                    currency_id: 'ARS'
                })),
                shipments: {
                    mode: "me2", // Esto activa Mercado Envíos automáticamente
                },
                back_urls: {
                    success: "https://kenchaupe-github-io.vercel.app/gracias.html",
                    failure: "https://kenchaupe-github-io.vercel.app/error.html",
                },
                auto_return: "approved",
            }
        });

        res.status(200).json({ id: result.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}