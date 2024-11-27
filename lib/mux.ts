import Mux from '@mux/mux-node'

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  throw new Error('Missing Mux API credentials')
}

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
})

export const  Video  = muxClient

// Or if you want to export the whole client:
export { muxClient }

