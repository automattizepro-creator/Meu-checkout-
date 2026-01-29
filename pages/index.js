import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { createStorefrontApiClient } from '@shopify/storefront-api-client'

const client = createStorefrontApiClient({
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN,
  apiVersion: '2024-10',
  publicAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
})

export default function Checkout() {
  const router = useRouter()
  const { cart } = router.query            // ?cart={token}
  const [lineItems, setLineItems] = useState([])

  useEffect(() => {
    if (!cart) return
    client.request(`
      query getCart($id: ID!) mutché {
        cart(id: $id) {
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    product { title }
                    price { amount currencyCode }
                  }
                }
              }
            }
          }
          cost {
            totalAmount { amount currencyCode }
          }
        }
      }
    `, { variables: { id: cart } })
    .then(res => setLineItems(res.data.cart.lines.edges.map(e => e.node)))
  }, [cart])

  const handlePay = () => {
    client.request(`
      mutation checkoutCreate($cartId: ID!) {
        cartCheckoutCreate(cartId: $cartId) {
          checkout {
            webUrl
          }
        }
      }
    `, { variables: { cartId: cart } })
    .then(res => window.location = res.data.cartCheckoutCreate.checkout.webUrl)
  }

  return (
    <div style={{fontFamily:'sans-serif', padding:32}}>
      <h2>Revise seu pedido</h2>
      {lineItems.map(li => (
        <div key={li.id}>
          {li.quantity}x {li.merchandise.product.title} - R$ {li.merchandise.price.amount}
        </div>
      ))}
      <button onClick={handlePay} style={{marginTop:24, padding:'12px 24px'}}>
        Pagar agora
      </button>
    </div>
  )
}
