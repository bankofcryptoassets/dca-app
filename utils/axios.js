const axios = require("axios")

const get = async ({ url, headers = {} }) => {
  const response = await axios.get(url, { headers })
  return response.data
}

const post = async ({ url, body = {}, headers = {} }) => {
  const response = await axios.post(url, body, { headers })
  return response.data
}

module.exports = { get, post }
