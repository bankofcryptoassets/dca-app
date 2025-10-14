const axios = require("axios")

const get = async ({ url, headers = {} }) => {
  try {
    const response = await axios.get(url, { headers })
    return response.data
  } catch (error) {
    throw error
  }
}

const post = async ({ url, body = {}, headers = {} }) => {
  try {
    const response = await axios.post(url, body, { headers })
    return response.data
  } catch (error) {
    throw error
  }
}

module.exports = { get, post }
