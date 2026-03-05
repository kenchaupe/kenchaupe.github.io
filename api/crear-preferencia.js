import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
    console.log("1. La función API se inició correctamente"); // Veremos esto en Vercel Logs

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    // VERIFICACIÓN DEL TOKEN
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
        console.error("ERROR: No se encontró la variable MP_ACCESS_TOKEN en Vercel");
        return res.status(500).json({ error: "Falta el Access Token en el servidor" });
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);

    try {
        const { items } = req.body;
        console.log("2. Items recibidos:", JSON.stringify(items));

        const body = {
            items: items.map(p => ({
                id: String(p.id || 'prod'),
                title: String(p.titulo || 'Producto Gruken'),
                quantity: Number(p.cantidad),
                unit_price: Number(p.precio),
                currency_id: 'ARS'
            })),
            back_urls: {
                success: "https://www.gruken.com/success.html",
                failure: "https://www.gruken.com/checkout.html",
                pending: "https://www.gruken.com/pending.html"
            },
            auto_return: "approved",
            binary_mode: true
        };

        const result = await preference.create({ body });
        console.log("3. Preferencia creada con éxito. ID:", result.id);

        return res.status(200).json({ id: result.id });

    } catch (error) {
        console.error("4. ERROR DETECTADO EN MERCADO PAGO:", error);
        return res.status(500).json({ 
            error: "Error interno", 
            detalles: error.message 
        });
    }
}