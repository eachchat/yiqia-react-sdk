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
        toFetchBookInfos();
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