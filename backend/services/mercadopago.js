import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_TOKEN
});

export const createPayment = async (title, price) => {
  const preference = {
    items: [{ title, unit_price: price, quantity: 1 }]
  };

  const response = await mercadopago.preferences.create(preference);
  return response.body.init_point;
};
