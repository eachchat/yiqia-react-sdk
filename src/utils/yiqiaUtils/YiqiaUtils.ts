import { bookInfoParse, bookInfos } from "../../models/YiqiaModels";
import SdkConfig from "../../SdkConfig";
import { AuthApi } from "./YiqiaRequestInterface";

export async function updateBookInfos(): Promise<bookInfos> {
    const bookLimitResp = await AuthApi.Instance.fetchBookInfos();
    const bookLimitInstance = new bookInfoParse(bookLimitResp);
    let bookLimit = bookLimitInstance.dealedData;
    localStorage.setItem("yiqia-book-info", JSON.stringify(bookLimit));
    return bookLimit;
}

export async function toGetBookInfos(): Promise<bookInfos> {
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
        bookLimit = await updateBookInfos();
    } else {
        const lastUpdateTime = parseInt(bookLimit.lastUpdateTime);
        const currentTime = new Date().getTime();
        const configureInterval = SdkConfig.get()["gmsUpdateInterval"] ? SdkConfig.get()["gmsUpdateInterval"] : 10 * 60 * 1000;
        
        const theInterval = parseInt(configureInterval);

        if(currentTime - lastUpdateTime > theInterval) {
            bookLimit = await updateBookInfos();
        }
    }

    return bookLimit;
}