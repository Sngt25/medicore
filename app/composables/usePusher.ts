import Pusher from 'pusher-js'

let pusherInstance: Pusher | null = null

export const usePusher = () => {
  const config = useRuntimeConfig()

  const getPusher = () => {
    if (import.meta.server) return null

    if (!pusherInstance) {
      pusherInstance = new Pusher(config.public.pusher.key, {
        cluster: config.public.pusher.cluster
      })
    }

    return pusherInstance
  }

  const subscribe = (channelName: string) => {
    const pusher = getPusher()
    if (!pusher) return null
    return pusher.subscribe(channelName)
  }

  const unsubscribe = (channelName: string) => {
    const pusher = getPusher()
    if (!pusher) return
    pusher.unsubscribe(channelName)
  }

  return {
    getPusher,
    subscribe,
    unsubscribe
  }
}
