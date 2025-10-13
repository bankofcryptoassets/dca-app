const express = require("express")
const { combinedLogger } = require("../utils/logger")
const User = require("../model/userModel")
const satori = require("satori").default
const html = (...args) =>
  import("satori-html").then(({ html }) => html(...args))
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args))
const inter = fetch(
  "https://og-playground.vercel.app/inter-latin-ext-400-normal.woff"
).then((res) => res.arrayBuffer())
const serverUrl = "https://dcaapp.xefi.ai"

const getShareOG = async (req, res) => {
  try {
    const { referralId } = req.params
    const user = await User.findOne({ referralId })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const currentDay = user.payments.length || 1
    const totalDays = 400 // mock total days as it doesn't matter for the OG image
    const username = user.username

    combinedLogger.info(
      "getShareOG -- Generating OG image for user: " + referralId
    )

    const filledDot = Array.from({ length: currentDay }).map(
      () =>
        `<div
        style="
            display: flex;
            width: 8px;
            height: 8px;
            border-radius: 100%;
            background: #f7931a;
          "
      ></div>`
    )
    const emptyDot = Array.from({ length: totalDays - currentDay }).map(
      () =>
        `<div
        style="
            display: flex;
            width: 8px;
            height: 8px;
            border-radius: 100%;
            background: rgba(255, 255, 255, 0.1);
          "
      ></div>`
    )

    const dots = [...filledDot, ...emptyDot]?.join("")

    const finalHtml = `<div
        style="
        display: flex;
        width: 1200px;
        height: 800px;
        background-image: url('${serverUrl}/images/share-og.png');
        background-size: cover;
        position: relative;
      "
      >
        <div
          style="
          display: flex;
          background: #341e0c;
          color: #f7931a;
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 14px;
          position: absolute;
          top: 220px;
          right: 270px;
          transform: translateX(50%);
        "
        >
          @${username}
        </div>
        <div
          style="
          display: flex;
          position: absolute;
          top: 313px;
          left: 991px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        "
        >
          ${currentDay}
        </div>
        <div
          style="
          display: flex;
          position: absolute;
          top: 438px;
          left: 819px;
          font-size: 26px;
          color: rgba(255, 255, 255, 0.85);
        "
        >
          ${currentDay}
        </div>
      </div>
      <div
        style="
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-content: flex-start;
        gap: 8px;
        position: absolute;
        width: 308px;
        height: 320px;
        top: 484px;
        left: 768px;
      "
      >
        ${dots}
      </div>`

    const markup = await html(finalHtml)

    // Generate the SVG using Satori
    const svg = await satori(markup, {
      width: 1200,
      height: 800,
      fonts: [
        {
          name: "Inter",
          data: await inter,
          weight: 400,
          style: "normal",
        },
      ],
    })

    // Set headers for image response
    res.setHeader("Content-Type", "image/svg+xml")
    // res.setHeader("Cache-Control", "public, max-age=3600") // Cache for 1 hour
    res.send(svg)
  } catch (error) {
    combinedLogger.error(
      "getShareOG -- Error generating OG image: " +
        JSON.stringify(error, Object.getOwnPropertyNames(error))
    )
    res.status(500).json({ error: "Failed to generate OG image" })
  }
}

module.exports = { getShareOG }
