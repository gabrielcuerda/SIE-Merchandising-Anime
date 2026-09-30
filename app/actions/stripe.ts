'use server'

import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'

type Product = {
  id: string
  name: string
  description: string
  priceInCents: number
}

const productCatalog: Record<string, Product> = {
  'anime-tee': {
    id: 'anime-tee',
    name: 'SIE Merch T-Shirt',
    description: 'Official SIE Merchandising Anime t-shirt.',
    priceInCents: 3500,
  },
  poster: {
    id: 'poster',
    name: 'Anime Poster',
    description: 'Limited edition anime poster.',
    priceInCents: 2200,
  },
}

async function getProduct(productId: string): Promise<Product> {
  const product = productCatalog[productId]

  if (!product) {
    throw new Error(`Product not found for id: ${productId}`)
  }

  return product
}

export async function startCheckoutSession(productId: string) {
  // Implement your product catalog lookup.
  const product = await getProduct(productId)

  // Create Checkout Sessions from body params.
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  })

  return session.client_secret
}