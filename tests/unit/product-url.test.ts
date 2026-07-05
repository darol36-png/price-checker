import { describe, expect, it } from 'vitest'
import { normalizeProductUrl } from '../../site/src/lib/product-url'

const EMPIK_PRODUCT =
  'https://www.empik.com/honor-magic-v5-5g-dual-sim-16gb-ram-512gb-black-honor,p1709120402,elektronika-p'

describe('normalizeProductUrl', () => {
  it('strips Ceneo tracking params from Empik URLs but keeps mpShopId', () => {
    const ceneoUrl = `${EMPIK_PRODUCT}?utm_medium=oferty_cpc&utm_source=ceneo.pl&utm_content=p1709120402&utm_term=Elektronika-5191.99-100-default_3P&utm_campaign=34099&mpShopId=34099&~secondary_publisher=5191.99-100-default_3P&%243p=a_custom_1121418919869422945&~campaign=Elektronika%20>%20Telefony%20i%20smartwatche%20>%20Smartfony&~campaignId=Elektronika&~ad_set_name=p1709120402&~ad_name=34099&%24web_only=true&ceneo_cid=388c5e8d-3479-0f40-7beb-bdb39b646295&_branch_match_id=1596491068099525984&_branch_referrer=H4sIAAAAAAAAA21RXY%2FbIBD8NfYbiQHbCZWsqmrvpHtqpfQdAV7bNHwJ41p5yW8vzjVNTqoEaHdmmWWWKaUwf9rvrf8FNujzToSwM9qd94cTbY2sx2qRnwtS09AJrpY5ecsxJrjGR4bZsWU1IaxuylyyguTemUuX4gIbMAhjpFBnvkTTTVungn4pyGte67ru3hsqb3M%2BeecjsmLUCv1uUDOifhEGzdoi3I4SRWFRg0mOpMmK6FZfkK8BHyqGSVVXJGdg4Jyid%2FosUCjo65Ist9DrxRb0mx8gpgtXQRWk3ZjZL1FBZhQ48Ltg%2FuLKuwQuZeKD%2Bo1LEDetl6dGDWZ4xxjCVYV6GMRiEqc%2F7lrCBqFHl%2B%2FQumIswzacJh%2Fe%2BifoOkNu2ot44WGRRs8TxEz%2FX7m83kXf%2Bu7pIeXDbffwWt7McaX7jh6PqoFjj2h9YKga6godJOSJ9pIy2dYtYc1D%2FFm6IFVBX%2FL5M0948O6SQ533bEVMq0hqgn8lpw3basqr6LkTFrqbzVs6Q3qHniZbPv6iu%2F9EeY2QLUTtRi6jX2eI3fcAUfwB48NI0rACAAA%3D`

    expect(normalizeProductUrl(ceneoUrl)).toBe(`${EMPIK_PRODUCT}?mpShopId=34099`)
  })

  it('keeps clean Empik URLs unchanged', () => {
    expect(normalizeProductUrl(EMPIK_PRODUCT)).toBe(EMPIK_PRODUCT)
  })

  it('strips utm params from other shops', () => {
    const url =
      'https://www.morele.net/product-123?utm_source=ceneo&utm_medium=cpc&foo=bar'
    expect(normalizeProductUrl(url)).toBe('https://www.morele.net/product-123?foo=bar')
  })

  it('returns invalid URLs unchanged', () => {
    expect(normalizeProductUrl('not-a-url')).toBe('not-a-url')
  })
})
