import { AttachmentBookInfo, AttachmentState, bookInfoParse, bookInfos } from "../../models/YiqiaModels";
import SdkConfig from "../../SdkConfig";
import { AuthApi } from "./YiqiaRequestInterface";
import { toGetBookInfos } from "./YiqiaUtils";

export class YiqiaAttachmentLimit {
    private static AttachmentLimitInstance;
    constructor() {
    }

    public static get Instance():YiqiaAttachmentLimit {
        if(!this.AttachmentLimitInstance) {
            return YiqiaAttachmentLimit.AttachmentLimitInstance = new YiqiaAttachmentLimit();
        }
        return YiqiaAttachmentLimit.AttachmentLimitInstance;
    }

    /**
     * To get current attachment state of organization
     * @returns A promise that resolves with an object and it can be null.
     */
    private async getAttachmentState():Promise<AttachmentState> {
        let currentAttachmentInfo;
        try{
            currentAttachmentInfo = await AuthApi.Instance.fetchAttachmentState();
        } catch(error) {
        }

        if(currentAttachmentInfo && currentAttachmentInfo.countMedia) {
            return currentAttachmentInfo;
        } else {
            return null;
        }
    }

    /**
     * To get attachment limits of organization
     * @returns A promise that resolves with an object and it can not be null.
     */
    private async getAttachmentLimits(): Promise<AttachmentBookInfo> {
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

    public async isAttachmentSupported() {
        const attachmentInfo = await this.getAttachmentLimits();
        return attachmentInfo.support;
    }

    async getAttachmentStateCount() {
        const currentAttachmentInfo = await this.getAttachmentState();
        if(currentAttachmentInfo) {
            return currentAttachmentInfo.countMedia;
        } else {
            return null;
        }
    }
    
    async getAttatchmentLimitCount() {
        const attachmentInfo = await this.getAttachmentLimits();
        if(attachmentInfo.limit) {
            return parseFloat(attachmentInfo.limit) * 1024 * 1024 * 1024
        }
        return null;
    }

    async isAttachmentOutOfLimits() {
        const limitAttachmentByte = await this.getAttatchmentLimitCount();
        const currentAttachmentByte = await this.getAttachmentStateCount();
        if(currentAttachmentByte && limitAttachmentByte) {
            if(currentAttachmentByte >= limitAttachmentByte) {
                return true;
            }
        }

        return false;
    }

    async isTheUploadingOutOfLimits(files) {
        const limitAttachmentByte = await this.getAttatchmentLimitCount();
        const currentAttachmentByte = await this.getAttachmentStateCount();
        let totalSize = 0;
        for (let i = 0; i < files.length; i++) {
            totalSize = totalSize + files[i].size;
        }
        
        if(currentAttachmentByte && limitAttachmentByte && (totalSize >= limitAttachmentByte - currentAttachmentByte)) {
            return true;
        }

        return false;
    }
}