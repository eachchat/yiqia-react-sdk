import { AudioBookInfo, AudioState, bookInfos, VideoBookInfo, VideoState } from "../../models/YiqiaModels";
import SdkConfig from "../../SdkConfig";
import { AuthApi } from "./YiqiaRequestInterface";
import { toGetBookInfos } from "./YiqiaUtils";

enum VoIPType {
    Video,
    Audio,
};

export class YiqiaVoIPLimit {
    private static VoIPLimitInstance;
    constructor() {
    }

    public static get Instance():YiqiaVoIPLimit {
        if(!this.VoIPLimitInstance) {
            return YiqiaVoIPLimit.VoIPLimitInstance = new YiqiaVoIPLimit();
        }
        return YiqiaVoIPLimit.VoIPLimitInstance;
    }

    /**
     * To get current video state of organization
     * @returns A promise that resolves with an object and it can be null.
     */
    private async getVideoState():Promise<VideoState> {
        let currentVideoInfo;
        try{
            currentVideoInfo = await AuthApi.Instance.fetchVideoState();
        } catch(error) {
        }

        if(currentVideoInfo && currentVideoInfo.countVideo) {
            return currentVideoInfo;
        } else {
            return null;
        }
    }

    private async getVoIPLimits(type: VoIPType): Promise<VideoBookInfo | AudioBookInfo> {
        let VoIPLimit = {
            support: true,
            limit: null,
        };

        let bookLimit = await toGetBookInfos();

        if(type == VoIPType.Video && bookLimit?.video) {
            VoIPLimit = bookLimit.video;
        } else {
            VoIPLimit = bookLimit.audio;
        }

        return VoIPLimit;
    }

    public async isVideoSupported() {
        const videoInfo = await this.getVoIPLimits(VoIPType.Video);
        return videoInfo.support;
    }

    private async getVideoLimitCount() {
        const videoInfo = await this.getVoIPLimits(VoIPType.Video);
        if(videoInfo.limit) {
            return parseFloat(videoInfo.limit) * 60;
        }
        return null;
    }

    private async getVideoStateCount() {
        const currentVideoInfo = await this.getVideoState();
        if(currentVideoInfo) {
            return currentVideoInfo.countVideo;
        } else {
            return null;
        }
    }

    public async isVideoOutOfLimits() {
        const limitVideoSeconds = await this.getVideoLimitCount();
        const currentVideoSeconds = await this.getVideoStateCount();
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

    private async getAudioState():Promise<AudioState> {
        let currentAudioInfo;
        try{
            currentAudioInfo = await AuthApi.Instance.fetchAudioState();
        } catch(error) {
        }

        if(currentAudioInfo && currentAudioInfo.countAudio) {
            return currentAudioInfo;
        } else {
            return null;
        }
    }

    public async isAudioSupported() {
        const audioInfo = await this.getVoIPLimits(VoIPType.Audio);
        return audioInfo.support;
    }

    private async getAudioLimitCount() {
        const audioInfo = await this.getVoIPLimits(VoIPType.Audio);
        if(audioInfo.limit) {
            return parseFloat(audioInfo.limit) * 60;
        }
        return null;
    }

    private async getAudioStateCount() {
        const currentAudioInfo = await this.getAudioState();
        if(currentAudioInfo) {
            return currentAudioInfo.countAudio;
        } else {
            return null;
        }
    }

    public async isAudioOutOfLimits() {
        const limitAudioSeconds = await this.getAudioLimitCount();
        const currentAudioSeconds = await this.getAudioStateCount();
        if(limitAudioSeconds && currentAudioSeconds) {
            if(currentAudioSeconds >= limitAudioSeconds) {
                return true;
            }
        }

        return false;
    }

}