export interface DepartmentModal {
    id: string;
    displayName: string;
    showOrder: number;
    parendId: string;
    parentName: string;
    directorId: string;
    adminId: string;
    level: number;
    departmentType: string;
}

export interface UserModal {
    id: string;
    departmentId: string;
    managerId: string;
    userName: string;
    name: {
        familyName: string;
        giverName: string;
        middleName: string;
    };
    displayName: string;
    nickName: string;
    remarkName: string;
    avatarOUrl: string;
    avatarTUrl: string;
    emails: {
        value: string;
        type: string;
        primary: boolean
    }[];
    addresses: {
        type: string;
        streetAddress: string;
        locality: string;
        region: string;
        postalCode: string;
        country: string;
    }[];
    phoneNumbers: {
        value: string;
        type: string;
    }[];
    ims: {
        value: string;
        type: string;
    }[];
    gender: number;
    title: string;
    workDescription: string;
    statusDescription: string;
    enableMessageInform: boolean;
    manageTeam: boolean;
    manager: boolean;
}

export interface AttachmentBookInfo {
    support: boolean;
    limit: string;
}

export interface VideoBookInfo {
    support: boolean;
    limit: string;
}

export interface AudioBookInfo {
    support: boolean;
    limit: string;
}

export interface bookInfos {
    contact: {
        support: boolean,
    },
    group: {
        support: boolean,
    },
    org: {
        support: boolean,
    },
    audio: {
        support: boolean,
        limit: string,
    },
    video: {
        support: boolean,
        limit: string,
    },
    attachment: AttachmentBookInfo,
    lastUpdateTime: string,
}

export class bookInfoParse {
    private fianlData;
    constructor(bookInfoResp) {
        this.fianlData = this.parse(bookInfoResp);
    }

    public get dealedData() {
        return this.fianlData;
    }

    private parse(originalData):bookInfos {
        const newInfo = {
            contact: {
                support: originalData.book?.contactSwitch,
            },
            group: {
                support: originalData.book?.groupSwitch,
            },
            org: {
                support: originalData.book?.orgSwitch,
            },
            audio: {
                support: originalData.im?.audioSwitch,
                limit: originalData.im?.audioLimit,
            },
            video: {
                support: originalData.im?.videoSwitch,
                limit: originalData.im?.videoLimit,
            },
            attachment: {
                support: true,
                limit: originalData.im?.uploadLimit,
            },
            lastUpdateTime: String(new Date().getTime()),
        };
        return newInfo;
    }
}

export interface AttachmentState {
    countMedia: number;
}

export interface VideoState {
    countVideo: number;
}

export interface AudioState {
    countAudio: number;
}
