import { Room } from "matrix-js-sdk/src/models/room";

/**
 * 
          department_id: types.string,
          parent_id:     types.string,
          display_name:  types.string,
          description:   types.string,
          director_id:   types.string,
          admin_id:      types.string,
          del:           types.integer,
          show_order:    types.integer,
          updatetime:    types.integer,
          department_type: types.string
 */
export interface DepartmentModal {
    id: string;
    name: string;
    parendId: string;
    children: DepartmentModal[];
    users: UserModal[];
}

export const YIQIA_LOADING = Symbol("yiqia_loading");

export interface GmsContact {
    contactCompany: string;
    contactEmail: string;
    contactId: string;
    contactMatrixId: string;
    contactMobile: string;
    contactRemarkName: string;
    contactTelephone: string;
    contactTitle: string;
    contactType: number;
    created: string;
    del: number;
    lastModified: null;
    matrixId: string;
    updateTimestamp: string;
    userId: string;
    valid: number;
}

export class UserModal {
    public aId: string;
    public active: boolean;
    public del: number;
    public id: string;
    public departmentId: string;
    public department: {
        displayName: string;
        departmentId: string;
    }
    public userName: string;
    public name: {
            familyName: string;
            giverName: string;
            middleName: string;
        };
    public displayName: string;
    public displayNamePy: string;
    public nickName: string;
    public remarkName: string;
    public avatarOUrl: string;
    public avatarTUrl: string;
    public emails: {
            value: string;
            type: string;
            primary: boolean
        }[];
    public addresses: {
            type: string;
            streetAddress: string;
            locality: string;
            region: string;
            postalCode: string;
            country: string;
        }[];
    public phoneNumbers: {
            value: string;
            type: string;
        }[];
    public ims: {
            value: string;
            type: string;
        }[];
    public employeeNumber: number;
    public entitlements: null;
    public entryDate: string;
    public externalId: string;
    public gender: number;
    public title: string;
    public label: string;
    public workDescription: string;
    public statusDescription: string;
    public enableMessageInform: boolean;
    public manageTeam: boolean;
    public manager: boolean;
    public managerId: string;
    public matrixId: string;
    public updateTimestamp: string;
    public userType: string;
    public room: Room;

    constructor(userId: string, displayName?: string, avatarTUrl?: string, displayNamePy?: string) {
        this.matrixId = userId;
        this.displayName = displayName || "";
        this.avatarTUrl = avatarTUrl || "";
        this.displayNamePy = displayNamePy || "";
    }

    /**
     *  contactCompany: ""
        contactEmail: ""
        contactId: "18"
        contactMatrixId: "@chengfang:workly.ai"
        contactMobile: ""
        contactRemarkName: "程方正式"
        contactTelephone: ""
        contactTitle: ""
        contactType: 1
        created: "2021-06-07T09:48:58.000+0000"
        del: 0
        lastModified: null
        matrixId: "@wangxin:staging.eachchat.net"
        updateTimestamp: "1623059338183"
        userId: "00520195329223DY4qsA"
        valid: 1
     */
    public updateFromGmsContact(gmsContact:GmsContact) {
        if(gmsContact.matrixId.trim().length !== 0) {
            this.matrixId = gmsContact.matrixId;
        }
        if(gmsContact.contactCompany.trim().length !== 0) {
            this.department.displayName = gmsContact.contactCompany;
        }
        if(gmsContact.contactEmail.trim().length !== 0) {
            const emailItem = {
                value: gmsContact.contactEmail,
                type: "",
                primary: false,
            }
            this.emails.push(emailItem);
        }
        if(gmsContact.contactMobile.trim().length !== 0) {
            const mobileItem = {
                value: gmsContact.contactMobile.trim(),
                type: "mobile",
            }
            this.phoneNumbers.push(mobileItem);
        }
        if(gmsContact.contactTelephone.trim().length !== 0) {
            const mobileItem = {
                value: gmsContact.contactTelephone.trim(),
                type: "work",
            }
            this.phoneNumbers.push(mobileItem);
        }
        if(gmsContact.contactTitle.trim().length !== 0) {
            this.title = gmsContact.contactTitle;
        }
    }

    public updateProperty(gmsInfo:UserModal) {
        let needUpdate = false;
        for(const prop in gmsInfo) {
            if(gmsInfo[prop] !== this[prop]) {
                this[prop] = gmsInfo[prop] || this[prop];
                needUpdate = true;
            }
        }
        return needUpdate;
    }

    public set Room(room:Room) {
        this.room = room;
    }

    public get Room() {
        return this.room;
    }

    public get OrganizationInfo() {
        if(!this.workDescription) {
            return YIQIA_LOADING;
        }
        return this.workDescription;
    }

    public set DisplayName(gmsDisplayName: string) {
        this.displayName = gmsDisplayName;
    }

    public get DisplayName() {
        return this.displayName;
    }

    public get DisplayNamePy() {
        if(this.displayNamePy) {
            return this.displayNamePy;
        } else {
            return this.matrixId.slice(1,2);
        }
    }
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

export enum ContactTagId {
    Recent = "yiqia_recent",
    Contact = "yiqia_contact",
    Organization = "yiqia_organization",
    Teams = "yiqia_teams",
}