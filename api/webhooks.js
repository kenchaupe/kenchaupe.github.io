import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

// Configuración de clientes
const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método no permitido');

    const { body, query } = req;
    const id = body.data?.id || query.id;
    const topic = body.type || query.topic;

    // 1. Solo nos interesa si la notificación es de un pago
    if (topic === 'payment') {
        try {
            const payment = new Payment(mpClient);
            const data = await payment.get({ id });

            // 2. Si el pago está aprobado, descontamos stock
            if (data.status === 'approved') {
                const items = data.additional_info.items;

                for (const item of items) {
                    // Actualiza tu tabla 'productos' en Supabase
                    const { error } = await supabase
                        .rpc('descontar_stock', { 
                            producto_id: item.id, 
                            cantidad_a_restar: item.quantity 
                        });

                    if (error) console.error("Error actualizando stock:", error);
                }
                console.log(`Pago ${id} procesado y stock actualizado.`);
            }
        } catch (error) {
            console.error("Error procesando webhook:", error);
        }
    }

    // Siempre responder 200 a Mercado Pago
    res.status(200).send('OK');
}