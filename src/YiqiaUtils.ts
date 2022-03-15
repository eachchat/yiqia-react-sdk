import { MatrixClientPeg } from "./MatrixClientPeg";
import SdkConfig from "./SdkConfig";

const GMS_URL = SdkConfig.get()["gms_url"];

/**
 * To fetch all gms configure of the organization from gms service
 * @returns A promise that resolves with an object and it can be null.
 */
export async function toFetchBookInfos() {
    const matrixClient = MatrixClientPeg.get();
    const domain = matrixClient.getDomain();
    try {
        fetch(GMS_URL + "/gms/v1/configuration/" + window.btoa(domain), {
            method: "GET",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
        })
        .then((resp) => {
            return new Promise((resolve) => {
                resolve(resp.json());
            });
        })
        .then((data) => {
            // {"videoLimit":"2000","uploadLimit":"500","audioSwitch":"true","audioLimit":"60000","videoSwitch":"true"}
            if(data && data.code === 200 && data.obj) {
                const bookInfo = {
                    contact: {
                        support: data.obj.book?.contactSwitch,
                    },
                    group: {
                        support: data.obj.book?.groupSwitch,
                    },
                    org: {
                        support: data.obj.book?.orgSwitch,
                    },
                    audio: {
                        support: data.obj.im?.audioSwitch,
                        limit: data.obj.im?.videoLimit,
                    },
                    video: {
                        support: data.obj.im?.videoSwitch,
                        limit: data.obj.im?.audioLimit,
                    },
                    attachment: {
                        support: true,
                        limit: data.obj.im?.uploadLimit,
                    },
                    lastUpdateTime: String(new Date().getTime()),
                }

                localStorage.setItem("yiqia-book-info", JSON.stringify(bookInfo));
                return bookInfo;
            } else {
                return null;
            }
        })
        .catch((err) => {
            console.log("err ", err);
            return null;
        })
    }
    catch(error) {
        return null;
    }
}

/**
 * To get book infos no metter from localstorage or gms service
 * @returns A promise that resolves with an object and it can be null.
 */
async function toGetBookInfos() {
    const bookLimitString = localStorage.getItem("yiqia-book-info");

    let bookLimit;

    if(bookLimitString?.trim().length !== 0) {
        try{
            bookLimit = JSON.parse(bookLimitString);
        }
        catch(err) {

        }
    }

    if(!bookLimit) {
        bookLimit = await toFetchBookInfos();
    } else {
        const lastUpdateTime = parseInt(bookLimit.lastUpdateTime);
        const currentTime = new Date().getTime();
        const theInterval = parseInt(SdkConfig.get()["gmsUpdateInterval"]);

        if(currentTime - lastUpdateTime > theInterval) {
            toFetchBookInfos();
        }
    }

    return bookLimit;
}

/**
 * To get current attachment state of organization
 * @returns A promise that resolves with an object and it can be null.
 */
export async function getAttachmentState() {
    const matrixClient = MatrixClientPeg.get();
    const homeserver_base_url = matrixClient.getHomeserverUrl();
    const hAccessToken = await matrixClient.getAccessToken();
    let attachmentResp;
    try{
        const currentAttachmentResp = await (await fetch(homeserver_base_url + "/api/apps/org/v1/count/media", {
            method: "GET",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + hAccessToken,
            }
        })).json();
        attachmentResp = currentAttachmentResp.obj;
    } catch(error) {

    }

    return attachmentResp;
}

async function getAttachmentStateCount() {
    const currentAttachmentInfo = await getAttachmentState();
    if(currentAttachmentInfo) {
        return currentAttachmentInfo.countMedia;
    } else {
        return null;
    }
}

/**
 * To get attachment limits of organization
 * @returns A promise that resolves with an object and it can not be null.
 */
export async function getAttachmentLimits() {
    let attachmentState = {
        support: true,
        limit: null,
    };

    let bookLimit = await toGetBookInfos();

    if(bookLimit?.attachment) {
        attachmentState = bookLimit.attachment;
    }

    return attachmentState;
}

export async function isAttachmentSupported() {
    const attachmentInfo = await getAttachmentLimits();
    return attachmentInfo.support;
}

export async function getAttatchmentLimitCount() {
    const attachmentInfo = await getAttachmentLimits();
    if(attachmentInfo.limit) {
        return parseFloat(attachmentInfo.limit) * 1024 * 1024 * 1024
    }
    return null;
}

export async function isAttachmentOutOfLimits() {
    const limitAttachmentByte = await getAttatchmentLimitCount();
    const currentAttachmentByte = await getAttachmentStateCount();
    if(currentAttachmentByte && limitAttachmentByte) {
        if(currentAttachmentByte >= limitAttachmentByte) {
            return true;
        }
    }

    return false;
}

export async function isTheUploadingOutOfLimits(files) {
    const limitAttachmentByte = await getAttatchmentLimitCount();
    const currentAttachmentByte = await getAttachmentStateCount();
    let totalSize;
    for (let i = 0; i < files.length; ++i) {
        totalSize = totalSize + files[i].size;
    }
    
    if(currentAttachmentByte && limitAttachmentByte && (totalSize >= limitAttachmentByte - currentAttachmentByte)) {
        return true;
    }

    return false;
}

/**
 * To get current video state of organization
 * @returns A promise that resolves with an object and it can be null.
 */
export async function getVideoState() {
    const matrixClient = MatrixClientPeg.get();
    const homeserver_base_url = matrixClient.getHomeserverUrl();
    const hAccessToken = await matrixClient.getAccessToken();
    let videoResp;
    try{
        const currentVideoResp = await (await fetch(homeserver_base_url + "/api/apps/org/v1/count/video", {
            method: "GET",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + hAccessToken,
            }
        })).json();
        videoResp = currentVideoResp.obj;
    } catch(error) {

    }

    return videoResp;
}

/**
 * To get video limits of organization
 * @returns A promise that resolves with an object and it can not be null.
 */
export async function getVideoLimits() {
    let videoState = {
        support: true,
        limit: null,
    };

    let bookLimit = await toGetBookInfos();

    if(bookLimit?.video) {
        videoState = bookLimit.video;
    }

    return videoState;
}

export async function isVideoSupported() {
    const videoInfo = await getVideoLimits();
    return videoInfo.support;
}

export async function getVideoLimitCount() {
    const videoInfo = await getVideoLimits();
    if(videoInfo.limit) {
        return parseFloat(videoInfo.limit) * 60;
    }
    return null;
}

async function getVideoStateCount() {
    const currentVideoInfo = await getVideoState();
    if(currentVideoInfo) {
        return currentVideoInfo.countVideo;
    } else {
        return null;
    }
}

export async function isVideoOutOfLimits() {
    const limitVideoSeconds = await getVideoLimitCount();
    const currentVideoSeconds = await getVideoStateCount();
    if(limitVideoSeconds && currentVideoSeconds) {
        if(currentVideoSeconds >= limitVideoSeconds) {
            return true;
        }
    }

    return false;
}

/**
 * To get current audio state of organization
 * @returns A promise that resolves with an object and it can be null.
 */

export async function getAudioState() {
    const matrixClient = MatrixClientPeg.get();
    const homeserver_base_url = matrixClient.getHomeserverUrl();
    const hAccessToken = await matrixClient.getAccessToken();
    let audioResp;
    try{
        const currentAudioResp = await (await fetch(homeserver_base_url + "/api/apps/org/v1/count/audio", {
            method: "GET",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + hAccessToken,
            }
        })).json();
        audioResp = currentAudioResp.obj;
    } catch(error) {

    }

    return audioResp;
}

/**
 * To get audio limits of organization
 * @returns A promise that resolves with an object and it can not be null.
 */
export async function getAudioLimits() {
    let audioState = {
        support: true,
        limit: null,
    };

    let bookLimit = await toGetBookInfos();

    if(bookLimit?.audio) {
        audioState = bookLimit.audio;
    }

    return audioState;
}

export async function isAudioSupported() {
    const audioInfo = await getAudioLimits();
    return audioInfo.support;
}

export async function getAudioLimitCount() {
    const audioInfo = await getAudioLimits();
    if(audioInfo.limit) {
        return parseFloat(audioInfo.limit) * 60;
    }
    return null;
}

async function getAudioStateCount() {
    const currentAudioInfo = await getAudioState();
    if(currentAudioInfo) {
        return currentAudioInfo.countAudio;
    } else {
        return null;
    }
}

export async function isAudioOutOfLimits() {
    const limitAudioSeconds = await getAudioLimitCount();
    const currentAudioSeconds = await getAudioStateCount();
    if(limitAudioSeconds && currentAudioSeconds) {
        if(currentAudioSeconds >= limitAudioSeconds) {
            return true;
        }
    }

    return false;
}
