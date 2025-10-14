const parseWebhookData = (webhookData) => {
  const { header, payload } = webhookData
  const decodedHeader = JSON.parse(
    Buffer.from(header, "base64").toString("utf-8")
  )
  const decodedPayload = JSON.parse(
    Buffer.from(payload, "base64").toString("utf-8")
  )

  return { fid: decodedHeader?.fid, event: decodedPayload }
}

exports.parseWebhookData = parseWebhookData
