export function isBlockedPage(content: string): boolean {
  const blocked =
    /performing security verification|just a moment|verify you are not a bot|security service to protect against malicious bots|enable javascript and cookies/i.test(
      content,
    )
  const hasProductPrice =
    /data-price-amount|application\/ld\+json.*Product|"@type"\s*:\s*"Product"/i.test(content)

  return blocked && !hasProductPrice
}
