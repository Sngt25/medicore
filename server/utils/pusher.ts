import Pusher from 'pusher'

const config = useRuntimeConfig()

export const pusherServer = new Pusher({
  appId: config.pusher.appId as string,
  key: config.pusher.key as string,
  secret: config.pusher.secret as string,
  cluster: config.pusher.cluster as string,
  useTLS: true
})
