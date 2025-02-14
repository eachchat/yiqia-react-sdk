import { string } from "prop-types";
import { DepartmentModal, UserModal, Phone, Address } from "../../models/YiqiaModels";
import { YiqiaContactContactStore } from "../../stores/YiqiaContactContactStore";
import YiqiaOrganizationStore from "../../stores/YiqiaOrganizationStore";
import { arrayFastClone } from "../arrays";
import { objectClone } from "../objects";
import { AuthApi } from "./YiqiaRequestInterface";

interface operateContact {
    family: string, //"姓氏",
    matrixId: string, //"@junjunyu",
    given: string, //"名字",
    prefixes: string, //"姓氏拼音",
    suffixes: string, //"名字拼音",
    additionalName: string, //"中间名拼音",
    nickName: string, //"昵称",
    organization: string, //"公司",
    department: string, //"部门",
    title: string, //"职位",
    telephoneList: {
        value: string, //"电话",
        type: string, //"work"
    }[],
    emailList: {
        value: string, //"email",
        type: string, //"work"
    }[],
    addressList: Address[],
    imppList: {
        type: string, //"facebook",
        value: string, //"123456"
    }[],
    urlList: {
        value: string, //"sina.com"
    }[],
    dateList:{
        value: string, //"1980-09-18",
        type: string, //"BDAY"
    }[],
    note: string, //"备注",
    categories: string, //"标签",
    photo: string, //"base64编码"
    photoType: string, //"JPEG",
    photoUrl: string,
    firstName:  string, //"姓氏拼音",
    middleName:  string, //"中间名拼音",
    lastName:  string, //"名字拼音"
};

export class YiqiaContact {
    private static YiqiaContactInstance;
    private lastUpdateTime:number = 0;
    constructor() {

    }

    public static get Instance() {
        if(!this.YiqiaContactInstance) {
            this.YiqiaContactInstance = new YiqiaContact();
        }
        return this.YiqiaContactInstance;
    }

    public yiqiaGmsInfoFromMatrixId(matrixId): Promise<UserModal> {
        return AuthApi.Instance.contactGmsInfoFromMatrixId(matrixId)
            .then(resp => {
                if(resp && resp.code == 200 && resp.obj) {
                    return resp.obj;
                } else {
                    return null;
                }
            })
            .catch((err) => {
                console.log("err ", err);
                return null;
            })
    }

    public yiqiaGmsSearch(term): Promise<UserModal> {
        return AuthApi.Instance.contactSearch(
                {
                    keyword: term.trim(),
                },
            )
            .then((resp) => {
                if(resp && resp.code == 200 && resp.results) {
                    return resp.results;
                } else {
                    return [];
                }
            })
            .catch((err) => {
                console.log("err ", err);
                return [];
            })
    }

    public async yiqiaOrgMembers(): Promise<UserModal[]> {
        const maxTimes = 500;
        let sequenceId = 0;
        let hasNext = true;
        let fetchTimes = 0;
        let finalList = [];
        while(hasNext) {
            fetchTimes++;
            const params = {
                name: "updateUser",
                updateTime: 0,
                perPage: 50,
                sequenceId: sequenceId,
            };
            const resp = await AuthApi.Instance.contactOrgContact(params);

            if(resp && resp.code == 200 && resp.results) {
                this.lastUpdateTime = resp.obj.updateTime;
                finalList = finalList.concat(resp.results);
                sequenceId = finalList.length;
                if(sequenceId >= resp.total) {
                    hasNext = false;
                }
            } else {
                return finalList;
            }
            if(fetchTimes > maxTimes) {
                return finalList;
            }
        }
        return finalList;
    }

    public async yiqiaContactContacts(): Promise<UserModal[]> {
        const maxTimes = 10;
        let sequenceId = 0;
        let hasNext = true;
        let fetchTimes = 0;
        let finalList = [];
        while(hasNext) {
            fetchTimes++;
            const params = {
                updateTime: 0,
                perPage: 50,
                sequenceId: sequenceId,
            };
            const resp = await AuthApi.Instance.contactGmsContact(params);

            if(resp && resp.code == 200 && resp.results) {
                this.lastUpdateTime = resp.obj.updateTime;
                finalList = finalList.concat(resp.results);
                sequenceId = finalList.length;
                if(sequenceId >= resp.total) {
                    hasNext = false;
                }
            } else {
                return finalList;
            }
            if(fetchTimes > maxTimes) {
                return finalList;
            }
        }
        return finalList;
    }

    public async yiqiaOrganization(departmentId): Promise<DepartmentModal> {
        const resp = await AuthApi.Instance.contactOrganization(departmentId);
        if(resp && resp.code == 200 && resp.results) {
            return resp.results
        } else {
            return null;
        }
    }

    public async yiqiaOrganizationInfo(): Promise<any> {
        const maxTimes = 10;
        let sequenceId = 0;
        let hasNext = true;
        let fetchTimes = 0;
        let finalList = [];
        while(hasNext) {
            fetchTimes++;
            const params = {
                filters: undefined,
                perPage: undefined,
                sortOrder: 1,
                sequenceId: sequenceId
              };
            const resp = await AuthApi.Instance.contactOrganizationInfo(params);

            console.log("=========resp ", resp);

            if(resp && resp.code == 200 && resp.results) {
                this.lastUpdateTime = resp.obj.updateTime;
                finalList = finalList.concat(resp.results);
                sequenceId = finalList.length;
                if(sequenceId >= resp.total) {
                    hasNext = false;
                }
            } else {
                return finalList;
            }
            if(fetchTimes > maxTimes) {
                return finalList;
            }
        }
        return finalList;
    }
    
    public async yiqiaAllOrganizationMemberInfo(): Promise<any> {
        const maxTimes = 30;
        let sequenceId = 0;
        let hasNext = true;
        let fetchTimes = 0;
        let finalList = [];
        while(hasNext) {
            fetchTimes++;
            const params = {
                filters: undefined,
                perPage: undefined,
                sortOrder: 1,
                sequenceId: sequenceId
              };
            const resp = await AuthApi.Instance.contactOrganizationMemberInfo(params);

            console.log("=========resp ", resp);

            if(resp && resp.code == 200 && resp.results) {
                this.lastUpdateTime = resp.obj.updateTime;
                finalList = finalList.concat(resp.results);
                sequenceId = finalList.length;
                if(sequenceId >= resp.total) {
                    hasNext = false;
                }
            } else {
                return finalList;
            }
            if(fetchTimes > maxTimes) {
                return finalList;
            }
        }
        return finalList;
    }
    
    
    public async yiqiaOrganizationMember(userId): Promise<UserModal[]> {
        const maxTimes = 30;
        let page = 1;
        let sequenceId = 0;
        let hasNext = true;
        let fetchTimes = 0;
        let finalList = [];
        while(hasNext) {
            fetchTimes++;
            const params = {
                filters: {
                    field: "userName",
                    operator: "eq",
                    logic: 0,
                    value: userId,
                },
                perPage: undefined,
                sortOrder: 1,
                sequenceId: sequenceId
              };
            const resp = await AuthApi.Instance.contactOrganizationMember(params);

            if(resp && resp.code == 200 && resp.results) {
                finalList = finalList.concat(resp.results);
                page = page + 1;
                if(finalList.length >= resp.total) {
                    hasNext = false;
                }
            } else {
                return finalList;
            }
            if(fetchTimes > maxTimes) {
                return finalList;
            }
        }
        return finalList;
    }

    public async yiqiaOrganizationMemberInfo(departmentId): Promise<UserModal[]> {
        const maxTimes = 30;
        let page = 1;
        let hasNext = true;
        let fetchTimes = 0;
        let finalList = [];
        while(hasNext) {
            fetchTimes++;
            const params = {
                perPage: 50,
                departmentId: departmentId,
                page: page
              };
            const resp = await AuthApi.Instance.contactOrganizationMemberInfo(params);

            if(resp && resp.code == 200 && resp.results) {
                finalList = finalList.concat(resp.results);
                page = page + 1;
                if(finalList.length >= resp.total) {
                    hasNext = false;
                }
            } else {
                return finalList;
            }
            if(fetchTimes > maxTimes) {
                return finalList;
            }
        }
        return finalList;
    }

    public async yiqiaContactImport(file): Promise<boolean> {
        let formdata = new FormData();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async(ev: ProgressEvent<FileReader>) => {
                formdata.append("fileName", file);
                const resp = await AuthApi.Instance.contactImport(formdata);
                resolve(true);
            }
            reader.readAsArrayBuffer(file);
        })
    }
    
    public async yiqiaContactExport(): Promise<any> {
        return AuthApi.Instance.contactExport().then((resp) => {
                return resp;
            })
            .catch((error) => {
                console.log("error is ", error);
                return null;
            })
    }

    public async yiqiaContactAdd(contactInfo:UserModal): Promise<boolean> {
        // const body:operateContact = {
        //     family: contactInfo.family,
        //     middleName: contactInfo.middleName,
        //     given: contactInfo.given,
        //     matrixId: contactInfo.matrixId,
        //     prefixes: contactInfo.prefixes,
        //     suffixes: contactInfo.suffixes,
        //     additionalName: contactInfo.additionalName,
        //     nickName: contactInfo.nickName,
        //     organization: contactInfo.organization,
        //     department: contactInfo.department,
        //     title: contactInfo.title,
        //     telephoneList: arrayFastClone(contactInfo.telephoneList),
        //     emailList: arrayFastClone(contactInfo.emailList),
        //     addressList: arrayFastClone(contactInfo.addressList),
        //     imppList: arrayFastClone(contactInfo.imppList),
        //     urlList: arrayFastClone(contactInfo.urlList),
        //     dateList: arrayFastClone(contactInfo.dateList),
        //     note: "",
        //     categories: "",
        //     photo: "",
        //     photoType: "",
        //     firstName: "",
        //     photoUrl: contactInfo.photoUrl,
        //     lastName: ""
        // }
        // function DisplayNamePy(contactInfo) {
        //     if(contactInfo.firstName && contactInfo.firstName.length > 0) {
        //         return contactInfo.firstName;
        //     } else if(contactInfo.matrixId) {
        //         return contactInfo.matrixId?.slice(1,2);
        //     } else {
        //         return null;
        //     }
        // };

        const newContactInfo = Object.assign({}, contactInfo, {room: null})
        console.log("contactInfo ", newContactInfo);
        const body = objectClone(newContactInfo);
        if(contactInfo.nickName) body.nickName = contactInfo.nickName;
        else if(contactInfo.family && contactInfo.given) body.nickName = contactInfo.family+contactInfo.given;
        else if(YiqiaOrganizationStore.Instance.getOrgInfo(contactInfo)) body.nickName = YiqiaOrganizationStore.Instance.getOrgInfo(contactInfo).displayName;
        else body.nickName = contactInfo.matrixId.split(":")[0].slice(1) || contactInfo.DisplayNamePy || contactInfo.prefixes+contactInfo.suffixes;
        if(typeof contactInfo.department != "string") body.department = contactInfo.department.name;
        body.prefixes = contactInfo.prefixes;
        body.telephoneList = contactInfo.phoneNumbers || contactInfo.telephoneList;
        body.emailList = contactInfo.emails || contactInfo.emailList;
        body.addressList = contactInfo.addresses || contactInfo.addressList;
        body.imppList = contactInfo.ims || contactInfo.imppList;
        body.urlList = contactInfo.urlList;
        body.organization = YiqiaOrganizationStore.Instance.getOrgInfoFromHead(contactInfo);
        console.log("======= body ", body);
        return AuthApi.Instance.addContact(body).then((resp) => {
                return resp;
            })
            .catch((error) => {
                console.log("error is ", error);
                return null;
            })
    }

    public async yiqiaContactUpdate(contactInfo:UserModal): Promise<boolean> {
        // const body:operateContact = {
        //     family: contactInfo.family,
        //     middleName: contactInfo.middleName,
        //     given: contactInfo.given,
        //     matrixId: contactInfo.matrixId,
        //     prefixes: contactInfo.prefixes,
        //     suffixes: contactInfo.suffixes,
        //     additionalName: contactInfo.additionalName,
        //     nickName: contactInfo.nickName,
        //     organization: contactInfo.organization,
        //     department: contactInfo.department,
        //     title: contactInfo.title,
        //     telephoneList: arrayFastClone(contactInfo.telephoneList),
        //     emailList: arrayFastClone(contactInfo.emailList),
        //     addressList: arrayFastClone(contactInfo.addressList),
        //     imppList: arrayFastClone(contactInfo.imppList),
        //     urlList: arrayFastClone(contactInfo.urlList),
        //     dateList: arrayFastClone(contactInfo.dateList),
        //     note: "",
        //     categories: "",
        //     photo: "",
        //     photoType: "",
        //     firstName: "",
        //     photoUrl: contactInfo.photoUrl,
        //     lastName: ""
        // }

        const newContactInfo = Object.assign({}, contactInfo, {room: null})
        console.log("contactInfo ", newContactInfo);
        const body = objectClone(newContactInfo);
        if(contactInfo.nickName) body.nickName = contactInfo.nickName;
        else if(contactInfo.family && contactInfo.given) body.nickName = contactInfo.family+contactInfo.given;
        else if(YiqiaOrganizationStore.Instance.getOrgInfo(contactInfo)) body.nickName = YiqiaOrganizationStore.Instance.getOrgInfo(contactInfo).displayName;
        else body.nickName = contactInfo.matrixId.split(":")[0].slice(1) || contactInfo.DisplayNamePy || contactInfo.prefixes+contactInfo.suffixes;
        if(typeof contactInfo.department != "string") body.department = contactInfo.department?.name;
        body.prefixes = contactInfo.prefixes;
        body.telephoneList = contactInfo.phoneNumbers || contactInfo.telephoneList;
        body.emailList = contactInfo.emails || contactInfo.emailList;
        body.addressList = contactInfo.addresses || contactInfo.addressList;
        body.imppList = contactInfo.ims || contactInfo.imppList;
        body.urlList = contactInfo.urlList;
        console.log("======= body ", body);
        return AuthApi.Instance.editContact(body).then((resp) => {
                return resp;
            })
            .catch((error) => {
                console.log("error is ", error);
                return null;
            })
    }

    public async yiqiaContactRemove(contactInfo:UserModal): Promise<boolean> {
        // const body:operateContact = {
        //     family: contactInfo.family,
        //     middleName: contactInfo.middleName,
        //     given: contactInfo.given,
        //     matrixId: contactInfo.matrixId,
        //     prefixes: contactInfo.prefixes,
        //     suffixes: contactInfo.suffixes,
        //     additionalName: contactInfo.additionalName,
        //     nickName: contactInfo.nickName,
        //     organization: contactInfo.organization,
        //     department: contactInfo.department,
        //     title: contactInfo.title,
        //     telephoneList: arrayFastClone(contactInfo.telephoneList),
        //     emailList: arrayFastClone(contactInfo.emailList),
        //     addressList: arrayFastClone(contactInfo.addressList),
        //     imppList: arrayFastClone(contactInfo.imppList),
        //     urlList: arrayFastClone(contactInfo.urlList),
        //     dateList: arrayFastClone(contactInfo.dateList),
        //     note: "",
        //     categories: "",
        //     photo: "",
        //     photoType: "",
        //     firstName: "",
        //     photoUrl: contactInfo.photoUrl,
        //     lastName: ""
        // }
        console.log("id is ", contactInfo);
        const gmsContact = YiqiaContactContactStore.Instance.getContact(contactInfo);
        return AuthApi.Instance.deleteContact(gmsContact.id).then((resp) => {
                return resp;
            })
            .catch((error) => {
                console.log("error is ", error);
                return null;
            })
    }
}