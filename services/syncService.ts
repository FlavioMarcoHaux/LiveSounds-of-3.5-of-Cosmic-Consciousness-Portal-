// services/syncService.ts
const CHANNEL_NAME = 'cosmic-nexus-sync';
let channel: BroadcastChannel | null = null;

const getChannel = (): BroadcastChannel => {
    if (!channel) {
        channel = new BroadcastChannel(CHANNEL_NAME);
    }
    return channel;
};

export const postSyncMessage = (message: any) => {
    getChannel().postMessage(message);
};

export const listenToSyncMessages = (callback: (event: MessageEvent) => void) => {
    const ch = getChannel();
    ch.onmessage = callback;

    return () => {
        ch.onmessage = null;
    };
};

export const closeChannel = () => {
    if (channel) {
        channel.close();
        channel = null;
    }
};