import { describe, expect, it } from 'vitest'
import { extractPrice } from '../../site/src/lib/price-parser'

describe('extractPrice', () => {
  it('extracts price from JSON-LD Product schema', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "Product",
        "name": "iPhone",
        "offers": {
          "@type": "Offer",
          "price": "4299.00",
          "priceCurrency": "PLN"
        }
      }
      </script>
    `
    const result = extractPrice(html)
    expect(result).toEqual({ price: 4299, currency: 'PLN' })
  })

  it('extracts price from meta tags', () => {
    const html = `
      <meta property="product:price:amount" content="1999.99" />
      <meta property="product:price:currency" content="PLN" />
    `
    const result = extractPrice(html)
    expect(result).toEqual({ price: 1999.99, currency: 'PLN' })
  })

  it('extracts PLN price from markdown text', () => {
    const markdown = 'Cena produktu: 1 299,00 zł z dostawą'
    const result = extractPrice(markdown)
    expect(result).toEqual({ price: 1299, currency: 'PLN' })
  })

  it('extracts EUR price', () => {
    const text = 'Preis: € 89,99 inkl. MwSt.'
    const result = extractPrice(text)
    expect(result).toEqual({ price: 89.99, currency: 'EUR' })
  })

  it('returns null when no price found', () => {
    expect(extractPrice('<html><body>Brak ceny</body></html>')).toBeNull()
  })

  it('handles nested @graph JSON-LD', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@graph": [
          { "@type": "WebPage", "name": "Page" },
          {
            "@type": "Product",
            "offers": { "price": 599, "priceCurrency": "PLN" }
          }
        ]
      }
      </script>
    `
    const result = extractPrice(html)
    expect(result).toEqual({ price: 599, currency: 'PLN' })
  })

  it('extracts Morele price without grosze (bold markdown)', () => {
    const markdown = `
      Darmowa dostawa od 399 zł
      **Otrzymasz 500 zł** rabatu
      800 zł taniej
      6 999 zł
      **6 199** zł
      Rata od **157,34 zł**
    `
    const result = extractPrice(markdown)
    expect(result).toEqual({ price: 6199, currency: 'PLN' })
  })

  it('extracts integer PLN price with spaced thousands', () => {
    const markdown = 'Cena: 6 199 zł'
    const result = extractPrice(markdown)
    expect(result).toEqual({ price: 6199, currency: 'PLN' })
  })

  it('extracts iSpot data-price-amount finalPrice', () => {
    const html = `
      MacBook już od 629,90 zł/mies.
      <span data-price-amount="6299" data-price-type="finalPrice">iPhone</span>
      <span data-price-amount="7299" data-price-type="finalPrice">iPhone</span>
    `
    const result = extractPrice(html)
    expect(result).toEqual({ price: 6299, currency: 'PLN' })
  })

  it('ignores monthly installment and picks product price on iSpot-like page', () => {
    const markdown = `
      MacBook Air 15" z czipem M5 już od 629,90 zł/mies. w 10 ratach 0% RRSO 0%.
      iPhone 17 Pro Max od 6 299,00 zł
      7 299,00 zł
    `
    const result = extractPrice(markdown)
    expect(result).toEqual({ price: 6299, currency: 'PLN' })
  })

  it('extracts Honor Store promo price and ignores USD subscription footnote', () => {
    const markdown = `
      Cena producenta 8 699,00 zł
      Cena promocyjna 8 699,00 zł Cena producenta~~ 9 899,00 zł ~~
      **20 rat × 434,95 zł**(RRSO 0%)
      **8 459,00 zł** z kuponem HONOR240TANIEJ
      Google AI Pro będzie pobierać opłatę w wysokości 19,99 USD/mies.
    `
    const result = extractPrice(markdown)
    expect(result).toEqual({ price: 8699, currency: 'PLN' })
  })

  it('extracts iSpot single product page via meta and Magento config', () => {
    const html = `
      <meta property="product:price:amount" content="6299"/>
      <meta itemprop="price" content="6299">
      initialFinalPrice: 6299,
      <span data-price-amount="109" data-price-type="finalPrice">case</span>
    `
    const result = extractPrice(html)
    expect(result).toEqual({ price: 6299, currency: 'PLN' })
  })

  it('extracts Empik main product price and ignores sponsored recommendations', () => {
    const markdown = `
      # Honor Magic V5 5G Dual Sim 16GB RAM 512GB - Black
      Megacena
      5191,99 zł
      Dodaj do koszyka
      Szybsza wysyłka od **6020,94 zł**
      ### Propozycje dla Ciebie
      Samsung Galaxy A57
      1500,00 zł
      SPONSOROWANE
      Smartfon Xiaomi POCO X8 Pro 5G
      1590,75 zł
    `
    const result = extractPrice(markdown)
    expect(result).toEqual({ price: 5191.99, currency: 'PLN' })
  })
})
