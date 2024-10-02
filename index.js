require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.json());

app.post('/create-payment-links', async (req, res) => {
    const { totalAmount, currency, players, success_url, cancel_url } = req.body;

    if (!Array.isArray(players) || players.length === 0) {
        return res.status(400).json({ error: 'Players array is required' });
    }

    const playerLinks = [];
    const amountPerPlayer = Math.round(totalAmount / players.length); // Split amount among players

    try {
        for (const player of players) {
            const { name, email } = player;

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: currency,
                        product_data: {
                            name: `${name}'s Payment`,
                            description: `Payment for ${name}`,
                        },
                        unit_amount: amountPerPlayer,
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: success_url,
                cancel_url: cancel_url,
                metadata: {
                    email: email, // Optionally store player email
                },
            });

            playerLinks.push({ name, email, paymentLink: session.url });
        }

        res.json({ playerLinks });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
