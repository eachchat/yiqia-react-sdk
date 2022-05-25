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

export enum TelephoneType {
    CELL = "CELL",
    WORK = "WORK",
    HOME = "HOME",
    OTHER = "OTHER",
}

export enum AddressType {
    WORK = "WORK",
    HOME = "HOME",
    OTHER = "OTHER",
}

export enum EmailType {
    WORK = "WORK",
    HOME = "HOME",
    OTHER = "OTHER",
}

export enum DateType {
    BDAY = "BDAY",
    ANNIVERSARY = "ANNIVERSARY",
    OTHER = "OTHER",
}

export enum ImType {
    qq = "qq",
    WhatsApp = "WhatsApp",
    Teams = "Teams",
    Messenger = "Messenger",
    Telegram = "Telegram",
    Facebook = "Facebook",
    Skype = "Skype",
}

export interface Email {
    id: number;
    contactId: number;
    value: string;
    type: EmailType;
}

export interface Date {
    id: number;
    contactId: number;
    value: string;
    type: DateType;
}

export interface Url {
    id: number;
    contactId: number;
    value: string;
}

export interface Im {
    id: number;
    contactId: number;
    value: string;
    type: ImType;
}

export interface Address {
    id: number;
    contactId: number;
    country: string; //"国家",
    streetAddress: string; //"街道",
    locality: string; //"城市",
    region: string; //"直辖市",
    postalCode: string;
    label: string;
    type: AddressType;
    encoding: any;
    charset: any;
    subLocality: string;
}

export interface Phone {
    id: number;
    contactId: number;
    value: string;
    type: TelephoneType
}

export class UserModal {
    public static UserModelInterface: UserModal;
    public id: number;
    public formattedName: string;
    public nickName: string; //"昵称",
    public nkEncoding: any;
    public nkCharset: any;
    public family: string; //"姓氏",
    public fnEncoding: any;
    public fnCharset: any;
    public given: string; //"名字",
    public prefixes: string; //"姓氏拼音",
    public suffixes: string; //"名字拼音",
    public additionalName: string; //"中间名拼音",
    public organization: string; //"公司",
    public orgEncoding: any;
    public orgCharset: any;
    public department: string; //"部门",
    public title: string; //"职位",
    public titleEncoding: string;
    public titleCharset: string;
    public categories: string; //"标签",
    public del: number;
    public nEncoding: any;
    public nCharset: any;
    public userId: string; // owner uid
    public matrixId: string; //"@junjunyu",
    public note: string; //"备注",
    public noteEncoding: any;
    public noteCharset: any;
    public photoData: any;
    public photoUrl: string;
    public photoType: string; //"JPEG",
    public updateTimestamp: number;
    public telephoneList: Phone[];
    public phoneNumbers?: Phone[];
    public addressList: Address[]
    public addresses?: Address[];
    public emailList: Email[];
    public emails?: Email[];
    public dateList: Date[];
    public urlList: Url[];
    public imppList: Im[];
    public ims?: Im[];
    public contactId?: string;
    public photo: string; //"base64编码"
    public firstName: string; //"姓氏拼音",
    public middleName: string; //"中间名拼音",
    public lastName: string; //"名字拼音"
    public room: Room;
    public displayName: string;

    constructor(userId?: string, displayName?: string, avatarTUrl?: string, displayNamePy?: string) {
        this.matrixId = userId;
        this.nickName = displayName || "";
        this.photoUrl = avatarTUrl || "";
        this.firstName = displayNamePy || "";
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
            this.organization = gmsContact.contactCompany;
        }
        if(gmsContact.contactEmail.trim().length !== 0) {
            const emailItem:Email = {
                value: gmsContact.contactEmail,
                type: null,
                id: 0,
                contactId: 0
            }
            this.emailList.push(emailItem);
        }
        if(gmsContact.contactMobile.trim().length !== 0) {
            const mobileItem:Phone = {
                value: gmsContact.contactMobile.trim(),
                id: 0,
                contactId: 0,
                type: null,
            }
            this.telephoneList.push(mobileItem);
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
        if(!this.title) {
            return YIQIA_LOADING;
        }
        return this.title;
    }

    public set DisplayName(gmsDisplayName: string) {
        if(gmsDisplayName) this.nickName = gmsDisplayName;
    }

    public get DisplayName() {
        return this.nickName || this.displayName;
    }

    public get DisplayNamePy() {
        if(this.firstName) {
            return this.firstName;
        } else {
            return this.matrixId.slice(1,2);
        }
    }

    public create2Model(key, value) {
        console.log("key is ", key);
        console.log("value is ", value);
        switch(key){
            case "telephone":
                break;
            case "email":
                break;
            case "address":
                break;
            case "url":
                break;
            case "impp":
                break;
            case "date":
                break;
            case "family":
                this.family = value;
                break;
            case "given":
                this.given = value;
                break;
            case "matrixId":
                this.matrixId = value;
                break;
            case "prefixes":
                this.prefixes = value;
                break;
            case "additionalName":
                this.additionalName = value;
                break;
            case "suffixes":
                this.suffixes = value;
                break;
            case "nickName":
                this.nickName = value;
                break;
            case "organization":
                this.organization = value;
                break;
            case "title":
                this.title = value;
                break;
            case "note":
                this.note = value;
                break;
            case "categories":
                this.categories = value;
                break;
            default:
                break;
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