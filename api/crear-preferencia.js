// REEMPLAZÁ LAS PRIMERAS LÍNEAS POR ESTAS:
import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Metodo no permitido');

    const client = new MercadoPagoConfig({ 
        accessToken: process.env.MP_ACCESS_TOKEN 
    });
    
    // ... (el resto del código sigue igual)
    const preference = new Preference(client);
    const { items } = req.body;

    try {
        const result = await preference.create({
            body: {
                items: items.map(p => ({
                    id: p.id || 'prod-001', // Es mejor incluir un ID
                    title: `${p.titulo} | ${p.color} | ${p.talla}`,
                    quantity: Number(p.cantidad),
                    unit_price: Number(p.precio),
                    currency_id: 'ARS',
                    category_id: 'fashion', // Ayuda a que MP no sospeche de la venta
                    description: 'Prenda de confección Gruken'
                })),
                shipments: {
                    mode: "me2" 
                },
                back_urls: {
                    success: "https://www.gruken.com/success.html",
                    failure: "https://www.gruken.com/checkout.html",
                    pending: "https://www.gruken.com/pending.html"
                },
                auto_return: "approved",
                statement_descriptor: "GRUKEN SHOP", // Como aparecerá en el resumen de la tarjeta
                binary_mode: true // Solo acepta pagos aprobados o rechazados (evita los "pendientes")
            }
        });

        res.status(200).json({ id: result.id });
    } catch (error) {
        console.error("Error en Mercado Pago:", error);
        res.status(500).json({ error: error.message });
    }
}